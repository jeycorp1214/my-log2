// 생년월일 스마트 입력 컴포넌트 — 나이·연도·6자리·8자리 숫자 자동 파싱
import { calcAge, parseBirthInput } from "@/utils/date";
import { cn } from "@/utils/utils";
import dayjs from "dayjs";
import { Calendar } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
};

export function BirthDateInput({ value, onChange }: Props) {
  const [text, setText] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const digits = text.replace(/\D/g, "");
  const typedDate = digits.length >= 2 ? parseBirthInput(text) : null;
  const previewDate = digits.length >= 2 ? typedDate : value;
  const showError = digits.length >= 2 && typedDate === null;

  function handleChange(raw: string) {
    setText(raw);
    if (!raw) {
      onChange(null);
      return;
    }
    const result = parseBirthInput(raw);
    if (result) onChange(result);
  }

  function handleClear() {
    setText("");
    onChange(null);
  }

  function handlePickerSelect(date: Date) {
    setText("");
    onChange(date);
    setShowPicker(false);
  }

  const previewStr = previewDate
    ? (() => {
        const d = dayjs(previewDate);
        const dateLabel = d.format("YYYY년 M월 D일");
        const ageStr = calcAge(d.format("YYYY-MM-DD"));
        return `${dateLabel} · 만 ${ageStr}세`;
      })()
    : null;

  return (
    <View>
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-app-label text-[13px]">생년월일</Text>
        {value && !text && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Text className="text-app-muted text-[12px]">지우기</Text>
          </Pressable>
        )}
      </View>

      <View className="flex-row gap-2">
        <TextInput
          className="flex-1 bg-app-surface text-white rounded-[10px] p-3 text-sm"
          value={text}
          onChangeText={handleChange}
          placeholder="나이(77) · 연도(1950) · 날짜(800510)"
          placeholderTextColor="#555"
          keyboardType="number-pad"
        />
        <Pressable
          onPress={() => setShowPicker(true)}
          className="bg-app-surface rounded-[10px] items-center justify-center w-12"
        >
          <Calendar size={20} color="#4ecdc4" />
        </Pressable>
      </View>

      {previewStr && (
        <Text
          className={cn(
            "text-[13px] mt-2 px-1",
            showError ? "text-[#ff6b6b]" : "text-[#4ecdc4]",
          )}
        >
          {text ? `→ ${previewStr}` : previewStr}
        </Text>
      )}

      {showError && (
        <Text className="text-[#ff6b6b] text-[11px] mt-1 px-1">
          인식 불가 — 나이 2자리 / 연도 4자리 / 날짜 6자리(YYMMDD) /
          8자리(YYYYMMDD)
        </Text>
      )}
    </View>
  );
}
