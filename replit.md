# Chess Game App

## Overview

A full-stack chess game application with an Expo React Native mobile frontend and an Express backend with PostgreSQL.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo React Native with Expo Router
- **Chess logic**: chess.js (both frontend and backend)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── mobile/             # Expo React Native chess app
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Features

- Create chess games with custom player names
- Play full chess (all legal moves, check detection, checkmate, stalemate)
- Move history with standard algebraic notation
- Board flip for two-player mode
- Pawn promotion modal
- Check highlighting on king square
- Legal move highlights when selecting a piece
- Last move highlighting
- Game history list with status badges
- Delete games
- All games persist in PostgreSQL

## Database Schema

- `games` table: game state, FEN notation, player names, status, turn
- `moves` table: full move history with SAN notation, captured pieces

## API Endpoints

- `GET /api/games` — list all games
- `POST /api/games` — create a new game
- `GET /api/games/:id` — get game details
- `DELETE /api/games/:id` — delete a game
- `POST /api/games/:id/move` — make a move
- `GET /api/games/:id/moves` — get move history

## Mobile App Structure

```text
artifacts/mobile/
├── app/
│   ├── _layout.tsx          # Root layout with providers
│   ├── index.tsx            # Game list screen
│   └── game/[id].tsx        # Game board screen
├── components/
│   ├── ChessBoard.tsx       # Interactive chess board
│   ├── MoveHistory.tsx      # Move history scroll view
│   ├── GameCard.tsx         # Game list card
│   ├── ErrorBoundary.tsx
│   └── ErrorFallback.tsx
├── context/
│   └── GamesContext.tsx     # API state management
├── utils/
│   └── chessUtils.ts        # Chess helper functions
└── constants/
    ├── colors.ts            # Theme colors
    └── api.ts               # API base URL config
```
