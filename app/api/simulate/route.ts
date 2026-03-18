import { Groq } from 'groq-sdk';
import { Bracket, Game, createInitialBracket, calculateWinProbability } from '@/lib/bracket-data';

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const maxDuration = 300;

interface SimulationUpdate {
  type: 'game_completed' | 'round_started' | 'tournament_complete' | 'status';
  gameId?: string;
  bracket?: Bracket;
  round?: string;
  message?: string;
}

async function simulateGame(game: Game): Promise<{ winner: string; reasoning: string }> {
  const prompt = `You are an elite March Madness analyst. Predict the winner of this matchup.

${game.homeTeam.name} (${game.homeTeam.seed} seed)
KenPom: #${game.homeTeam.kenpom}, AdjEM: +${game.homeTeam.adjEM}
Off: ${game.homeTeam.adjO.toFixed(1)} | Def: ${game.homeTeam.adjD.toFixed(1)}

vs

${game.awayTeam.name} (${game.awayTeam.seed} seed)
KenPom: #${game.awayTeam.kenpom}, AdjEM: +${game.awayTeam.adjEM}
Off: ${game.awayTeam.adjO.toFixed(1)} | Def: ${game.awayTeam.adjD.toFixed(1)}

Respond with ONLY valid JSON:
{"winner": "${game.homeTeam.name}" or "${game.awayTeam.name}", "reasoning": "brief explanation"}`;

  const message = await client.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'mixtral-8x7b-32768',
    temperature: 0.7,
    max_tokens: 200,
  });

  const content = message.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from Groq');
  }

  const result = JSON.parse(content);
  return {
    winner: result.winner,
    reasoning: result.reasoning,
  };
}

function updateBracketWithResult(bracket: Bracket, gameId: string, winnerName: string, reasoning: string): Bracket {
  const newBracket = JSON.parse(JSON.stringify(bracket));
  const allGames = [
    ...newBracket.firstFour,
    ...newBracket.r64,
    ...newBracket.r32,
    ...newBracket.sweet16,
    ...newBracket.elite8,
    ...newBracket.finalFour,
    ...(newBracket.championship ? [newBracket.championship] : []),
  ];

  const game = allGames.find((g: Game) => g.id === gameId);
  if (!game) return newBracket;

  const winner = game.homeTeam.name === winnerName ? game.homeTeam : game.awayTeam;
  game.winner = winner;
  game.status = 'final';
  game.reasoning = reasoning;

  advanceWinnersToNextRound(newBracket);

  return newBracket;
}

