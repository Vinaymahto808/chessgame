import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { type Game } from "@/context/GamesContext";

interface GameCardProps {
  game: Game;
  onPress: () => void;
  onDelete: () => void;
}

const STATUS_LABELS: Record<Game["status"], { text: string; color: string }> = {
  active: { text: "Active", color: Colors.light.primary },
  white_wins: { text: "White wins", color: Colors.light.accent },
  black_wins: { text: "Black wins", color: Colors.light.text },
  draw: { text: "Draw", color: Colors.light.textSecondary },
  stalemate: { text: "Stalemate", color: Colors.light.textSecondary },
};

export default function GameCard({ game, onPress, onDelete }: GameCardProps) {
  const statusInfo = STATUS_LABELS[game.status];
  const date = new Date(game.createdAt);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.mainRow}>
        <View style={styles.players}>
          <View style={styles.playerRow}>
            <View style={[styles.colorDot, { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#666" }]} />
            <Text style={styles.playerName} numberOfLines={1}>
              {game.whitePlayerName}
            </Text>
          </View>
          <View style={[styles.vsRow]}>
            <Text style={styles.vsText}>vs</Text>
          </View>
          <View style={styles.playerRow}>
            <View style={[styles.colorDot, { backgroundColor: "#1A1A2E" }]} />
            <Text style={styles.playerName} numberOfLines={1}>
              {game.blackPlayerName}
            </Text>
          </View>
        </View>

        <View style={styles.meta}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
          <Text style={styles.moves}>{game.moveCount} moves</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="trash-2" size={16} color={Colors.light.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    boxShadow: "0px 2px 8px rgba(0,0,0,0.06)",
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  mainRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  players: {
    flex: 1,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  playerName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
    flex: 1,
  },
  vsRow: {
    paddingLeft: 20,
    paddingVertical: 2,
  },
  vsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  meta: {
    alignItems: "flex-end",
    gap: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  moves: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  date: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  deleteBtn: {
    paddingLeft: 12,
    alignSelf: "center",
  },
});
