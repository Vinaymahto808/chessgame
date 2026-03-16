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
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import Colors from "@/constants/colors";
import { useGames, type Game } from "@/context/GamesContext";
import { useLocalGameContext } from "@/context/LocalGameContext";
import GameCard from "@/components/GameCard";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { games, isLoading, error, fetchGames, createGame, deleteGame } = useGames();
  const { localGames, deleteLocalGame } = useLocalGameContext();

  const [showNewGame, setShowNewGame] = useState(false);
  const [whiteName, setWhiteName] = useState("");
  const [blackName, setBlackName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchGames();
    }, [fetchGames])
  );

  const handleCreate = async () => {
    const wName = whiteName.trim() || "White";
    const bName = blackName.trim() || "Black";
    setCreating(true);
    try {
      const game = await createGame(wName, bName);
      setShowNewGame(false);
      setWhiteName("");
      setBlackName("");
      router.push({ pathname: "/game/[id]", params: { id: game.id } });
    } catch {
      Alert.alert("Error", "Could not create game. Check your connection.");
    } finally {
      setCreating(false);
    }
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
    router.push({
      pathname: "/local-game",
      params: { playerColor },
    });
  };

  const activeGames = games.filter((g) => g.status === "active");
  const finishedGames = games.filter((g) => g.status !== "active");
  const activeLocalGames = localGames.filter((g) => g.status === "active");
  const finishedLocalGames = localGames.filter((g) => g.status !== "active");

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Chess</Text>
          <Text style={styles.subtitle}>
            {games.length + localGames.length}{" "}
            {games.length + localGames.length === 1 ? "game" : "games"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setShowNewGame(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.modesRow}>
        <TouchableOpacity
          style={[styles.modeCard, styles.modeCardAI]}
          onPress={() => setShowColorPicker(true)}
          activeOpacity={0.85}
        >
          <View style={styles.modeIconBg}>
            <Feather name="cpu" size={22} color="#FFFFFF" />
          </View>
          <Text style={[styles.modeTitle, styles.modeTitleAI]}>vs Computer</Text>
          <Text style={[styles.modeSub, styles.modeSubAI]}>Offline · AI opponent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeCard, styles.modeCardLocal]}
          onPress={() => setShowNewGame(true)}
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
          <Text style={styles.errorText}>Online games unavailable — tap to retry</Text>
        </TouchableOpacity>
      )}

      {isLoading && games.length === 0 && localGames.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.light.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <>
              {activeLocalGames.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Computer Games</Text>
                  {activeLocalGames.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={styles.localCard}
                      onPress={() =>
                        router.push({ pathname: "/local-game", params: { id: g.id } })
                      }
                      activeOpacity={0.85}
                    >
                      <View style={styles.localCardLeft}>
                        <View style={styles.localCardIcon}>
                          <Feather name="cpu" size={16} color={Colors.light.primary} />
                        </View>
                        <View>
                          <Text style={styles.localCardTitle}>
                            You (
                            {g.playerColor === "white" ? "White" : "Black"}) vs Computer
                          </Text>
                          <Text style={styles.localCardSub}>
                            {g.moves.length} moves ·{" "}
                            {g.currentTurn === g.playerColor ? "Your turn" : "Computer's turn"}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteLocal(g.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather name="trash-2" size={16} color={Colors.light.textSecondary} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {finishedLocalGames.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Completed (Offline)</Text>
                  {finishedLocalGames.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.localCard, { opacity: 0.7 }]}
                      onPress={() =>
                        router.push({ pathname: "/local-game", params: { id: g.id } })
                      }
                      activeOpacity={0.85}
                    >
                      <View style={styles.localCardLeft}>
                        <View style={styles.localCardIcon}>
                          <Feather name="cpu" size={16} color={Colors.light.textSecondary} />
                        </View>
                        <View>
                          <Text style={styles.localCardTitle}>
                            You (
                            {g.playerColor === "white" ? "White" : "Black"}) vs Computer
                          </Text>
                          <Text style={styles.localCardSub}>
                            {g.moves.length} moves ·{" "}
                            {g.status === "draw" || g.status === "stalemate"
                              ? "Draw"
                              : g.status === "white_wins"
                              ? "White won"
                              : "Black won"}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteLocal(g.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather name="trash-2" size={16} color={Colors.light.textSecondary} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </>
              )}

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
          scrollEnabled={!!(games.length || localGames.length)}
          keyExtractor={() => "list"}
        />
      )}

      {/* Color Picker Modal */}
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

      {/* 2-Player Game Modal */}
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
            <View style={styles.divider} />
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
            style={[styles.createBtn, creating && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={creating}
            activeOpacity={0.85}
          >
            {creating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.createBtnText}>Start Game</Text>
            )}
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
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  newBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 4px 8px rgba(45,106,79,0.3)",
    elevation: 4,
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
  modeTitleAI: {
    color: "#FFFFFF",
  },
  modeSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  modeSubAI: {
    color: "rgba(255,255,255,0.7)",
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingTop: 4,
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
    boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
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
  divider: {
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
    boxShadow: "0px 4px 8px rgba(45,106,79,0.3)",
    elevation: 4,
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
