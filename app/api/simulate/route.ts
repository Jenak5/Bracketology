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
          const games = roundInfo.key === 'championship' ? (bracket.championship ? [bracket.championship] : []) : bracket[roundInfo.key];
          
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
