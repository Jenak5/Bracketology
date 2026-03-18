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

          // After each round completes, explicitly advance winners to next round
          advanceWinnersToNextRound(bracket);
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
