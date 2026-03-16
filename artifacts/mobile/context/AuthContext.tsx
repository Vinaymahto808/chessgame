import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export interface UserProfile {
  username: string;
  createdAt: string;
  avatar: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (v: boolean) => void;
}

const AUTH_KEY = "chess_user_profile";
const AVATARS = ["♔", "♕", "♗", "♘", "♖", "♙"];

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then((raw) => {
      if (raw) {
        try {
          setUser(JSON.parse(raw));
        } catch {}
      } else {
        setShowLoginModal(true);
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (username: string) => {
    const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const profile: UserProfile = {
      username: username.trim(),
      createdAt: new Date().toISOString(),
      avatar,
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(profile));
    setUser(profile);
    setShowLoginModal(false);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
    setShowLoginModal(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, showLoginModal, setShowLoginModal }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
