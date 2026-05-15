// 앱 시작 시 표시되는 PIN 입력 잠금 화면 — 완전 초기화 옵션 포함
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { resetDatabase } from "@/db/client";
import { seedDefaultGroups } from "@/db/seed";
import { usePinLock } from "@/providers/PinLockProvider";
import { deleteStoredPin } from "@/utils/pin";
import { PinPad } from "./PinPad";

export function LockScreen() {
  const { unlock, verifyPin } = usePinLock();
  const [pin, setPin] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (pin.length !== 6) return;

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
  }, [pin]);

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

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]} className="bg-app-bg items-center justify-center">
      <Text className="text-white text-xl font-semibold mb-2">비밀번호 입력</Text>
      <Text className="text-app-muted text-sm mb-10">
        {isError ? "비밀번호가 틀렸습니다." : "6자리 비밀번호를 입력하세요."}
      </Text>

      <PinPad
        pin={pin}
        onChange={handlePinChange}
        isError={isError}
        disabled={isError}
      />

      <TouchableOpacity onPress={handleReset} style={{ marginTop: 48 }}>
        <Text className="text-app-muted text-sm">비밀번호를 잊으셨나요?</Text>
      </TouchableOpacity>
    </View>
  );
}
