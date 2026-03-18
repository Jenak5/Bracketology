import { Bracket, Game, createInitialBracket, calculateWinProbability } from '@/lib/bracket-data';

export const maxDuration = 300;

interface SimulationUpdate {
  type: 'game_completed' | 'tournament_complete';
  gameId?: string;
  bracket?: Bracket;
}

function simulateGame(game: Game): { winner: string; reasoning: string } {
  const emDiff = game.homeTeam.adjEM - game.awayTeam.adjEM;
  const homeProb = 1 / (1 + Math.pow(10, -emDiff / 11));
  const homePercent = Math.round(homeProb * 100);
  const awayPercent = 100 - homePercent;

  const random = Math.random();
  const winner = random < homeProb ? game.homeTeam : game.awayTeam;
  const winnerPercent = winner === game.homeTeam ? homePercent : awayPercent;

  const upset = winner === game.homeTeam ? homePercent < 50 : awayPercent < 50;

  let reasoning = '';
  if (upset) {
    reasoning = `${winner.name} pulls the upset with ${winnerPercent}% win probability!`;
  } else {
    reasoning = `${winner.name} advances as expected with ${winnerPercent}% win probability.`;
  }

  return { winner: winner.name, reasoning };
}

function playRound(games: Game[]): void {
  for (const game of games) {
    if (game.homeTeam.id === 'florida' || game.awayTeam.id === 'florida') continue;
    if (game.status === 'final') continue;

    game.status = 'in_progress';
    const result = simulateGame(game);
    game.winner = game.homeTeam.name === result.winner ? game.homeTeam : game.awayTeam;
    game.status = 'final';
    game.reasoning = result.reasoning;
  }
}

function advanceRound(fromRound: Game[], toRound: Game[]): void {
  const winners = fromRound.filter(g => g.winner && g.homeTeam.id !== 'florida');
  
  for (let i = 0; i < toRound.length; i++) {
    const game = toRound[i];
    const winner1 = winners[i * 2];
    const winner2 = winners[i * 2 + 1];
    
    if (winner1?.winner && winner2?.winner) {
      game.homeTeam = winner1.winner;
      game.awayTeam = winner2.winner;
      game.status = 'pending';
      game.winner = undefined;
      const probs = calculateWinProbability(game.homeTeam, game.awayTeam);
      game.winProbability = { home: probs.team1, away: probs.team2 };
    }
  }
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const bracket = createInitialBracket();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Play First Four
        playRound(bracket.firstFour);
        advanceRound(bracket.firstFour, bracket.r64);
        
        let gameCount = bracket.firstFour.filter(g => g.winner).length;
        for (const game of bracket.firstFour.filter(g => g.winner)) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'game_completed', gameId: game.id, bracket }) + '\n'));
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        // Play R64
        playRound(bracket.r64);
        advanceRound(bracket.r64, bracket.r32);
        
        for (const game of bracket.r64.filter(g => g.status === 'final' && g.homeTeam.id !== 'florida')) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'game_completed', gameId: game.id, bracket }) + '\n'));
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        // Play R32
        playRound(bracket.r32);
        advanceRound(bracket.r32, bracket.sweet16);
        
        for (const game of bracket.r32.filter(g => g.status === 'final' && g.homeTeam.id !== 'florida')) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'game_completed', gameId: game.id, bracket }) + '\n'));
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        // Play Sweet 16
        playRound(bracket.sweet16);
        advanceRound(bracket.sweet16, bracket.elite8);
        
        for (const game of bracket.sweet16.filter(g => g.status === 'final' && g.homeTeam.id !== 'florida')) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'game_completed', gameId: game.id, bracket }) + '\n'));
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        // Play Elite 8
        playRound(bracket.elite8);
        advanceRound(bracket.elite8, bracket.finalFour);
        
        for (const game of bracket.elite8.filter(g => g.status === 'final' && g.homeTeam.id !== 'florida')) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'game_completed', gameId: game.id, bracket }) + '\n'));
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        // Play Final Four
        playRound(bracket.finalFour);
        if (bracket.championship && bracket.finalFour[0]?.winner && bracket.finalFour[1]?.winner) {
          bracket.championship.homeTeam = bracket.finalFour[0].winner;
          bracket.championship.awayTeam = bracket.finalFour[1].winner;
          bracket.championship.status = 'pending';
          const probs = calculateWinProbability(bracket.championship.homeTeam, bracket.championship.awayTeam);
          bracket.championship.winProbability = { home: probs.team1, away: probs.team2 };
        }
        
        for (const game of bracket.finalFour.filter(g => g.status === 'final' && g.homeTeam.id !== 'florida')) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'game_completed', gameId: game.id, bracket }) + '\n'));
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        // Play Championship
        if (bracket.championship) {
          playRound([bracket.championship]);
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'game_completed', gameId: bracket.championship.id, bracket }) + '\n'));
        }

        controller.enqueue(encoder.encode(JSON.stringify({ type: 'tournament_complete', bracket }) + '\n'));
        controller.close();
      } catch (error) {
        console.error('Simulation error:', error);
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
