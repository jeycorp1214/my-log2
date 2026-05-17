// PIN 비밀번호 설정/변경/비활성화 화면
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Switch, Text, View } from "react-native";

import { PinPad } from "@/components/PinPad";
import { usePinLock } from "@/providers/PinLockProvider";

type Step =
  | null
  | "enable-new"
  | "enable-confirm"
  | "disable-verify"
  | "change-verify"
  | "change-new"
  | "change-confirm";

const STEP_TITLES: Record<Exclude<Step, null>, string> = {
  "enable-new": "새 비밀번호 입력",
  "enable-confirm": "비밀번호 확인",
  "disable-verify": "현재 비밀번호 입력",
  "change-verify": "현재 비밀번호 입력",
  "change-new": "새 비밀번호 입력",
  "change-confirm": "새 비밀번호 확인",
};

export default function PasswordSettingsScreen() {
  const navigation = useNavigation();
  const { isPinEnabled, enablePin, disablePin, changePin, verifyPin } = usePinLock();

  const [step, setStep] = useState<Step>(null);
  const [pin, setPin] = useState("");
  const [isError, setIsError] = useState(false);
  const tempPinRef = useRef("");

  useEffect(() => {
    if (pin.length !== 6) return;
    handlePinComplete(pin);
  }, [pin]);

  useEffect(() => {
    if (step !== null) {
      navigation.setOptions({
        title: "",
        headerLeft: () => (
          <Pressable onPress={handleBack} hitSlop={12}>
            <Text style={{ color: "#4ECDC4", fontSize: 16 }}>취소</Text>
          </Pressable>
        ),
      });
    } else {
      navigation.setOptions({ title: "비밀번호", headerLeft: undefined });
    }
  }, [step]);

  function flashError() {
    setIsError(true);
    setTimeout(() => {
      setIsError(false);
      setPin("");
    }, 700);
  }

  function handlePinChange(next: string) {
    if (isError) return;
    setPin(next);
  }

  async function handlePinComplete(entered: string) {
    switch (step) {
      case "enable-new": {
        tempPinRef.current = entered;
        setPin("");
        setStep("enable-confirm");
        break;
      }
      case "enable-confirm": {
        if (entered === tempPinRef.current) {
          await enablePin(entered);
          setStep(null);
          Alert.alert("완료", "비밀번호가 설정되었습니다.");
        } else {
          flashError();
        }
        break;
      }
      case "disable-verify": {
        const ok = await verifyPin(entered);
        if (ok) {
          await disablePin();
          setStep(null);
        } else {
          flashError();
        }
        break;
      }
      case "change-verify": {
        const ok = await verifyPin(entered);
        if (ok) {
          setPin("");
          setStep("change-new");
        } else {
          flashError();
        }
        break;
      }
      case "change-new": {
        tempPinRef.current = entered;
        setPin("");
        setStep("change-confirm");
        break;
      }
      case "change-confirm": {
        if (entered === tempPinRef.current) {
          await changePin(entered);
          setStep(null);
          Alert.alert("완료", "비밀번호가 변경되었습니다.");
        } else {
          flashError();
        }
        break;
      }
    }
  }

  function handleToggle() {
    if (isPinEnabled) {
      setPin("");
      setStep("disable-verify");
    } else {
      setPin("");
      setStep("enable-new");
    }
  }

  function handleChangePin() {
    setPin("");
    setStep("change-verify");
  }

  function handleBack() {
    setStep(null);
    setPin("");
    setIsError(false);
    tempPinRef.current = "";
  }

  // PIN 입력 화면
  if (step !== null) {
    return (
      <View className="flex-1 bg-app-bg">
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-xl font-semibold mb-2">
            {STEP_TITLES[step]}
          </Text>
          <Text className="text-app-muted text-sm mb-10">
            {isError ? "비밀번호가 일치하지 않습니다." : "6자리 숫자를 입력하세요."}
          </Text>

          <PinPad
            pin={pin}
            onChange={handlePinChange}
            isError={isError}
            disabled={isError}
          />
        </View>
      </View>
    );
  }

  // 메인 설정 화면
  return (
    <View className="flex-1 bg-app-bg">
      <View className="px-4 pt-4">
        <View className="bg-app-surface rounded-[12px] overflow-hidden">
          <View className="flex-row items-center px-[14px] py-[16px]">
            <View className="flex-1">
              <Text className="text-white text-sm">비밀번호 잠금</Text>
              <Text className="text-app-muted text-[12px] mt-0.5">
                앱 시작 시 비밀번호 입력 요구
              </Text>
            </View>
            <Switch
              value={isPinEnabled}
              onValueChange={handleToggle}
              trackColor={{ false: "#333", true: "#1a3a3a" }}
              thumbColor={isPinEnabled ? "#4ECDC4" : "#666"}
            />
          </View>

          {isPinEnabled && (
            <>
              <View className="h-[1px] bg-[#2a2a2a] mx-[14px]" />
              <Pressable
                onPress={handleChangePin}
                className="flex-row items-center px-[14px] py-[16px]"
                style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
              >
                <Text className="text-white text-sm">비밀번호 변경</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
