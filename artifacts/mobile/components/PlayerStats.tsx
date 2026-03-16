import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useGames, type Game } from "@/context/GamesContext";
import { useLocalGameContext, type LocalGame } from "@/context/LocalGameContext";
import Colors from "@/constants/colors";

function StatBox({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getOnlinePlayerResult(game: Game, username: string): "win" | "loss" | "draw" | null {
  const isWhite =
    game.whitePlayerName.toLowerCase() === username.toLowerCase();
  const isBlack =
    game.blackPlayerName.toLowerCase() === username.toLowerCase();
  if (!isWhite && !isBlack) return null;
  if (game.status === "draw" || game.status === "stalemate") return "draw";
  if (game.status === "white_wins") return isWhite ? "win" : "loss";
  if (game.status === "black_wins") return isBlack ? "win" : "loss";
  return null;
}

function getLocalPlayerResult(game: LocalGame): "win" | "loss" | "draw" | null {
  if (game.status === "active") return null;
  if (game.status === "draw" || game.status === "stalemate") return "draw";
  const playerIsWhite = game.playerColor === "white";
  if (game.status === "white_wins") return playerIsWhite ? "win" : "loss";
  if (game.status === "black_wins") return !playerIsWhite ? "win" : "loss";
  return null;
}

export default function PlayerStats() {
  const { user, logout } = useAuth();
  const { games } = useGames();
  const { localGames } = useLocalGameContext();

  if (!user) return null;

  const myOnlineGames = games.filter(
    (g) =>
      g.whitePlayerName.toLowerCase() === user.username.toLowerCase() ||
      g.blackPlayerName.toLowerCase() === user.username.toLowerCase()
  );
  const myLocalGames = localGames;

  const finishedOnline = myOnlineGames.filter((g) => g.status !== "active");
  const finishedLocal = myLocalGames.filter((g) => g.status !== "active");

  const onlineWins = finishedOnline.filter((g) => getOnlinePlayerResult(g, user.username) === "win").length;
  const onlineLosses = finishedOnline.filter((g) => getOnlinePlayerResult(g, user.username) === "loss").length;
  const onlineDraws = finishedOnline.filter((g) => getOnlinePlayerResult(g, user.username) === "draw").length;

  const localWins = finishedLocal.filter((g) => getLocalPlayerResult(g) === "win").length;
  const localLosses = finishedLocal.filter((g) => getLocalPlayerResult(g) === "loss").length;

  const totalGames = myOnlineGames.length + myLocalGames.length;
  const totalWins = onlineWins + localWins;
  const totalLosses = onlineLosses + localLosses;
  const totalDraws = onlineDraws + (finishedLocal.filter((g) => getLocalPlayerResult(g) === "draw").length);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Sign out from this device?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user.avatar}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.gameCount}>
            {totalGames} {totalGames === 1 ? "game" : "games"} played
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="log-out" size={18} color={Colors.light.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatBox value={totalWins} label="Wins" color={Colors.light.primary} />
        <View style={styles.statDivider} />
        <StatBox value={totalLosses} label="Losses" color={Colors.light.danger} />
        <View style={styles.statDivider} />
        <StatBox value={totalDraws} label="Draws" color={Colors.light.textSecondary} />
        <View style={styles.statDivider} />
        <StatBox
          value={totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0}
          label="Win %"
          color={Colors.light.accent}
        />
      </View>

      {(myOnlineGames.length > 0 || myLocalGames.length > 0) && (
        <>
          <Text style={styles.historyTitle}>My Game History</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyScroll}
          >
            {[...myLocalGames].reverse().map((g) => {
              const result = getLocalPlayerResult(g);
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.historyChip,
                    result === "win" && styles.chipWin,
                    result === "loss" && styles.chipLoss,
                    result === "draw" && styles.chipDraw,
                    result === null && styles.chipActive,
                  ]}
                  onPress={() =>
                    router.push({ pathname: "/local-game", params: { id: g.id } })
                  }
                >
                  <Feather
                    name="cpu"
                    size={11}
                    color={
                      result === "win"
                        ? Colors.light.primary
                        : result === "loss"
                        ? Colors.light.danger
                        : Colors.light.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.chipText,
                      result === "win" && { color: Colors.light.primary },
                      result === "loss" && { color: Colors.light.danger },
                    ]}
                  >
                    {result === "win"
                      ? "Won"
                      : result === "loss"
                      ? "Lost"
                      : result === "draw"
                      ? "Draw"
                      : `${g.moves.length}m`}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {[...myOnlineGames].reverse().map((g) => {
              const result = getOnlinePlayerResult(g, user.username);
              const opponent =
                g.whitePlayerName.toLowerCase() === user.username.toLowerCase()
                  ? g.blackPlayerName
                  : g.whitePlayerName;
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.historyChip,
                    result === "win" && styles.chipWin,
                    result === "loss" && styles.chipLoss,
                    result === "draw" && styles.chipDraw,
                    result === null && styles.chipActive,
                  ]}
                  onPress={() =>
                    router.push({ pathname: "/game/[id]", params: { id: g.id } })
                  }
                >
                  <Feather
                    name="users"
                    size={11}
                    color={
                      result === "win"
                        ? Colors.light.primary
                        : result === "loss"
                        ? Colors.light.danger
                        : Colors.light.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.chipText,
                      result === "win" && { color: Colors.light.primary },
                      result === "loss" && { color: Colors.light.danger },
                    ]}
                    numberOfLines={1}
                  >
                    {result === "win"
                      ? "Won"
                      : result === "loss"
                      ? "Lost"
                      : result === "draw"
                      ? "Draw"
                      : `vs ${opponent}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 26,
    lineHeight: 36,
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.light.text,
  },
  gameCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.light.separator,
  },
  historyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  historyScroll: {
    gap: 8,
    paddingRight: 4,
  },
  historyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  chipWin: {
    backgroundColor: `${Colors.light.primary}12`,
    borderColor: `${Colors.light.primary}40`,
  },
  chipLoss: {
    backgroundColor: "#FFF0EE",
    borderColor: `${Colors.light.danger}40`,
  },
  chipDraw: {
    backgroundColor: Colors.light.background,
    borderColor: Colors.light.cardBorder,
  },
  chipActive: {
    backgroundColor: Colors.light.background,
    borderColor: Colors.light.accent,
  },
  chipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
