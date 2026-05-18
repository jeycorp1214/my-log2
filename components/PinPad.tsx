// 숫자 PIN 입력 키패드 — 점 표시 + 숫자 버튼
import { Pressable, Text, View } from "react-native";

import { cn } from "@/utils/utils";

type Props = {
  pin: string;
  onChange: (pin: string) => void;
  isError?: boolean;
  disabled?: boolean;
  length?: 4 | 6;
};

const ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["C", "0", "⌫"],
];

export function PinPad({
  pin,
  onChange,
  isError = false,
  disabled = false,
  length = 6,
}: Props) {
  function handleKey(key: string) {
    if (disabled) return;
    if (key === "⌫") {
      onChange(pin.slice(0, -1));
    } else if (key === "C") {
      onChange("");
    } else if (pin.length < length) {
      onChange(pin + key);
    }
  }

  return (
    <View className="w-full items-center">
      {/* PIN 점 */}
      <View className="flex-row gap-5 mb-14">
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            className={cn(
              "w-4 h-4 rounded-full",
              i < pin.length
                ? isError
                  ? "bg-app-danger"
                  : "bg-app-teal"
                : "bg-[#333]",
            )}
          />
        ))}
      </View>

      {/* 키패드: flex-1 셀 래퍼로 동일 너비 확보, px-1.5가 버튼 간격 역할 */}
      <View className="w-full px-4 gap-3">
        {ROWS.map((row, rowIdx) => (
          <View key={rowIdx} className="flex-row">
            {row.map((key, colIdx) => (
              <View key={colIdx} className="flex-1 px-1.5">
                <Pressable
                  onPress={() => handleKey(key)}
                  disabled={disabled}
                  className={cn(
                    "w-full h-20 rounded-2xl items-center justify-center",
                    key === "C" ? "bg-[#1e1414]" : "bg-app-surface",
                  )}
                  style={({ pressed }) =>
                    pressed ? { opacity: 0.6 } : undefined
                  }
                >
                  <Text
                    className={cn(
                      key === "C"
                        ? "text-app-danger text-sm font-medium"
                        : "text-white text-xl font-light",
                    )}
                  >
                    {key}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
