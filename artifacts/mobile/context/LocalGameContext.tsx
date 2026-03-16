import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export interface LocalMove {
  from: string;
  to: string;
  san: string;
  piece: string;
  captured?: string;
  promotion?: string;
  fen: string;
  moveNumber: number;
}

export interface LocalGame {
  id: string;
  playerColor: "white" | "black";
  playerName?: string;
  fen: string;
  status: "active" | "white_wins" | "black_wins" | "draw" | "stalemate";
  currentTurn: "white" | "black";
  moves: LocalMove[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "chess_local_games";

interface LocalGameContextValue {
  localGames: LocalGame[];
  loadGames: () => Promise<void>;
  saveGame: (game: LocalGame) => Promise<void>;
  deleteLocalGame: (id: string) => Promise<void>;
  getGame: (id: string) => LocalGame | undefined;
}

const LocalGameContext = createContext<LocalGameContextValue | null>(null);

export function LocalGameProvider({ children }: { children: ReactNode }) {
  const [localGames, setLocalGames] = useState<LocalGame[]>([]);

  const loadGames = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setLocalGames(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const persistGames = async (games: LocalGame[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  };

  const saveGame = useCallback(async (game: LocalGame) => {
    setLocalGames((prev) => {
      const idx = prev.findIndex((g) => g.id === game.id);
      const updated =
        idx >= 0
          ? prev.map((g) => (g.id === game.id ? game : g))
          : [...prev, game];
      persistGames(updated);
      return updated;
    });
  }, []);

  const deleteLocalGame = useCallback(async (id: string) => {
    setLocalGames((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      persistGames(updated);
      return updated;
    });
  }, []);

  const getGame = useCallback(
    (id: string) => localGames.find((g) => g.id === id),
    [localGames]
  );

  return (
    <LocalGameContext.Provider
      value={{ localGames, loadGames, saveGame, deleteLocalGame, getGame }}
    >
      {children}
    </LocalGameContext.Provider>
  );
}

export function useLocalGameContext() {
  const ctx = useContext(LocalGameContext);
  if (!ctx)
    throw new Error("useLocalGameContext must be used within LocalGameProvider");
  return ctx;
}
