import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import Colors from "@/constants/colors";
import { useGames, type Game } from "@/context/GamesContext";
import { useLocalGameContext, type LocalGame } from "@/context/LocalGameContext";
import { useAuth } from "@/context/AuthContext";
import GameCard from "@/components/GameCard";
import PlayerStats from "@/components/PlayerStats";
import { Chess } from "chess.js";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { games, isLoading, error, fetchGames, deleteGame } = useGames();
  const { localGames, deleteLocalGame, saveGame } = useLocalGameContext();
  const { user, setShowLoginModal } = useAuth();

  const [showNewGame, setShowNewGame] = useState(false);
  const [whiteName, setWhiteName] = useState("");
  const [blackName, setBlackName] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchGames();
    }, [fetchGames])
  );

  const openNewGame = useCallback(() => {
    setWhiteName(user?.username ?? "");
    setBlackName("");
    setShowNewGame(true);
  }, [user]);

  const handleCreate = () => {
    const wName = whiteName.trim() || "White";
    const bName = blackName.trim() || "Black";
    const newGame: LocalGame = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      playerColor: "white",
      playerName: wName,
      fen: new Chess().fen(),
      status: "active",
      currentTurn: "white",
      moves: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveGame(newGame);
    setShowNewGame(false);
    setWhiteName("");
    setBlackName("");
    router.push({ pathname: "/local-game", params: { id: newGame.id, whiteName: wName, blackName: bName } });
  };

  const handleDelete = useCallback(
    (game: Game) => {
      Alert.alert(
        "Delete Game",
        `Delete game between ${game.whitePlayerName} and ${game.blackPlayerName}?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteGame(game.id) },
        ]
      );
    },
    [deleteGame]
  );

  const handleDeleteLocal = useCallback(
    (id: string) => {
      Alert.alert("Delete Game", "Delete this offline game?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteLocalGame(id) },
      ]);
    },
    [deleteLocalGame]
  );

  const startComputerGame = (playerColor: "white" | "black") => {
    setShowColorPicker(false);
    router.push({ pathname: "/local-game", params: { playerColor } });
  };

  const activeGames = games.filter((g) => g.status === "active");
  const finishedGames = games.filter((g) => g.status !== "active");
  const activeLocalGames = localGames.filter((g) => g.status === "active");
  const finishedLocalGames = localGames.filter((g) => g.status !== "active");

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoKing}>♔</Text>
          </View>
          <Text style={styles.title}>Chess</Text>
        </View>

        {user ? (
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => setShowLoginModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarBtnText}>{user.avatar}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => setShowLoginModal(true)}
          >
            <Feather name="user" size={16} color={Colors.light.primary} />
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading && games.length === 0 && localGames.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <>
              {/* Player Stats Card */}
              {user && <PlayerStats />}

              {/* Mode Cards */}
              <View style={styles.modesRow}>
                <TouchableOpacity
                  style={[styles.modeCard, styles.modeCardAI]}
                  onPress={() => setShowColorPicker(true)}
                  activeOpacity={0.85}
                >
                  <View style={styles.modeIconBg}>
                    <Feather name="cpu" size={22} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.modeTitle, { color: "#FFFFFF" }]}>vs Computer</Text>
                  <Text style={[styles.modeSub, { color: "rgba(255,255,255,0.75)" }]}>
                    Offline · AI opponent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeCard, styles.modeCardLocal]}
                  onPress={openNewGame}
                  activeOpacity={0.85}
                >
                  <View style={[styles.modeIconBg, { backgroundColor: `${Colors.light.accent}CC` }]}>
                    <Feather name="users" size={22} color="#FFFFFF" />
                  </View>
                  <Text style={styles.modeTitle}>2 Players</Text>
                  <Text style={styles.modeSub}>Pass & play online</Text>
                </TouchableOpacity>
              </View>

              {error && (
                <TouchableOpacity style={styles.errorBanner} onPress={fetchGames}>
                  <Feather name="wifi-off" size={16} color={Colors.light.danger} />
                  <Text style={styles.errorText}>
                    Online games unavailable — tap to retry
                  </Text>
                </TouchableOpacity>
              )}

              {/* Active computer games */}
              {activeLocalGames.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Computer Games</Text>
                  {activeLocalGames.map((g) => (
                    <View key={g.id} style={styles.localCard}>
                      <TouchableOpacity
                        style={styles.localCardLeft}
                        onPress={() =>
                          router.push({ pathname: "/local-game", params: { id: g.id } })
                        }
                        activeOpacity={0.85}
                      >
                        <View style={styles.localCardIcon}>
                          <Feather name="cpu" size={16} color={Colors.light.primary} />
                        </View>
                        <View>
                          <Text style={styles.localCardTitle}>
                            You ({g.playerColor === "white" ? "White" : "Black"}) vs Computer
                          </Text>
                          <Text style={styles.localCardSub}>
                            {g.moves.length} moves ·{" "}
                            {g.currentTurn === g.playerColor ? "Your turn" : "Computer's turn"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteLocal(g.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather name="trash-2" size={16} color={Colors.light.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}

              {/* Finished computer games */}
              {finishedLocalGames.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Completed vs Computer</Text>
                  {finishedLocalGames.map((g) => {
                    const playerWon =
                      (g.status === "white_wins" && g.playerColor === "white") ||
                      (g.status === "black_wins" && g.playerColor === "black");
                    const isDraw = g.status === "draw" || g.status === "stalemate";
                    return (
                      <View key={g.id} style={styles.localCard}>
                        <TouchableOpacity
                          style={styles.localCardLeft}
                          onPress={() =>
                            router.push({ pathname: "/local-game", params: { id: g.id } })
                          }
                          activeOpacity={0.85}
                        >
                          <View
                            style={[
                              styles.localCardIcon,
                              {
                                backgroundColor: playerWon
                                  ? `${Colors.light.primary}15`
                                  : isDraw
                                  ? `${Colors.light.textSecondary}10`
                                  : "#FFF0EE",
                              },
                            ]}
                          >
                            <Feather
                              name={playerWon ? "award" : isDraw ? "minus" : "cpu"}
                              size={16}
                              color={
                                playerWon
                                  ? Colors.light.primary
                                  : isDraw
                                  ? Colors.light.textSecondary
                                  : Colors.light.danger
                              }
                            />
                          </View>
                          <View>
                            <Text style={styles.localCardTitle}>
                              {playerWon ? "You won" : isDraw ? "Draw" : "Computer won"}
                            </Text>
                            <Text style={styles.localCardSub}>
                              {g.moves.length} moves · You played {g.playerColor}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteLocal(g.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Feather name="trash-2" size={16} color={Colors.light.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </>
              )}

              {/* Active online 2-player games */}
              {activeGames.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Online Games</Text>
                  {activeGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onPress={() =>
                        router.push({ pathname: "/game/[id]", params: { id: game.id } })
                      }
                      onDelete={() => handleDelete(game)}
                    />
                  ))}
                </>
              )}

              {finishedGames.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Completed (Online)</Text>
                  {finishedGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onPress={() =>
                        router.push({ pathname: "/game/[id]", params: { id: game.id } })
                      }
                      onDelete={() => handleDelete(game)}
                    />
                  ))}
                </>
              )}

              {games.length === 0 && localGames.length === 0 && !isLoading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No games yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Choose a mode above to start playing
                  </Text>
                </View>
              )}
            </>
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(games.length || localGames.length) || !!user}
          keyExtractor={() => "list"}
        />
      )}

      {/* ─── Color Picker Modal ─── */}
      <Modal
        visible={showColorPicker}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Play as</Text>
          <Text style={styles.modalSubtitle}>Choose your color</Text>

          <View style={styles.colorPickerRow}>
            <TouchableOpacity
              style={styles.colorOption}
              onPress={() => startComputerGame("white")}
              activeOpacity={0.85}
            >
              <View style={[styles.colorCircle, styles.colorCircleWhite]}>
                <Text style={styles.colorPieceWhite}>♔</Text>
              </View>
              <Text style={styles.colorLabel}>White</Text>
              <Text style={styles.colorSub}>Move first</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.colorOption}
              onPress={() => startComputerGame("black")}
              activeOpacity={0.85}
            >
              <View style={[styles.colorCircle, styles.colorCircleBlack]}>
                <Text style={styles.colorPieceBlack}>♚</Text>
              </View>
              <Text style={styles.colorLabel}>Black</Text>
              <Text style={styles.colorSub}>Move second</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setShowColorPicker(false)}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ─── 2-Player Game Modal ─── */}
      <Modal
        visible={showNewGame}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowNewGame(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>New 2-Player Game</Text>

          <View style={styles.inputGroup}>
            <View style={styles.playerInputRow}>
              <View style={[styles.colorIndicator, { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#999" }]} />
              <TextInput
                style={styles.input}
                placeholder="White player name"
                placeholderTextColor={Colors.light.textSecondary}
                value={whiteName}
                onChangeText={setWhiteName}
                autoFocus
                returnKeyType="next"
              />
            </View>
            <View style={styles.inputDivider} />
            <View style={styles.playerInputRow}>
              <View style={[styles.colorIndicator, { backgroundColor: "#1A1A2E" }]} />
              <TextInput
                style={styles.input}
                placeholder="Black player name"
                placeholderTextColor={Colors.light.textSecondary}
                value={blackName}
                onChangeText={setBlackName}
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={handleCreate}
            activeOpacity={0.85}
          >
            <Text style={styles.createBtnText}>Start Game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              setShowNewGame(false);
              setWhiteName("");
              setBlackName("");
            }}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoKing: {
    fontSize: 22,
    color: "#FFFFFF",
    lineHeight: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBtnText: {
    fontSize: 22,
    lineHeight: 30,
    color: "#FFFFFF",
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: `${Colors.light.primary}14`,
    borderWidth: 1,
    borderColor: `${Colors.light.primary}30`,
  },
  signInText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  listContent: {
    paddingTop: 4,
  },
  modesRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modeCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  modeCardAI: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  modeCardLocal: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.cardBorder,
  },
  modeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  modeTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 3,
  },
  modeSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#FFF0EE",
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.danger,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  localCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  localCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  localCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Colors.light.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  localCardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
  },
  localCardSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.cardBorder,
    alignSelf: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 32,
  },
  colorPickerRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  colorOption: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    gap: 8,
  },
  colorCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  colorCircleWhite: {
    backgroundColor: "#F5F0E8",
    borderWidth: 2,
    borderColor: Colors.light.boardDark,
  },
  colorCircleBlack: {
    backgroundColor: "#2A2A3E",
    borderWidth: 2,
    borderColor: "#555",
  },
  colorPieceWhite: {
    fontSize: 38,
    color: Colors.light.text,
  },
  colorPieceBlack: {
    fontSize: 38,
    color: "#FFFFFF",
  },
  colorLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.light.text,
  },
  colorSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  inputGroup: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    marginBottom: 20,
    overflow: "hidden",
  },
  playerInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  colorIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  inputDivider: {
    height: 1,
    backgroundColor: Colors.light.separator,
    marginLeft: 46,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  createBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  createBtnDisabled: {
    opacity: 0.6,
  },
  createBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  cancelBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
});
