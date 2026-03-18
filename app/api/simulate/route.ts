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
  // Calculate win probability based on KenPom
  const emDiff = game.homeTeam.adjEM - game.awayTeam.adjEM;
  const homeProb = 1 / (1 + Math.pow(10, -emDiff / 11));
  const awayProb = 1 - homeProb;
  const homePercent = Math.round(homeProb * 100);
  const awayPercent = Math.round(awayProb * 100);

  // Randomly select winner based on win probability
  const random = Math.random();
  const winner = random < homeProb ? game.homeTeam : game.awayTeam;
  const winnerPercent = winner === game.homeTeam ? homePercent : awayPercent;

  // Generate reasoning based on the data
  const favored = homePercent > awayPercent ? game.homeTeam.name : game.awayTeam.name;
  const upset = winner === game.homeTeam ? homePercent < 50 : awayPercent < 50;

  let reasoning = '';
  if (upset) {
    reasoning = `${winner.name} pulls the upset! Despite ${favored} being favored (${Math.max(homePercent, awayPercent)}%), the seeding and tournament dynamics favor ${winner.name}.`;
  } else {
    reasoning = `${winner.name} advances as expected. Superior KenPom metrics (AdjEM: +${winner.adjEM}) give them the edge with ${winnerPercent}% win probability.`;
  }

  return {
    winner: winner.name,
    reasoning: reasoning,
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

  // Final Four → Championship
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

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const roundKeys: Array<[string, keyof Bracket]> = [
          ['First Four', 'firstFour'],
          ['Round of 64', 'r64'],
          ['Round of 32', 'r32'],
          ['Sweet 16', 'sweet16'],
          ['Elite Eight', 'elite8'],
          ['Final Four', 'finalFour'],
          ['Championship', 'championship'],
        ];

        for (const [roundName, roundKey] of roundKeys) {
          // Get fresh games from bracket each round
          let games = roundKey === 'championship'
            ? (bracket.championship ? [bracket.championship] : [])
            : bracket[roundKey];

          // Filter to only games with real teams (both home and away are not florida)
          const playableGames = games.filter(
            (g) => g && g.homeTeam.id !== 'florida' && g.awayTeam.id !== 'florida'
          );

          for (const game of playableGames) {
            if (!game || game.status === 'final') continue;

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
