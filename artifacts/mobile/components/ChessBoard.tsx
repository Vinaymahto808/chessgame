import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Vibration,
  Platform,
} from "react-native";
import { Chess } from "chess.js";
import Colors from "@/constants/colors";
import {
  squareToCoords,
  coordsToSquare,
  getLegalMovesForSquare,
  isPromotion,
  isInCheck,
  getKingSquare,
  PIECE_SYMBOLS,
  type PieceType,
  type PieceColor,
} from "@/utils/chessUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 16, 420);
const SQUARE_SIZE = BOARD_SIZE / 8;

interface ChessBoardProps {
  fen: string;
  currentTurn: "white" | "black";
  status: string;
  onMove: (from: string, to: string, promotion?: string) => void;
  lastMove?: { from: string; to: string } | null;
  flipped?: boolean;
}

export default function ChessBoard({
  fen,
  currentTurn,
  status,
  onMove,
  lastMove,
  flipped = false,
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [promotionState, setPromotionState] = useState<{
    from: string;
    to: string;
  } | null>(null);

  const chess = useMemo(() => new Chess(fen), [fen]);
  const board = chess.board();
  const isGameOver = status !== "active";

  const inCheck = isInCheck(fen);
  const turnColor: PieceColor = currentTurn === "white" ? "w" : "b";
  const kingInCheck = inCheck ? getKingSquare(fen, turnColor) : null;

  const handleSquarePress = useCallback(
    (square: string) => {
      if (isGameOver) return;

      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      if (selectedSquare && legalMoves.includes(square)) {
        if (isPromotion(fen, selectedSquare, square)) {
          setPromotionState({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          setLegalMoves([]);
        } else {
          onMove(selectedSquare, square);
          setSelectedSquare(null);
          setLegalMoves([]);
          if (Platform.OS !== "web") Vibration.vibrate(30);
        }
        return;
      }

      const piece = chess.get(square as any);
      if (piece && piece.color === turnColor) {
        setSelectedSquare(square);
        setLegalMoves(getLegalMovesForSquare(fen, square));
        if (Platform.OS !== "web") Vibration.vibrate(20);
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    },
    [selectedSquare, legalMoves, fen, chess, onMove, isGameOver, turnColor]
  );

  const handlePromotion = useCallback(
    (piece: string) => {
      if (promotionState) {
        onMove(promotionState.from, promotionState.to, piece);
        setPromotionState(null);
      }
    },
    [promotionState, onMove]
  );

  const renderFiles = () => {
    const files = flipped ? ["h", "g", "f", "e", "d", "c", "b", "a"] : ["a", "b", "c", "d", "e", "f", "g", "h"];
    return (
      <View style={styles.fileLabels}>
        {files.map((f) => (
          <Text key={f} style={[styles.coordLabel, { width: SQUARE_SIZE }]}>
            {f}
          </Text>
        ))}
      </View>
    );
  };

  const renderRanks = () => {
    const ranks = flipped ? ["1", "2", "3", "4", "5", "6", "7", "8"] : ["8", "7", "6", "5", "4", "3", "2", "1"];
    return (
      <View style={styles.rankLabels}>
        {ranks.map((r) => (
          <Text key={r} style={[styles.coordLabel, { height: SQUARE_SIZE }]}>
            {r}
          </Text>
        ))}
      </View>
    );
  };

  const renderBoard = () => {
    const rows = flipped ? [...board].reverse() : board;
    return rows.map((row, rowIdx) => {
      const actualRow = flipped ? 7 - rowIdx : rowIdx;
      const cols = flipped ? [...row].reverse() : row;
      return (
        <View key={rowIdx} style={styles.row}>
          {cols.map((piece, colIdx) => {
            const actualCol = flipped ? 7 - colIdx : colIdx;
            const square = coordsToSquare(actualRow, actualCol);
            const isLight = (actualRow + actualCol) % 2 === 0;
            const isSelected = selectedSquare === square;
            const isLegal = legalMoves.includes(square);
            const isLastMoveFrom = lastMove?.from === square;
            const isLastMoveTo = lastMove?.to === square;
            const isKingInCheck = kingInCheck === square;

            let bg = isLight ? Colors.light.boardLight : Colors.light.boardDark;
            if (isSelected) bg = Colors.light.boardSelected;
            else if (isKingInCheck) bg = Colors.light.boardCheck;
            else if (isLastMoveFrom || isLastMoveTo) bg = isLight ? "#CDD16E" : "#AAA823";

            return (
              <TouchableOpacity
                key={square}
                onPress={() => handleSquarePress(square)}
                style={[styles.square, { backgroundColor: bg }]}
                activeOpacity={0.9}
              >
                {isLegal && (
                  <View
                    style={[
                      piece ? styles.captureDot : styles.moveDot,
                    ]}
                    pointerEvents="none"
                  />
                )}
                {piece && (
                  <Text
                    style={[
                      styles.piece,
                      {
                        color:
                          piece.color === "w"
                            ? Colors.light.pieceWhite
                            : Colors.light.pieceBlack,
                        textShadow: piece.color === "w"
                          ? "0px 1px 2px rgba(0,0,0,0.8)"
                          : "0px 1px 2px rgba(255,255,255,0.3)",
                      },
                    ]}
                  >
                    {PIECE_SYMBOLS[piece.color as PieceColor][piece.type as PieceType]}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.boardWrapper}>
        {renderRanks()}
        <View style={styles.boardInner}>
          {renderBoard()}
        </View>
      </View>
      {renderFiles()}

      {promotionState && (
        <View style={styles.promotionOverlay}>
          <View style={styles.promotionModal}>
            <Text style={styles.promotionTitle}>Promote Pawn</Text>
            <View style={styles.promotionPieces}>
              {(["q", "r", "b", "n"] as PieceType[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.promotionPiece}
                  onPress={() => handlePromotion(p)}
                >
                  <Text style={styles.promotionPieceText}>
                    {PIECE_SYMBOLS[turnColor][p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  boardWrapper: {
    flexDirection: "row",
  },
  rankLabels: {
    justifyContent: "space-around",
    paddingRight: 4,
  },
  boardInner: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    borderWidth: 2,
    borderColor: Colors.light.boardDark,
    borderRadius: 2,
    overflow: "hidden",
  },
  fileLabels: {
    flexDirection: "row",
    paddingLeft: 20,
    paddingTop: 4,
  },
  coordLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
    textAlign: "center",
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  piece: {
    fontSize: SQUARE_SIZE * 0.72,
    lineHeight: SQUARE_SIZE * 0.9,
  },
  moveDot: {
    position: "absolute",
    width: SQUARE_SIZE * 0.3,
    height: SQUARE_SIZE * 0.3,
    borderRadius: SQUARE_SIZE * 0.15,
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 1,
  },
  captureDot: {
    position: "absolute",
    width: SQUARE_SIZE - 4,
    height: SQUARE_SIZE - 4,
    borderRadius: (SQUARE_SIZE - 4) / 2,
    borderWidth: 3,
    borderColor: "rgba(0,0,0,0.25)",
    zIndex: 1,
  },
  promotionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  promotionModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  promotionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 16,
  },
  promotionPieces: {
    flexDirection: "row",
    gap: 12,
  },
  promotionPiece: {
    width: 64,
    height: 64,
    backgroundColor: Colors.light.boardLight,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.light.boardDark,
  },
  promotionPieceText: {
    fontSize: 40,
    color: Colors.light.pieceBlack,
    textShadow: "0px 1px 2px rgba(0,0,0,0.5)",
  },
});
