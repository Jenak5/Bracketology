'use client';

import { useState, useRef, useEffect } from 'react';
import { Bracket, Game } from '@/lib/bracket-data';
import './page.css';

export default function Home() {
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [currentRound, setCurrentRound] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const startSimulation = async () => {
    setIsSimulating(true);
    setProgress({ completed: 0, total: 68 });
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Simulation failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            const update = JSON.parse(line);
            if (update.type === 'game_completed' && update.bracket) {
              setBracket(update.bracket);
              setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
            } else if (update.type === 'tournament_complete') {
              setBracket(update.bracket);
              setProgress((prev) => ({ ...prev, completed: prev.total }));
              setCurrentRound('Tournament Complete!');
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Simulation error:', error);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const stopSimulation = () => {
    abortControllerRef.current?.abort();
    setIsSimulating(false);
  };

  return (
    <main className="container">
      <h1>March Madness Bracket Simulator</h1>
      <p>Powered by Groq AI</p>

      <div className="controls">
        {!isSimulating ? (
          <button onClick={startSimulation} className="btn btn-primary">
            Start Simulation
          </button>
        ) : (
          <button onClick={stopSimulation} className="btn btn-danger">
            Stop Simulation
          </button>
        )}
      </div>

      {isSimulating && (
        <div className="progress-section">
          <p>
            Games Simulated: {progress.completed} / {progress.total}
          </p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            ></div>
          </div>
          <p className="current-round">{currentRound}</p>
        </div>
      )}

      {bracket && (
        <div className="bracket-display">
          <BracketRound title="First Four" games={bracket.firstFour} />
          <BracketRound title="Round of 64" games={bracket.r64} />
          <BracketRound title="Round of 32" games={bracket.r32} />
          <BracketRound title="Sweet 16" games={bracket.sweet16} />
          <BracketRound title="Elite Eight" games={bracket.elite8} />
          <BracketRound title="Final Four" games={bracket.finalFour} />
          {bracket.championship && <BracketRound title="Championship" games={[bracket.championship]} />}
        </div>
      )}
    </main>
  );
}

function BracketRound({ title, games }: { title: string; games: Game[] }) {
  const completedGames = games.filter((g) => g.status === 'final').length;
  const totalGames = games.filter((g) => g.homeTeam.id !== 'florida').length;

  return (
    <div className="round">
      <h2>
        {title} ({completedGames}/{totalGames})
      </h2>
      <div className="games-grid">
        {games.map((game) => (
          game.homeTeam.id !== 'florida' && <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  const homeWinProb = game.winProbability?.home || 50;
  const awayWinProb = game.winProbability?.away || 50;
  const isComplete = game.status === 'final';

  return (
    <div className={`game-card ${isComplete ? 'complete' : 'pending'}`}>
      <div className="matchup">
        <div
          className={`team ${
            isComplete && game.winner?.id === game.homeTeam.id ? 'winner' : ''
          }`}
        >
          <span className="team-name">{game.homeTeam.name}</span>
          <span className="seed">({game.homeTeam.seed})</span>
          {game.winProbability && <span className="prob">{homeWinProb}%</span>}
        </div>
        <div className="vs">vs</div>
        <div
          className={`team ${
            isComplete && game.winner?.id === game.awayTeam.id ? 'winner' : ''
          }`}
        >
          <span className="team-name">{game.awayTeam.name}</span>
          <span className="seed">({game.awayTeam.seed})</span>
          {game.winProbability && <span className="prob">{awayWinProb}%</span>}
        </div>
      </div>
      {isComplete && game.reasoning && <p className="reasoning">{game.reasoning}</p>}
    </div>
  );
}
