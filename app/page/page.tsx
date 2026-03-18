.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: white;
}

h1 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

p {
  text-align: center;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 2rem;
}

.btn {
  padding: 12px 24px;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #da190b;
  transform: translateY(-2px);
}

.progress-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
}

.progress-bar {
  width: 100%;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  overflow: hidden;
  margin: 10px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8bc34a);
  width: 0%;
  transition: width 0.3s ease;
}

.current-round {
  font-size: 1.1rem;
  font-weight: bold;
  margin-top: 10px;
}

.bracket-display {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.round {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.round h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 0.5rem;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.game-card {
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s ease;
}

.game-card:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.game-card.complete {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.2);
}

.matchup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.team {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  font-size: 0.95rem;
}

.team.winner {
  background: rgba(76, 175, 80, 0.4);
  font-weight: bold;
}

.team-name {
  flex: 1;
  font-weight: 500;
}

.seed {
  font-size: 0.85rem;
  opacity: 0.8;
  margin: 0 0.5rem;
}

.prob {
  font-weight: bold;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
  min-width: 40px;
  text-align: center;
}

.vs {
  text-align: center;
  font-size: 0.85rem;
  opacity: 0.7;
  margin: 0.25rem 0;
}

.reasoning {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  opacity: 0.9;
  font-style: italic;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-left: 2px solid #4CAF50;
  padding-left: 0.75rem;
}

@media (max-width: 768px) {
  h1 {
    font-size: 2rem;
  }

  .games-grid {
    grid-template-columns: 1fr;
  }
}
