import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Chess } from "chess.js";

import Colors from "@/constants/colors";
import { useLocalGameContext, type LocalGame, type LocalMove } from "@/context/LocalGameContext";
import ChessBoard from "@/components/ChessBoard";
import MoveHistory from "@/components/MoveHistory";
import { getBestMove } from "@/utils/chessAI";
import { useAuth } from "@/context/AuthContext";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default function LocalGameScreen() {
  const insets = useSafeAreaInsets();
  const { id, playerColor: paramColor } = useLocalSearchParams<{
    id?: string;
    playerColor?: string;
  }>();

  const { saveGame, getGame } = useLocalGameContext();
  const { user } = useAuth();

  const [game, setGame] = useState<LocalGame | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const thinkingDot = useRef(new Animated.Value(0)).current;
  const aiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (id) {
      const existing = getGame(id);
      if (existing) {
        setGame(existing);
        const lastM = existing.moves[existing.moves.length - 1];
        if (lastM) setLastMove({ from: lastM.from, to: lastM.to });
        if (existing.playerColor === "black") setFlipped(true);
        return;
      }
    }
    const playerColor = (paramColor === "black" ? "black" : "white") as "white" | "black";
    const newGame: LocalGame = {
      id: generateId(),
      playerColor,
      playerName: user?.username,
      fen: new Chess().fen(),
      status: "active",
      currentTurn: "white",
      moves: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setGame(newGame);
    saveGame(newGame);
    if (playerColor === "black") setFlipped(true);
  }, []);

  useEffect(() => {
    if (!game || game.status !== "active") return;
    const aiColor = game.playerColor === "white" ? "black" : "white";
    if (game.currentTurn !== aiColor) return;

    setIsAIThinking(true);
    aiTimeout.current = setTimeout(() => {
      const aiColorShort = aiColor === "white" ? "w" : "b";
      const best = getBestMove(game.fen, aiColorShort, 3);
      setIsAIThinking(false);
      if (best) {
        applyMove(best.from, best.to, best.promotion);
      }
    }, 400);

    return () => {
      if (aiTimeout.current) clearTimeout(aiTimeout.current);
    };
  }, [game?.currentTurn, game?.fen, game?.status]);

  useEffect(() => {
    if (!isAIThinking) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(thinkingDot, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(thinkingDot, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isAIThinking]);

  const applyMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      setGame((prev) => {
        if (!prev) return prev;
        const chess = new Chess(prev.fen);
        let result;
        try {
          result = chess.move({ from, to, promotion: promotion || undefined });
        } catch {
          return prev;
        }
        if (!result) return prev;

        let newStatus: LocalGame["status"] = "active";
        if (chess.isCheckmate()) {
          newStatus = result.color === "w" ? "white_wins" : "black_wins";
        } else if (chess.isDraw()) {
          newStatus = "draw";
        } else if (chess.isStalemate()) {
          newStatus = "stalemate";
        }

        const newMove: LocalMove = {
          from: result.from,
          to: result.to,
          san: result.san,
          piece: result.piece,
          captured: result.captured,
          promotion: result.promotion,
          fen: chess.fen(),
          moveNumber: prev.moves.length + 1,
        };

        const updated: LocalGame = {
          ...prev,
          fen: chess.fen(),
          status: newStatus,
          currentTurn: chess.turn() === "w" ? "white" : "black",
          moves: [...prev.moves, newMove],
          updatedAt: new Date().toISOString(),
        };

        saveGame(updated);
        setLastMove({ from, to });
        return updated;
      });
    },
    [saveGame]
  );

  const handlePlayerMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      if (!game) return;
      if (game.status !== "active") return;
      const aiColor = game.playerColor === "white" ? "black" : "white";
      if (game.currentTurn === aiColor) return;
      applyMove(from, to, promotion);
    },
    [game, applyMove]
  );

  const handleNewGame = () => {
    if (!game) return;
    Alert.alert("New Game", "Start a new game against the computer?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "New Game",
        onPress: () => {
          if (aiTimeout.current) clearTimeout(aiTimeout.current);
          const newGame: LocalGame = {
            id: generateId(),
            playerColor: game.playerColor,
            fen: new Chess().fen(),
            status: "active",
            currentTurn: "white",
            moves: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          saveGame(newGame);
          setGame(newGame);
          setLastMove(null);
          setIsAIThinking(false);
        },
      },
    ]);
  };

  if (!game) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.light.primary} size="large" />
      </View>
    );
  }

  const chess = new Chess(game.fen);
  const isInCheck = chess.inCheck();
  const isGameOver = game.status !== "active";
  const aiColor = game.playerColor === "white" ? "black" : "white";
  const isPlayerTurn = game.currentTurn === game.playerColor;

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const getStatusMessage = () => {
    switch (game.status) {
      case "white_wins":
        return {
          text: game.playerColor === "white" ? "You win! 🎉" : "Computer wins",
          color: game.playerColor === "white" ? Colors.light.primary : Colors.light.textSecondary,
        };
      case "black_wins":
        return {
          text: game.playerColor === "black" ? "You win! 🎉" : "Computer wins",
          color: game.playerColor === "black" ? Colors.light.primary : Colors.light.textSecondary,
        };
      case "draw":
        return { text: "It's a draw", color: Colors.light.textSecondary };
      case "stalemate":
        return { text: "Stalemate — draw", color: Colors.light.textSecondary };
      default:
        if (isInCheck) {
          return {
            text: isPlayerTurn ? "You are in check!" : "Computer is in check!",
            color: Colors.light.danger,
          };
        }
        return null;
    }
  };

  const statusMsg = getStatusMessage();

  const movesForHistory = game.moves.map((m, i) => ({
    id: String(i),
    gameId: game.id,
    moveNumber: m.moveNumber,
    from: m.from,
    to: m.to,
    piece: m.piece,
    captured: m.captured ?? null,
    promotion: m.promotion ?? null,
    san: m.san,
    fen: m.fen,
    createdAt: game.createdAt,
  }));

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={22} color={Colors.light.text} />
          <Text style={styles.headerBtnLabel}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>vs Computer</Text>
          <Text style={styles.headerSub}>
            You play {game.playerColor} · {game.moves.length} moves
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setFlipped((f) => !f)}
          style={styles.headerBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="refresh-cw" size={20} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.opponentsBar}>
          <PlayerChip
            label="Computer"
            isAI
            isActive={!isGameOver && !isPlayerTurn}
            color={aiColor}
            isThinking={isAIThinking}
            thinkingAnim={thinkingDot}
            bottom={false}
          />
          <PlayerChip
            label={game.playerName ?? "You"}
            isAI={false}
            isActive={!isGameOver && isPlayerTurn}
            color={game.playerColor}
            isThinking={false}
            thinkingAnim={thinkingDot}
            bottom
          />
        </View>

        {statusMsg && (
          <View style={[styles.statusBanner, { backgroundColor: `${statusMsg.color}18` }]}>
            <Text style={[styles.statusText, { color: statusMsg.color }]}>
              {statusMsg.text}
            </Text>
            {isGameOver && (
              <TouchableOpacity style={styles.rematchBtn} onPress={handleNewGame}>
                <Text style={styles.rematchText}>Play Again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.boardContainer}>
          <ChessBoard
            fen={game.fen}
            currentTurn={game.currentTurn}
            status={game.status}
            onMove={handlePlayerMove}
            lastMove={lastMove}
            flipped={flipped}
          />
          {isAIThinking && (
            <View style={styles.thinkingOverlay} pointerEvents="box-only">
              <View style={styles.thinkingBadge}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <Text style={styles.thinkingText}>Thinking…</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleNewGame}>
            <Feather name="plus-circle" size={18} color={Colors.light.primary} />
            <Text style={styles.actionBtnText}>New Game</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Feather name="list" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.historyTitle}>Move History</Text>
          </View>
          <MoveHistory moves={movesForHistory} />
        </View>
      </ScrollView>
    </View>
  );
}

function PlayerChip({
  label,
  isAI,
  isActive,
  color,
  isThinking,
  thinkingAnim,
  bottom,
}: {
  label: string;
  isAI: boolean;
  isActive: boolean;
  color: "white" | "black";
  isThinking: boolean;
  thinkingAnim: Animated.Value;
  bottom: boolean;
}) {
  return (
    <View style={[styles.chipWrapper, bottom && styles.chipWrapperBottom]}>
      <View
        style={[
          styles.chip,
          color === "black" ? styles.chipBlack : styles.chipWhite,
          isActive && styles.chipActive,
        ]}
      >
        {isAI ? (
          <Feather
            name="cpu"
            size={14}
            color={color === "black" ? "#FFFFFF" : Colors.light.text}
          />
        ) : (
          <Feather
            name="user"
            size={14}
            color={color === "black" ? "#FFFFFF" : Colors.light.text}
          />
        )}
        <Text
          style={[
            styles.chipLabel,
            color === "black" ? styles.chipLabelDark : styles.chipLabelLight,
          ]}
        >
          {label}
        </Text>
        {isThinking && (
          <Animated.View style={[styles.thinkingDot, { opacity: thinkingAnim }]} />
        )}
        {isActive && !isThinking && <View style={styles.activePulse} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  content: {
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  opponentsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  chipWrapper: {
    flex: 1,
    alignItems: "flex-start",
  },
  chipWrapperBottom: {
    alignItems: "flex-end",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  chipWhite: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.cardBorder,
  },
  chipBlack: {
    backgroundColor: "#1A1A2E",
    borderColor: "#1A1A2E",
  },
  chipActive: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  chipLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  chipLabelLight: {
    color: Colors.light.text,
  },
  chipLabelDark: {
    color: "#FFFFFF",
  },
  thinkingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.light.primary,
  },
  activePulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.light.primary,
  },
  statusBanner: {
    marginHorizontal: 8,
    marginBottom: 10,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 10,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  rematchBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rematchText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  boardContainer: {
    alignItems: "center",
    position: "relative",
    marginBottom: 12,
  },
  thinkingOverlay: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  thinkingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    boxShadow: "0px 2px 8px rgba(0,0,0,0.12)",
  },
  thinkingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  actionBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.light.primary,
  },
  historyCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    marginHorizontal: 8,
    paddingBottom: 8,
    overflow: "hidden",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.separator,
  },
  historyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
