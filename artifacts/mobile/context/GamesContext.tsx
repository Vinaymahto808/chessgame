import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { API_BASE } from "@/constants/api";

export interface Game {
  id: string;
  whitePlayerName: string;
  blackPlayerName: string;
  fen: string;
  status: "active" | "white_wins" | "black_wins" | "draw" | "stalemate";
  currentTurn: "white" | "black";
  moveCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Move {
  id: string;
  gameId: string;
  moveNumber: number;
  from: string;
  to: string;
  piece: string;
  captured: string | null;
  promotion: string | null;
  san: string;
  fen: string;
  createdAt: string;
}

interface GamesContextValue {
  games: Game[];
  isLoading: boolean;
  error: string | null;
  fetchGames: () => Promise<void>;
  createGame: (whitePlayerName: string, blackPlayerName: string) => Promise<Game>;
  deleteGame: (gameId: string) => Promise<void>;
  makeMove: (gameId: string, from: string, to: string, promotion?: string) => Promise<Game>;
  fetchMoves: (gameId: string) => Promise<Move[]>;
}

const GamesContext = createContext<GamesContextValue | null>(null);

export function GamesProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/games`);
      if (!res.ok) throw new Error("Failed to fetch games");
      const data = await res.json();
      setGames(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGame = useCallback(
    async (whitePlayerName: string, blackPlayerName: string): Promise<Game> => {
      const res = await fetch(`${API_BASE}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whitePlayerName, blackPlayerName }),
      });
      const game = await res.json();
      if (!res.ok) {
        throw new Error(game.error || "Failed to create game");
      }
      setGames((prev) => [...prev, game]);
      return game;
    },
    []
  );

  const deleteGame = useCallback(async (gameId: string) => {
    const res = await fetch(`${API_BASE}/games/${gameId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete game");
    }
    setGames((prev) => prev.filter((g) => g.id !== gameId));
  }, []);

  const makeMove = useCallback(
    async (
      gameId: string,
      from: string,
      to: string,
      promotion?: string
    ): Promise<Game> => {
      const body: Record<string, string> = { from, to };
      if (promotion) body.promotion = promotion;

      const res = await fetch(`${API_BASE}/games/${gameId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const updatedGame = await res.json();
      if (!res.ok) {
        throw new Error(updatedGame.error || "Invalid move");
      }
      setGames((prev) => prev.map((g) => (g.id === gameId ? updatedGame : g)));
      return updatedGame;
    },
    []
  );

  const fetchMoves = useCallback(async (gameId: string): Promise<Move[]> => {
    const res = await fetch(`${API_BASE}/games/${gameId}/moves`);
    if (!res.ok) throw new Error("Failed to fetch moves");
    return res.json();
  }, []);

  return (
    <GamesContext.Provider
      value={{
        games,
        isLoading,
        error,
        fetchGames,
        createGame,
        deleteGame,
        makeMove,
        fetchMoves,
      }}
    >
      {children}
    </GamesContext.Provider>
  );
}

export function useGames() {
  const ctx = useContext(GamesContext);
  if (!ctx) throw new Error("useGames must be used within GamesProvider");
  return ctx;
}
