import { Router, type IRouter } from "express";
import { Chess } from "chess.js";
import { db } from "@workspace/db";
import { gamesTable, movesTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function serializeGame(game: typeof gamesTable.$inferSelect) {
  return {
    id: game.id,
    whitePlayerName: game.whitePlayerName,
    blackPlayerName: game.blackPlayerName,
    fen: game.fen,
    status: game.status,
    currentTurn: game.currentTurn,
    moveCount: game.moveCount,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
  };
}

function serializeMove(move: typeof movesTable.$inferSelect) {
  return {
    id: move.id,
    gameId: move.gameId,
    moveNumber: move.moveNumber,
    from: move.from,
    to: move.to,
    piece: move.piece,
    captured: move.captured ?? null,
    promotion: move.promotion ?? null,
    san: move.san,
    fen: move.fen,
    createdAt: move.createdAt.toISOString(),
  };
}

router.get("/games", async (_req, res) => {
  const games = await db
    .select()
    .from(gamesTable)
    .orderBy(asc(gamesTable.createdAt));
  res.json(games.map(serializeGame));
});

router.post("/games", async (req, res) => {
  const { whitePlayerName, blackPlayerName } = req.body;
  if (!whitePlayerName || !blackPlayerName) {
    res.status(400).json({ error: "whitePlayerName and blackPlayerName are required" });
    return;
  }

  const chess = new Chess();
  const [game] = await db
    .insert(gamesTable)
    .values({
      id: generateId(),
      whitePlayerName,
      blackPlayerName,
      fen: chess.fen(),
      status: "active",
      currentTurn: "white",
      moveCount: 0,
    })
    .returning();

  res.status(201).json(serializeGame(game));
});

router.get("/games/:gameId", async (req, res) => {
  const { gameId } = req.params;
  const [game] = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.id, gameId));

  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  res.json(serializeGame(game));
});

router.delete("/games/:gameId", async (req, res) => {
  const { gameId } = req.params;
  const [game] = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.id, gameId));

  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  await db.delete(gamesTable).where(eq(gamesTable.id, gameId));
  res.json({ success: true });
});

router.get("/games/:gameId/moves", async (req, res) => {
  const { gameId } = req.params;
  const [game] = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.id, gameId));

  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const moves = await db
    .select()
    .from(movesTable)
    .where(eq(movesTable.gameId, gameId))
    .orderBy(asc(movesTable.moveNumber));

  res.json(moves.map(serializeMove));
});

router.post("/games/:gameId/move", async (req, res) => {
  const { gameId } = req.params;
  const { from, to, promotion } = req.body;

  if (!from || !to) {
    res.status(400).json({ error: "from and to squares are required" });
    return;
  }

  const [game] = await db
    .select()
    .from(gamesTable)
    .where(eq(gamesTable.id, gameId));

  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  if (game.status !== "active") {
    res.status(400).json({ error: "Game is already over" });
    return;
  }

  const chess = new Chess(game.fen);

  let moveResult;
  try {
    moveResult = chess.move({ from, to, promotion: promotion || undefined });
  } catch {
    res.status(400).json({ error: "Invalid move" });
    return;
  }

  if (!moveResult) {
    res.status(400).json({ error: "Invalid move" });
    return;
  }

  let newStatus: "active" | "white_wins" | "black_wins" | "draw" | "stalemate" = "active";

  if (chess.isCheckmate()) {
    newStatus = moveResult.color === "w" ? "white_wins" : "black_wins";
  } else if (chess.isDraw()) {
    newStatus = "draw";
  } else if (chess.isStalemate()) {
    newStatus = "stalemate";
  }

  const newTurn: "white" | "black" = chess.turn() === "w" ? "white" : "black";
  const newMoveCount = game.moveCount + 1;

  const [updatedGame] = await db
    .update(gamesTable)
    .set({
      fen: chess.fen(),
      status: newStatus,
      currentTurn: newTurn,
      moveCount: newMoveCount,
      updatedAt: new Date(),
    })
    .where(eq(gamesTable.id, gameId))
    .returning();

  await db.insert(movesTable).values({
    id: generateId(),
    gameId,
    moveNumber: newMoveCount,
    from: moveResult.from,
    to: moveResult.to,
    piece: moveResult.piece,
    captured: moveResult.captured || null,
    promotion: moveResult.promotion || null,
    san: moveResult.san,
    fen: chess.fen(),
  });

  res.json(serializeGame(updatedGame));
});

export default router;
