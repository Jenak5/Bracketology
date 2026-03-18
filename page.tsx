'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bracket, Game, createInitialBracket } from '@/lib/bracket-data';

export default function Home() {
  const [bracket, setBracket] = useState<Bracket>(createInitialBracket());
  const [running, setRunning] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const allGames = [
    ...bracket.firstFour,
    ...bracket.r64,
    ...bracket.r32,
    ...bracket.sweet16,
    ...bracket.elite8,
    ...bracket.finalFour,
    ...(bracket.championship ? [bracket.championship] : []),
  ];

  const totalGames = allGames.length;
  const completedGames = allGames.filter((g) => g.status === 'final').length;

  useEffect(() => {
    setProgress(totalGames > 0 ? (completedGames / totalGames) * 100 : 0);
  }, [completedGames, totalGames]);

  const handleStartSimulation = useCallback(async () => {
    setRunning(true);
    setBracket(createInitialBracket());
    setSelectedGameId('ff-1');

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Process all complete lines, keep incomplete line in buffer
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          try {
            const update = JSON.parse(line);
            if (update.bracket) {
              setBracket(update.bracket);
            }
            if (update.type === 'tournament_complete') {
              setRunning(false);
            }
          } catch (e) {
            console.error('Failed to parse update:', e);
          }
        }

        buffer = lines[lines.length - 1];
      }
    } catch (error) {
      console.error('Simulation error:', error);
      setRunning(false);
    }
  }, []);

  const selectedGame = allGames.find((g) => g.id === selectedGameId);

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-[#121213] mb-2">March Madness Arena</h1>
          <p className="text-[#6c6e6f]">AI-powered bracket simulation with win probabilities</p>
        </div>

        {/* Progress Bar */}
        {running && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[#6c6e6f]">Tournament Progress</span>
              <span className="text-sm font-medium text-[#0066cc]">
                {completedGames} / {totalGames} games
              </span>
            </div>
            <div className="w-full h-2 bg-[#dcdddf] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0066cc] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={handleStartSimulation}
            disabled={running}
            className="px-6 py-3 bg-[#0066cc] text-white rounded-lg font-medium disabled:opacity-50 hover:bg-[#0052a3] transition-colors"
          >
            {running ? 'Simulating...' : 'Start Simulation'}
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setBracket(createInitialBracket());
              setSelectedGameId(null);
            }}
            className="px-6 py-3 border border-[#dcdddf] rounded-lg font-medium hover:bg-[#f5f5f5] transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Bracket Grid */}
          <div className="lg:col-span-3 bg-white rounded-lg border border-[#dcdddf] p-6 overflow-auto max-h-[80vh]">
            <div className="space-y-6">
              {/* First Four */}
              {bracket.firstFour.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-[#6c6e6f] mb-3 px-2">FIRST FOUR</h2>
                  <div className="space-y-2">
                    {bracket.firstFour.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        isSelected={selectedGameId === game.id}
                        onSelect={() => setSelectedGameId(game.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Round of 64 */}
              {bracket.r64.some((g) => g.homeTeam.id !== 'florida') && (
                <div>
                  <h2 className="text-sm font-bold text-[#6c6e6f] mb-3 px-2">ROUND OF 64</h2>
                  <div className="space-y-2">
                    {bracket.r64.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        isSelected={selectedGameId === game.id}
                        onSelect={() => setSelectedGameId(game.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Round of 32 */}
              {bracket.r32.some((g) => g.homeTeam.id !== 'florida') && (
                <div>
                  <h2 className="text-sm font-bold text-[#6c6e6f] mb-3 px-2">ROUND OF 32</h2>
                  <div className="space-y-2">
                    {bracket.r32.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        isSelected={selectedGameId === game.id}
                        onSelect={() => setSelectedGameId(game.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sweet 16 */}
              {bracket.sweet16.some((g) => g.homeTeam.id !== 'florida') && (
                <div>
                  <h2 className="text-sm font-bold text-[#6c6e6f] mb-3 px-2">SWEET 16</h2>
                  <div className="space-y-2">
                    {bracket.sweet16.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        isSelected={selectedGameId === game.id}
                        onSelect={() => setSelectedGameId(game.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Elite Eight */}
              {bracket.elite8.some((g) => g.homeTeam.id !== 'florida') && (
                <div>
                  <h2 className="text-sm font-bold text-[#6c6e6f] mb-3 px-2">ELITE EIGHT</h2>
                  <div className="space-y-2">
                    {bracket.elite8.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        isSelected={selectedGameId === game.id}
                        onSelect={() => setSelectedGameId(game.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Final Four */}
              {bracket.finalFour.some((g) => g.homeTeam.id !== 'florida') && (
                <div>
                  <h2 className="text-sm font-bold text-[#6c6e6f] mb-3 px-2">FINAL FOUR</h2>
                  <div className="space-y-2">
                    {bracket.finalFour.map((game) => (
                      <GameCard
                        key={game.id}
                        game={game}
                        isSelected={selectedGameId === game.id}
                        onSelect={() => setSelectedGameId(game.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Championship */}
              {bracket.championship && bracket.championship.homeTeam.id !== 'florida' && (
                <div>
                  <h2 className="text-sm font-bold text-[#6c6e6f] mb-3 px-2">CHAMPIONSHIP</h2>
                  <GameCard
                    game={bracket.championship}
                    isSelected={selectedGameId === bracket.championship.id}
                    onSelect={() => setSelectedGameId(bracket.championship!.id)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="bg-white rounded-lg border border-[#dcdddf] p-6 h-fit sticky top-4 max-h-[80vh] overflow-auto">
            {selectedGame ? (
              <div>
                <div className="mb-6">
                  <div className="text-xs font-bold text-[#6c6e6f] mb-4 uppercase">Matchup Details</div>

                  {/* Home Team */}
                  <div className="mb-6 pb-6 border-b border-[#dcdddf]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-[#121213]">{selectedGame.homeTeam.name}</div>
                      {selectedGame.status !== 'pending' && selectedGame.winner?.id === selectedGame.homeTeam.id && (
                        <span className="text-xs bg-[#e8f5e9] text-[#2e7d32] px-2 py-1 rounded font-semibold">
                          ✓ Won
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#6c6e6f] space-y-1">
                      <div>Seed: #{selectedGame.homeTeam.seed}</div>
                      <div>KenPom: #{selectedGame.homeTeam.kenpom}</div>
                      <div>AdjEM: +{selectedGame.homeTeam.adjEM.toFixed(1)}</div>
                      <div>Off: {selectedGame.homeTeam.adjO.toFixed(1)} | Def: {selectedGame.homeTeam.adjD.toFixed(1)}</div>
                    </div>
                    {selectedGame.winProbability && (
                      <div className="mt-3 pt-3 border-t border-[#dcdddf]">
                        <div className="text-xs font-semibold text-[#0066cc] mb-1">
                          {selectedGame.winProbability.home}% to win
                        </div>
                        <div className="w-full h-2 bg-[#dcdddf] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0066cc]"
                            style={{ width: `${selectedGame.winProbability.home}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-[#121213]">{selectedGame.awayTeam.name}</div>
                      {selectedGame.status !== 'pending' && selectedGame.winner?.id === selectedGame.awayTeam.id && (
                        <span className="text-xs bg-[#e8f5e9] text-[#2e7d32] px-2 py-1 rounded font-semibold">
                          ✓ Won
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#6c6e6f] space-y-1">
                      <div>Seed: #{selectedGame.awayTeam.seed}</div>
                      <div>KenPom: #{selectedGame.awayTeam.kenpom}</div>
                      <div>AdjEM: +{selectedGame.awayTeam.adjEM.toFixed(1)}</div>
                      <div>Off: {selectedGame.awayTeam.adjO.toFixed(1)} | Def: {selectedGame.awayTeam.adjD.toFixed(1)}</div>
                    </div>
                    {selectedGame.winProbability && (
                      <div className="mt-3 pt-3 border-t border-[#dcdddf]">
                        <div className="text-xs font-semibold text-[#0066cc] mb-1">
                          {selectedGame.winProbability.away}% to win
                        </div>
                        <div className="w-full h-2 bg-[#dcdddf] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0066cc]"
                            style={{ width: `${selectedGame.winProbability.away}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedGame.status === 'final' && selectedGame.winner && (
                  <div className="bg-[#f0f0f0] p-4 rounded-lg">
                    <div className="text-xs font-bold text-[#6c6e6f] mb-2">RESULT</div>
                    <div className="text-lg font-bold text-[#0066cc] mb-3">{selectedGame.winner.name}</div>
                    {selectedGame.reasoning && (
                      <div className="text-xs text-[#6c6e6f] leading-relaxed">{selectedGame.reasoning}</div>
                    )}
                  </div>
                )}

                {selectedGame.status === 'in_progress' && (
                  <div className="bg-[#fff3cd] p-4 rounded-lg">
                    <div className="text-sm font-semibold text-[#856404]">⏳ Simulating...</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[#6c6e6f] text-sm">Select a matchup to view details and win probabilities</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GameCard({
  game,
  isSelected,
  onSelect,
}: {
  game: Game;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const statusColor = {
    pending: '#dcdddf',
    in_progress: '#fff3cd',
    final: '#e8f5e9',
  }[game.status];

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
        isSelected ? 'border-[#0066cc] bg-[#e6f2ff]' : 'border-[#dcdddf] hover:border-[#999]'
      }`}
      style={{ backgroundColor: isSelected ? '#e6f2ff' : statusColor }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#121213] truncate">{game.homeTeam.name}</span>
        {game.winProbability && (
          <span className="text-xs font-semibold text-[#0066cc] ml-2 shrink-0">
            {game.winProbability.home}%
          </span>
        )}
        {game.status === 'final' && game.winner?.id === game.homeTeam.id && (
          <span className="text-xs font-bold text-[#2e7d32] ml-2 shrink-0">✓</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#121213] truncate">{game.awayTeam.name}</span>
        {game.winProbability && (
          <span className="text-xs font-semibold text-[#0066cc] ml-2 shrink-0">
            {game.winProbability.away}%
          </span>
        )}
        {game.status === 'final' && game.winner?.id === game.awayTeam.id && (
          <span className="text-xs font-bold text-[#2e7d32] ml-2 shrink-0">✓</span>
        )}
      </div>
      <div className="text-xs text-[#999] mt-1 capitalize">
        {game.status === 'in_progress' && '⏳ Simulating...'}
        {game.status === 'pending' && '○ Pending'}
        {game.status === 'final' && '✓ Final'}
      </div>
    </button>
  );
}
