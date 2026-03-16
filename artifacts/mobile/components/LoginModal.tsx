import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import Colors from "@/constants/colors";

export default function LoginModal() {
  const { showLoginModal, login } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (showLoginModal) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showLoginModal]);

  const handleLogin = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setError("");
    await login(trimmed);
  };

  return (
    <Modal
      visible={showLoginModal}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoBg}>
              <Text style={styles.logoKing}>♔</Text>
            </View>
            <Text style={styles.logoTitle}>Chess</Text>
            <Text style={styles.logoSubtitle}>The classic game of strategy</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Your Name</Text>
          <View style={[styles.inputWrap, error ? styles.inputError : null]}>
            <Text style={styles.inputIcon}>♟</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name…"
              placeholderTextColor={Colors.light.textSecondary}
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (error) setError("");
              }}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              maxLength={24}
              autoCapitalize="words"
            />
          </View>
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.btn, !name.trim() && styles.btnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Start Playing</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Your name is saved locally on this device.
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10,12,20,0.75)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    width: "100%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoBg: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoKing: {
    fontSize: 48,
    color: "#FFFFFF",
    lineHeight: 60,
  },
  logoTitle: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.separator,
    marginBottom: 24,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 8,
  },
  inputError: {
    borderColor: Colors.light.danger,
  },
  inputIcon: {
    fontSize: 20,
    color: Colors.light.textSecondary,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.danger,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  note: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});
