import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Chess } from "chess.js";

import Colors from "@/constants/colors";
import { useGames, type Game, type Move } from "@/context/GamesContext";
import ChessBoard from "@/components/ChessBoard";
import MoveHistory from "@/components/MoveHistory";

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { games, makeMove, fetchMoves } = useGames();

  const [game, setGame] = useState<Game | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    const found = games.find((g) => g.id === id);
    if (found) setGame(found);
  }, [games, id]);

  useEffect(() => {
    if (id) {
      fetchMoves(id).then((m) => {
        setMoves(m);
        if (m.length > 0) {
          const last = m[m.length - 1];
          setLastMove({ from: last.from, to: last.to });
        }
      });
    }
  }, [id, fetchMoves]);

  const handleMove = useCallback(
    async (from: string, to: string, promotion?: string) => {
      if (!game || isMoving) return;
      setIsMoving(true);
      try {
        const updated = await makeMove(game.id, from, to, promotion);
        setGame(updated);
        setLastMove({ from, to });
        const updatedMoves = await fetchMoves(game.id);
        setMoves(updatedMoves);
      } catch (e) {
        Alert.alert("Invalid move", "That move isn't allowed.");
      } finally {
        setIsMoving(false);
      }
    },
    [game, isMoving, makeMove, fetchMoves]
  );

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

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const turnDisplayName =
    game.currentTurn === "white"
      ? game.whitePlayerName
      : game.blackPlayerName;

  const getStatusMessage = () => {
    switch (game.status) {
      case "white_wins":
        return { text: `${game.whitePlayerName} wins!`, color: Colors.light.accent };
      case "black_wins":
        return { text: `${game.blackPlayerName} wins!`, color: Colors.light.text };
      case "draw":
        return { text: "Game drawn", color: Colors.light.textSecondary };
      case "stalemate":
        return { text: "Stalemate — draw", color: Colors.light.textSecondary };
      default:
        if (isInCheck) {
          return { text: `${turnDisplayName} is in check!`, color: Colors.light.danger };
        }
        return null;
    }
  };

  const statusMsg = getStatusMessage();

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {game.whitePlayerName} vs {game.blackPlayerName}
          </Text>
          <Text style={styles.headerSub}>{game.moveCount} moves</Text>
        </View>

        <TouchableOpacity
          onPress={() => setFlipped((f) => !f)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.flipBtn}
        >
          <Feather name="refresh-cw" size={20} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.playersBar}>
          <PlayerBadge
            name={flipped ? game.blackPlayerName : game.whitePlayerName}
            color={flipped ? "black" : "white"}
            isActive={
              game.status === "active" &&
              (flipped
                ? game.currentTurn === "black"
                : game.currentTurn === "white")
            }
          />
          <PlayerBadge
            name={flipped ? game.whitePlayerName : game.blackPlayerName}
            color={flipped ? "white" : "black"}
            isActive={
              game.status === "active" &&
              (flipped
                ? game.currentTurn === "white"
                : game.currentTurn === "black")
            }
            bottom
          />
        </View>

        {statusMsg && (
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: `${statusMsg.color}18` },
            ]}
          >
            <Text style={[styles.statusBannerText, { color: statusMsg.color }]}>
              {statusMsg.text}
            </Text>
          </View>
        )}

        <View style={styles.boardContainer}>
          {isMoving && (
            <View style={styles.movingOverlay}>
              <ActivityIndicator color={Colors.light.primary} />
            </View>
          )}
          <ChessBoard
            fen={game.fen}
            currentTurn={game.currentTurn}
            status={game.status}
            onMove={handleMove}
            lastMove={lastMove}
            flipped={flipped}
          />
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Feather name="list" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.historyTitle}>Move History</Text>
          </View>
          <MoveHistory moves={moves} />
        </View>
      </ScrollView>
    </View>
  );
}

function PlayerBadge({
  name,
  color,
  isActive,
  bottom = false,
}: {
  name: string;
  color: "white" | "black";
  isActive: boolean;
  bottom?: boolean;
}) {
  return (
    <View style={[styles.playerBadge, bottom && styles.playerBadgeBottom]}>
      <View
        style={[
          styles.playerChip,
          color === "white"
            ? styles.playerChipWhite
            : styles.playerChipBlack,
          isActive && styles.playerChipActive,
        ]}
      >
        <View
          style={[
            styles.playerColorDot,
            {
              backgroundColor: color === "white" ? "#FFFFFF" : "#1A1A2E",
              borderWidth: color === "white" ? 1 : 0,
              borderColor: "#CCC",
            },
          ]}
        />
        <Text
          style={[
            styles.playerChipName,
            color === "white" ? styles.playerChipNameWhite : styles.playerChipNameBlack,
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
        {isActive && <View style={styles.activeDot} />}
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
  backBtn: {
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
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  flipBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  content: {
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  playersBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  playerBadge: {
    flex: 1,
    alignItems: "flex-start",
  },
  playerBadgeBottom: {
    alignItems: "flex-end",
  },
  playerChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    maxWidth: 160,
  },
  playerChipWhite: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  playerChipBlack: {
    backgroundColor: "#1A1A2E",
  },
  playerChipActive: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  playerColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  playerChipName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    flex: 1,
  },
  playerChipNameWhite: {
    color: Colors.light.text,
  },
  playerChipNameBlack: {
    color: "#FFFFFF",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  statusBanner: {
    marginHorizontal: 8,
    marginBottom: 10,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  statusBannerText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  boardContainer: {
    alignItems: "center",
    position: "relative",
    marginBottom: 12,
  },
  movingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
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
