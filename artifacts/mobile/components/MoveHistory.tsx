import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import Colors from "@/constants/colors";
import { type Move } from "@/context/GamesContext";

interface MoveHistoryProps {
  moves: Move[];
}

export default function MoveHistory({ moves }: MoveHistoryProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (moves.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [moves.length]);

  const pairs: Array<[Move, Move | undefined]> = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1]]);
  }

  if (moves.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No moves yet</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.col, styles.colNum]}>#</Text>
        <Text style={[styles.col, styles.colMove]}>White</Text>
        <Text style={[styles.col, styles.colMove]}>Black</Text>
      </View>
      {pairs.map(([white, black], idx) => (
        <View
          key={idx}
          style={[styles.row, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}
        >
          <Text style={[styles.col, styles.colNum, styles.moveNum]}>
            {idx + 1}.
          </Text>
          <Text
            style={[
              styles.col,
              styles.colMove,
              styles.moveText,
              !black && styles.lastMove,
            ]}
          >
            {white.san}
          </Text>
          <Text
            style={[
              styles.col,
              styles.colMove,
              styles.moveText,
              !!black && styles.lastMove,
            ]}
          >
            {black?.san ?? ""}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 140,
  },
  content: {
    paddingBottom: 4,
  },
  empty: {
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  header: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.separator,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  rowEven: {
    backgroundColor: "transparent",
  },
  rowOdd: {
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  col: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  colNum: {
    width: 30,
  },
  colMove: {
    flex: 1,
  },
  moveNum: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  moveText: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  lastMove: {
    color: Colors.light.primary,
    fontFamily: "Inter_600SemiBold",
  },
});
