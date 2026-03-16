import { Chess } from "chess.js";

export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type PieceColor = "w" | "b";
export type Square = string;

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface BoardState {
  board: (Piece | null)[][];
  chess: Chess;
}

export const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

export function squareToCoords(square: string): { row: number; col: number } {
  const col = square.charCodeAt(0) - "a".charCodeAt(0);
  const row = 8 - parseInt(square[1]);
  return { row, col };
}

export function coordsToSquare(row: number, col: number): string {
  const file = String.fromCharCode("a".charCodeAt(0) + col);
  const rank = (8 - row).toString();
  return file + rank;
}

export function getLegalMovesForSquare(fen: string, square: string): string[] {
  try {
    const chess = new Chess(fen);
    const moves = chess.moves({ square: square as any, verbose: true });
    return moves.map((m) => m.to);
  } catch {
    return [];
  }
}

export function isPromotion(fen: string, from: string, to: string): boolean {
  try {
    const chess = new Chess(fen);
    const piece = chess.get(from as any);
    if (!piece || piece.type !== "p") return false;
    const toRank = to[1];
    if (piece.color === "w" && toRank === "8") return true;
    if (piece.color === "b" && toRank === "1") return true;
    return false;
  } catch {
    return false;
  }
}

export function getStatusText(status: string, whitePlayer: string, blackPlayer: string): string {
  switch (status) {
    case "white_wins":
      return `${whitePlayer} wins by checkmate!`;
    case "black_wins":
      return `${blackPlayer} wins by checkmate!`;
    case "draw":
      return "Game drawn";
    case "stalemate":
      return "Stalemate — draw";
    default:
      return "";
  }
}

export function isInCheck(fen: string): boolean {
  try {
    const chess = new Chess(fen);
    return chess.inCheck();
  } catch {
    return false;
  }
}

export function getKingSquare(fen: string, color: "w" | "b"): string | null {
  try {
    const chess = new Chess(fen);
    const board = chess.board();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === "k" && piece.color === color) {
          return coordsToSquare(row, col);
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}
