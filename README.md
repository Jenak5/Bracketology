# March Madness Arena

An AI-powered NCAA Tournament bracket simulator using Claude and streaming real-time game predictions.

## Features

- **Groq AI Simulation**: Uses Mixtral 8x7B (free!) to simulate each game
- **Real-time Streaming**: Watch the bracket unfold game-by-game with live updates
- **Complete Tournament**: Simulates all rounds from First Four through Championship
- **Interactive Details**: Click any matchup to view detailed statistics and AI reasoning
- **Clean UI**: Modern bracket display with automatic round advancement

## Setup

### Prerequisites

- Node.js 18+
- Free Groq API key (get one at [console.groq.com](https://console.groq.com) — no credit card needed)

### Installation

1. Clone or download this repo
2. Install dependencies:
   ```bash
   npm install
   ```

3. Get a free Groq API key:
   - Go to [console.groq.com](https://console.groq.com)
   - Sign up (free, no credit card)
   - Create an API key

4. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Add your GROQ_API_KEY to .env.local
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add your `GROQ_API_KEY` as an environment variable
4. Deploy!

### Deploy Elsewhere

For other hosting platforms:
- Ensure you have a Node.js runtime supporting streaming responses
- Add `GROQ_API_KEY` environment variable

## How It Works

### Game Simulation

For each matchup, Groq's Mixtral model analyzes:
- **KenPom Metrics**: Adjusted efficiency margin, offensive/defensive ratings, tempo
- **Seed Matchup History**: Historical upset rates for each seed combination (1985-2025)
- **Tournament Context**: Running upset tracker to calibrate realistic outcomes
- **Intangibles**: Defense/offense style matchups, luck regression, travel factors

The AI responds with structured JSON containing the winner and reasoning.

### Why Groq?

- **Completely free** — no credit card required
- **Fast** — ~100 tokens/second
- **Mixtral 8x7B** — high-quality model, perfect for March Madness analysis
- **Reliable** — enterprise-grade infrastructure

### Round Advancement

1. **First Four** (~4 games): Play-in games
2. **Round of 64** (32 games): Winners advance automatically
3. **Round of 32** (16 games): Winners advance
4. **Sweet 16** (8 games): Winners advance
5. **Elite Eight** (4 games): Winners advance
6. **Final Four** (2 games): Winners advance
7. **Championship** (1 game): Complete!

## Architecture

```
├── app/
│   ├── api/
│   │   └── simulate/
│   │       └── route.ts          # Streaming API endpoint
│   ├── page.tsx                  # Main bracket UI
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── lib/
│   └── bracket-data.ts           # Tournament structure & team stats
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.example
```

### API Endpoint: `/api/simulate`

**POST** - Streams tournament simulation as JSON lines

Response format:
```json
{
  "type": "game_completed",
  "gameId": "ff-1",
  "bracket": { ...updated bracket }
}
```

## Customization

### Add More Teams

Edit `lib/bracket-data.ts` and add teams to the `TEAMS` object:
```typescript
myTeam: { 
  id: 'myteam', 
  name: 'My Team', 
  seed: 10, 
  conference: 'Big 12',
  kenpom: 45,
  adjEM: 8.5,
  adjO: 112.0,
  adjD: 103.5
}
```

### Adjust AI Behavior

Edit the prompt in `/app/api/simulate/route.ts` under `simulateGame()` to change how the AI evaluates matchups.

### Change Model

In `/app/api/simulate/route.ts`, change the model:
```typescript
const message = await client.chat.completions.create({
  model: 'mixtral-8x7b-32768',  // Or try 'llama-2-70b-chat'
  // ... rest of config
});
```

Available free Groq models:
- `mixtral-8x7b-32768` (recommended — fastest & best quality)
- `llama-2-70b-chat` (good alternative)
- `gemma-7b-it` (smallest/fastest)

## Limitations

- First draft only goes through main bracket simulation
- No user-submitted brackets or leaderboard (yet)
- UI is list-based, not graphical bracket visualization
- KenPom stats are from start of 2026 season (frozen)

## Future Enhancements

- [ ] Graphical bracket visualization with connectors
- [ ] User bracket submissions and scoring
- [ ] Leaderboard tracking
- [ ] Compare AI picks vs real tournament results
- [ ] Custom team weights and stat overrides
- [ ] Multiple simulation runs for probability analysis

## License

MIT - Free to use and modify!

## Support

For issues or questions:
- Check the API response in browser DevTools Network tab
- Verify `GROQ_API_KEY` is set correctly in `.env.local`
- Make sure you generated the key at [console.groq.com](https://console.groq.com)
- Check Groq API status at [status.groq.com](https://status.groq.com)
