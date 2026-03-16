import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gamesTable = pgTable("games", {
  id: text("id").primaryKey(),
  whitePlayerName: text("white_player_name").notNull(),
  blackPlayerName: text("black_player_name").notNull(),
  fen: text("fen").notNull(),
  status: text("status", {
    enum: ["active", "white_wins", "black_wins", "draw", "stalemate"],
  })
    .notNull()
    .default("active"),
  currentTurn: text("current_turn", { enum: ["white", "black"] })
    .notNull()
    .default("white"),
  moveCount: integer("move_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGameSchema = createInsertSchema(gamesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;

export const movesTable = pgTable("moves", {
  id: text("id").primaryKey(),
  gameId: text("game_id")
    .notNull()
    .references(() => gamesTable.id, { onDelete: "cascade" }),
  moveNumber: integer("move_number").notNull(),
  from: text("from_square").notNull(),
  to: text("to_square").notNull(),
  piece: text("piece").notNull(),
  captured: text("captured"),
  promotion: text("promotion"),
  san: text("san").notNull(),
  fen: text("fen").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMoveSchema = createInsertSchema(movesTable).omit({
  createdAt: true,
});
export type InsertMove = z.infer<typeof insertMoveSchema>;
export type Move = typeof movesTable.$inferSelect;
