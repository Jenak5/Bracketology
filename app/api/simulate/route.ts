async function simulateGame(game: Game): Promise<{ winner: string; reasoning: string }> {
  // Calculate win probability based on KenPom
  const emDiff = game.homeTeam.adjEM - game.awayTeam.adjEM;
  const homeProb = 1 / (1 + Math.pow(10, -emDiff / 11));
  const awayProb = 1 - homeProb;
  const homePercent = Math.round(homeProb * 100);
  const awayPercent = Math.round(awayProb * 100);

  const prompt = `You are an elite March Madness analyst. Make a prediction based on stats AND historical tournament performance.

${game.homeTeam.name} (${game.homeTeam.seed} seed)
KenPom: #${game.homeTeam.kenpom}, AdjEM: +${game.homeTeam.adjEM}
Off: ${game.homeTeam.adjO.toFixed(1)} | Def: ${game.homeTeam.adjD.toFixed(1)}
Win Probability: ${homePercent}%

vs

${game.awayTeam.name} (${game.awayTeam.seed} seed)
KenPom: #${game.awayTeam.kenpom}, AdjEM: +${game.awayTeam.adjEM}
Off: ${game.awayTeam.adjO.toFixed(1)} | Def: ${game.awayTeam.adjD.toFixed(1)}
Win Probability: ${awayPercent}%

Consider:
- Statistical advantage (${homePercent}% vs ${awayPercent}%)
- Seed matchup and tournament history
- Momentum (higher seeds tend to repeat)
- Upset potential if underdog is playing well

Who wins? Respond with ONLY valid JSON:
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