function advanceWinnersToNextRound(bracket: Bracket): void {
  bracket.firstFour.forEach((ffGame, index) => {
    if (ffGame.winner && bracket.r64[index * 2]) {
      const r64Game = bracket.r64[index * 2];
      if (r64Game.homeTeam.id === 'florida') {
        r64Game.homeTeam = ffGame.winner;
      } else if (r64Game.awayTeam.id === 'florida') {
        r64Game.awayTeam = ffGame.winner;
      }
    }
  });

  const r64Winners = bracket.r64.filter((g) => g.winner && g.homeTeam.id !== 'florida');
  r64Winners.forEach((game, index) => {
    const r32Index = Math.floor(index / 2);
    if (bracket.r32[r32Index] && game.winner) {
      if (index % 2 === 0) {
        bracket.r32[r32Index].homeTeam = game.winner;
      } else {
        bracket.r32[r32Index].awayTeam = game.winner;
      }
      bracket.r32[r32Index].status = 'pending';
      if (bracket.r32[r32Index].winProbability === undefined) {
        bracket.r32[r32Index].winProbability = calculateWinProbability(
          bracket.r32[r32Index].homeTeam,
          bracket.r32[r32Index].awayTeam
        );
      }
    }
  });

  const r32Winners = bracket.r32.filter((g) => g.winner && g.homeTeam.id !== 'florida');
  r32Winners.forEach((game, index) => {
    const s16Index = Math.floor(index / 2);
    if (bracket.sweet16[s16Index] && game.winner) {
      if (index % 2 === 0) {
        bracket.sweet16[s16Index].homeTeam = game.winner;
      } else {
        bracket.sweet16[s16Index].awayTeam = game.winner;
      }
      bracket.sweet16[s16Index].status = 'pending';
      if (bracket.sweet16[s16Index].winProbability === undefined) {
        bracket.sweet16[s16Index].winProbability = calculateWinProbability(
          bracket.sweet16[s16Index].homeTeam,
          bracket.sweet16[s16Index].awayTeam
        );
      }
    }
  });

  const s16Winners = bracket.sweet16.filter((g) => g.winner && g.homeTeam.id !== 'florida');
  s16Winners.forEach((game, index) => {
    const e8Index = Math.floor(index / 2);
    if (bracket.elite8[e8Index] && game.winner) {
      if (index % 2 === 0) {
        bracket.elite8[e8Index].homeTeam = game.winner;
      } else {
        bracket.elite8[e8Index].awayTeam = game.winner;
      }
      bracket.elite8[e8Index].status = 'pending';
      if (bracket.elite8[e8Index].winProbability === undefined) {
        bracket.elite8[e8Index].winProbability = calculateWinProbability(
          bracket.elite8[e8Index].homeTeam,
          bracket.elite8[e8Index].awayTeam
        );
      }
    }
  });

  const e8Winners = bracket.elite8.filter((g) => g.winner && g.homeTeam.id !== 'florida');
  e8Winners.forEach((game, index) => {
    const ffIndex = Math.floor(index / 2);
    if (bracket.finalFour[ffIndex] && game.winner) {
      if (index % 2 === 0) {
        bracket.finalFour[ffIndex].homeTeam = game.winner;
      } else {
        bracket.finalFour[ffIndex].awayTeam = game.winner;
      }
      bracket.finalFour[ffIndex].status = 'pending';
      if (bracket.finalFour[ffIndex].winProbability === undefined) {
        bracket.finalFour[ffIndex].winProbability = calculateWinProbability(
          bracket.finalFour[ffIndex].homeTeam,
          bracket.finalFour[ffIndex].awayTeam
        );
      }
    }
  });

  const ffWinners = bracket.finalFour.filter((g) => g.winner && g.homeTeam.id !== 'florida');
  if (bracket.championship && ffWinners.length === 2) {
    bracket.championship.homeTeam = ffWinners[0].winner!;
    bracket.championship.awayTeam = ffWinners[1].winner!;
    bracket.championship.status = 'pending';
    if (bracket.championship.winProbability === undefined) {
      bracket.championship.winProbability = calculateWinProbability(
        bracket.championship.homeTeam,
        bracket.championship.awayTeam
      );
    }
  }
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  let bracket = createInitialBracket();

  bracket.firstFour = bracket.firstFour.map((g) => ({ ...g, status: 'in_progress' as const }));

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const rounds = [
          { name: 'First Four', games: bracket.firstFour },
          { name: 'Round of 64', games: bracket.r64 },
          { name: 'Round of 32', games: bracket.r32 },
          { name: 'Sweet 16', games: bracket.sweet16 },
          { name: 'Elite Eight', games: bracket.elite8 },
          { name: 'Final Four', games: bracket.finalFour },
          { name: 'Championship', games: bracket.championship ? [bracket.championship] : [] },
        ];

        for (const round of rounds) {
          for (const game of round.games) {
            if (!game || game.homeTeam.id === 'florida') continue;

            game.status = 'in_progress';

            await new Promise((resolve) => setTimeout(resolve, 300));

            try {
              const result = await simulateGame(game);
              bracket = updateBracketWithResult(bracket, game.id, result.winner, result.reasoning);

              const update: SimulationUpdate = {
                type: 'game_completed',
                gameId: game.id,
                bracket: bracket,
              };

              controller.enqueue(encoder.encode(JSON.stringify(update) + '\n'));
            } catch (error) {
              console.error(`Error simulating game ${game.id}:`, error);
            }
          }
        }

        const completeUpdate: SimulationUpdate = {
          type: 'tournament_complete',
          bracket: bracket,
        };
        controller.enqueue(encoder.encode(JSON.stringify(completeUpdate) + '\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
