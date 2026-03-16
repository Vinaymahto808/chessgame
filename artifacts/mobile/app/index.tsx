import React, { useState, useCallback, useEffect } from "react";
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
import GameCard from "@/components/GameCard";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { games, isLoading, error, fetchGames, createGame, deleteGame } = useGames();
  const [showNewGame, setShowNewGame] = useState(false);
  const [whiteName, setWhiteName] = useState("");
  const [blackName, setBlackName] = useState("");
  const [creating, setCreating] = useState(false);

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
    } catch (e) {
      Alert.alert("Error", "Could not create game. Try again.");
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
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteGame(game.id),
          },
        ]
      );
    },
    [deleteGame]
  );

  const activeGames = games.filter((g) => g.status === "active");
  const finishedGames = games.filter((g) => g.status !== "active");

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Chess</Text>
          <Text style={styles.subtitle}>
            {games.length} {games.length === 1 ? "game" : "games"}
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

      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={fetchGames}>
          <Feather name="wifi-off" size={16} color={Colors.light.danger} />
          <Text style={styles.errorText}>Tap to retry</Text>
        </TouchableOpacity>
      )}

      {isLoading && games.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.light.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <>
              {activeGames.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Active Games</Text>
                  {activeGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onPress={() =>
                        router.push({
                          pathname: "/game/[id]",
                          params: { id: game.id },
                        })
                      }
                      onDelete={() => handleDelete(game)}
                    />
                  ))}
                </>
              )}

              {finishedGames.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Completed</Text>
                  {finishedGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onPress={() =>
                        router.push({
                          pathname: "/game/[id]",
                          params: { id: game.id },
                        })
                      }
                      onDelete={() => handleDelete(game)}
                    />
                  ))}
                </>
              )}

              {games.length === 0 && !isLoading && (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconBg}>
                    <Text style={styles.emptyIcon}>♟</Text>
                  </View>
                  <Text style={styles.emptyTitle}>No games yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Start a new game to play
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setShowNewGame(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.emptyButtonText}>New Game</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          }
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom:
                (Platform.OS === "web" ? 34 : insets.bottom) + 20,
            },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!games.length}
          keyExtractor={() => "list"}
        />
      )}

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
          <Text style={styles.modalTitle}>New Game</Text>

          <View style={styles.inputGroup}>
            <View style={styles.playerInputRow}>
              <View style={[styles.colorIndicator, { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#999" }]} />
              <TextInput
                style={styles.input}
                placeholder="White player"
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
                placeholder="Black player"
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
    paddingBottom: 16,
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
    boxShadow: `0px 4px 8px rgba(45,106,79,0.3)`,
    elevation: 4,
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
    fontSize: 14,
    color: Colors.light.danger,
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
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
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
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 28,
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
