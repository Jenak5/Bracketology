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
  // First Four → R64
  bracket.firstFour.forEach((ffGame, index) => {
    if (ffGame.winner) {
      const r64Index = index * 2;
      if (bracket.r64[r64Index]) {
        const r64Game = bracket.r64[r64Index];
        if (r64Game.homeTeam.id === 'florida') {
          r64Game.homeTeam = ffGame.winner;
        } else if (r64Game.awayTeam.id === 'florida') {
          r64Game.awayTeam = ffGame.winner;
        }
      }
    }
  });

  // R64 → R32: Pair winners sequentially
  let r32Index = 0;
  for (let i = 0; i < bracket.r64.length; i += 2) {
    const game1 = bracket.r64[i];
    const game2 = bracket.r64[i + 1];

    if (game1?.winner && game2?.winner && r32Index < bracket.r32.length) {
      bracket.r32[r32Index].homeTeam = game1.winner;
      bracket.r32[r32Index].awayTeam = game2.winner;
      bracket.r32[r32Index].status = 'pending';
      const probs = calculateWinProbability(
        bracket.r32[r32Index].homeTeam,
        bracket.r32[r32Index].awayTeam
      );
      bracket.r32[r32Index].winProbability = { home: probs.team1, away: probs.team2 };
      r32Index++;
    }
  }

  // R32 → Sweet 16: Pair winners sequentially
  let s16Index = 0;
  for (let i = 0; i < bracket.r32.length; i += 2) {
    const game1 = bracket.r32[i];
    const game2 = bracket.r32[i + 1];

    if (game1?.winner && game2?.winner && s16Index < bracket.sweet16.length) {
      bracket.sweet16[s16Index].homeTeam = game1.winner;
      bracket.sweet16[s16Index].awayTeam = game2.winner;
      bracket.sweet16[s16Index].status = 'pending';
      const probs = calculateWinProbability(
        bracket.sweet16[s16Index].homeTeam,
        bracket.sweet16[s16Index].awayTeam
      );
      bracket.sweet16[s16Index].winProbability = { home: probs.team1, away: probs.team2 };
      s16Index++;
    }
  }

  // Sweet 16 → Elite 8: Pair winners sequentially
  let e8Index = 0;
  for (let i = 0; i < bracket.sweet16.length; i += 2) {
    const game1 = bracket.sweet16[i];
    const game2 = bracket.sweet16[i + 1];

    if (game1?.winner && game2?.winner && e8Index < bracket.elite8.length) {
      bracket.elite8[e8Index].homeTeam = game1.winner;
      bracket.elite8[e8Index].awayTeam = game2.winner;
      bracket.elite8[e8Index].status = 'pending';
      const probs = calculateWinProbability(
        bracket.elite8[e8Index].homeTeam,
        bracket.elite8[e8Index].awayTeam
      );
      bracket.elite8[e8Index].winProbability = { home: probs.team1, away: probs.team2 };
      e8Index++;
    }
  }

  // Elite 8 → Final Four: Pair winners sequentially
  let ffIndex = 0;
  for (let i = 0; i < bracket.elite8.length; i += 2) {
    const game1 = bracket.elite8[i];
    const game2 = bracket.elite8[i + 1];

    if (game1?.winner && game2?.winner && ffIndex < bracket.finalFour.length) {
      bracket.finalFour[ffIndex].homeTeam = game1.winner;
      bracket.finalFour[ffIndex].awayTeam = game2.winner;
      bracket.finalFour[ffIndex].status = 'pending';
      const probs = calculateWinProbability(
        bracket.finalFour[ffIndex].homeTeam,
        bracket.finalFour[ffIndex].awayTeam
      );
      bracket.finalFour[ffIndex].winProbability = { home: probs.team1, away: probs.team2 };
      ffIndex++;
    }
  }

  // Final Four → Championship: Winners play for title
  if (bracket.finalFour[0]?.winner && bracket.finalFour[1]?.winner && bracket.championship) {
    bracket.championship.homeTeam = bracket.finalFour[0].winner;
    bracket.championship.awayTeam = bracket.finalFour[1].winner;
    bracket.championship.status = 'pending';
    const probs = calculateWinProbability(
      bracket.championship.homeTeam,
      bracket.championship.awayTeam
    );
    bracket.championship.winProbability = { home: probs.team1, away: probs.team2 };
  }
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  let bracket = createInitialBracket();

  bracket.firstFour = bracket.firstFour.map((g) => ({ ...g, status: 'in_progress' as const }));

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const roundSequence = [
          { name: 'First Four', key: 'firstFour' as const },
          { name: 'Round of 64', key: 'r64' as const },
          { name: 'Round of 32', key: 'r32' as const },
          { name: 'Sweet 16', key: 'sweet16' as const },
          { name: 'Elite Eight', key: 'elite8' as const },
          { name: 'Final Four', key: 'finalFour' as const },
          { name: 'Championship', key: 'championship' as const },
        ];

        for (const roundInfo of roundSequence) {
          const games =
            roundInfo.key === 'championship'
              ? bracket.championship
                ? [bracket.championship]
                : []
              : bracket[roundInfo.key];

          for (const game of games) {
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
