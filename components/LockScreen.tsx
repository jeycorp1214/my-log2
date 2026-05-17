// 앱 시작 시 표시되는 PIN 입력 잠금 화면 — 완전 초기화 옵션 포함
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { resetDatabase } from "@/db/client";
import { seedDefaultGroups } from "@/db/seed";
import { usePinLock } from "@/providers/PinLockProvider";
import { deleteStoredPin } from "@/utils/pin";
import { PinPad } from "./PinPad";

function getTodaySecretKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `SECRET_KEY_${y}${m}${day}`;
}

export function LockScreen() {
  const { unlock, verifyPin, pinLength } = usePinLock();
  const [pin, setPin] = useState("");
  const [isError, setIsError] = useState(false);
  const [mode, setMode] = useState<"pin" | "secret">("pin");
  const [secretInput, setSecretInput] = useState("");
  const [secretError, setSecretError] = useState(false);

  useEffect(() => {
    if (pin.length !== pinLength) return;

    verifyPin(pin).then((ok) => {
      if (ok) {
        unlock();
      } else {
        setIsError(true);
        setTimeout(() => {
          setIsError(false);
          setPin("");
        }, 700);
      }
    });
  }, [pin, pinLength]);

  function handlePinChange(next: string) {
    if (isError) return;
    setPin(next);
  }

  async function handleReset() {
    Alert.alert(
      "앱 초기화",
      "모든 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "초기화",
          style: "destructive",
          onPress: async () => {
            try {
              await resetDatabase();
              await seedDefaultGroups();
              await deleteStoredPin();
              unlock();
            } catch (e) {
              Alert.alert("오류", "초기화 중 오류가 발생했습니다.");
            }
          },
        },
      ],
    );
  }

  async function handleSecretSubmit() {
    if (secretInput.trim() === getTodaySecretKey()) {
      await deleteStoredPin();
      unlock();
    } else {
      setSecretError(true);
    }
  }

  function handleForgotPassword() {
    Alert.alert("비밀번호를 잊으셨나요?", "복구 방법을 선택하세요.", [
      { text: "취소", style: "cancel" },
      {
        text: "시크릿 키 입력",
        onPress: () => {
          setSecretInput("");
          setSecretError(false);
          setMode("secret");
        },
      },
      {
        text: "앱 초기화",
        style: "destructive",
        onPress: handleReset,
      },
    ]);
  }

  if (mode === "secret") {
    return (
      <View
        style={[StyleSheet.absoluteFill, { zIndex: 999 }]}
        className="bg-app-bg items-center justify-center"
      >
        <Text className="text-white text-xl font-semibold mb-2">
          시크릿 키 입력
        </Text>
        <Text className="text-app-muted text-sm mb-10 text-center px-8">
          오늘 날짜가 포함된 시크릿 키를 입력하세요.
        </Text>

        <View className="w-full px-8">
          <TextInput
            value={secretInput}
            onChangeText={(t) => {
              setSecretInput(t);
              setSecretError(false);
            }}
            placeholder="SECRET_KEY_YYYYMMDD"
            placeholderTextColor="#555"
            autoCapitalize="characters"
            autoCorrect={false}
            style={{
              backgroundColor: "#1e1e1e",
              color: "white",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
              fontSize: 15,
              marginBottom: 12,
              letterSpacing: 1,
            }}
          />
          {secretError && (
            <Text className="text-app-danger text-sm text-center mb-3">
              시크릿 키가 올바르지 않습니다.
            </Text>
          )}
          <Pressable
            onPress={handleSecretSubmit}
            style={{
              backgroundColor: "#4ECDC4",
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "black", fontWeight: "600", fontSize: 15 }}>
              확인
            </Text>
          </Pressable>
          <TouchableOpacity
            onPress={() => {
              setMode("pin");
              setSecretInput("");
              setSecretError(false);
            }}
            style={{ alignItems: "center" }}
          >
            <Text className="text-app-muted text-sm">돌아가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 999 }]}
      className="bg-app-bg items-center justify-center"
    >
      <Text className="text-white text-xl font-semibold mb-2">
        비밀번호 입력
      </Text>
      <Text className="text-app-muted text-sm mb-10">
        {isError
          ? "비밀번호가 틀렸습니다."
          : `${pinLength}자리 비밀번호를 입력하세요.`}
      </Text>

      <PinPad
        pin={pin}
        onChange={handlePinChange}
        isError={isError}
        disabled={isError}
        length={pinLength}
      />

      <TouchableOpacity onPress={handleForgotPassword} style={{ marginTop: 48 }}>
        <Text className="text-app-muted text-sm">비밀번호를 잊으셨나요?</Text>
      </TouchableOpacity>
    </View>
  );
}
