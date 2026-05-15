// 6자리 숫자 PIN 입력 키패드 — 점 표시 + 숫자 버튼
import { Pressable, Text, View } from "react-native";

type Props = {
  pin: string;
  onChange: (pin: string) => void;
  isError?: boolean;
  disabled?: boolean;
};

const ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

export function PinPad({ pin, onChange, isError = false, disabled = false }: Props) {
  function handleKey(key: string) {
    if (disabled) return;
    if (key === "⌫") {
      onChange(pin.slice(0, -1));
    } else if (key !== "" && pin.length < 6) {
      onChange(pin + key);
    }
  }

  const dotColor = isError ? "#ff6b6b" : "#4ECDC4";

  return (
    <View style={{ alignItems: "center" }}>
      {/* PIN 점 6개 */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 48 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: i < pin.length ? dotColor : "#333333",
            }}
          />
        ))}
      </View>

      {/* 키패드 */}
      <View style={{ width: 280 }}>
        {ROWS.map((row, rowIdx) => (
          <View
            key={rowIdx}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: rowIdx < 3 ? 12 : 0,
            }}
          >
            {row.map((key, colIdx) => (
              <Pressable
                key={colIdx}
                onPress={() => handleKey(key)}
                disabled={key === "" || disabled}
                style={({ pressed }) => ({
                  width: 84,
                  height: 60,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: key === "" ? "transparent" : pressed ? "#2a2a2a" : "#1e1e1e",
                  opacity: key === "" ? 0 : 1,
                })}
              >
                <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "300" }}>
                  {key}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
