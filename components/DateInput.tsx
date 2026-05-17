// 날짜 입력 필드 컴포넌트 — field(폼 필드) / compact(인라인) 두 가지 형태
import { CalendarPickerModal } from "@/components/CalendarPickerModal";
import { formatLogDate } from "@/utils/date";
import { cn } from "@/utils/utils";
import dayjs from "dayjs";
import { Calendar } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

interface DateInputProps {
  value: Date | null;
  onChange: (date: Date) => void;
  onClear?: () => void;
  label?: string;
  placeholder?: string;
  defaultValue?: Date;
  variant?: "field" | "compact";
  className?: string;
}

export function DateInput({
  value,
  onChange,
  onClear,
  label,
  placeholder = "날짜 선택",
  defaultValue,
  variant = "field",
  className,
}: DateInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  function handleSelect(date: Date) {
    onChange(date);
    setShowPicker(false);
  }

  if (variant === "compact") {
    return (
      <>
        <Pressable
          onPress={() => setShowPicker(true)}
          className="flex-1 bg-[#1a1a1a] rounded-[8px] px-2 py-1.5"
        >
          <Text className={cn("text-[13px]", value ? "text-[#ccc]" : "text-[#555]")}>
            {value ? dayjs(value).format("YYYY.MM.DD") : placeholder}
          </Text>
        </Pressable>
        <CalendarPickerModal
          visible={showPicker}
          value={value}
          onSelect={handleSelect}
          onClose={() => setShowPicker(false)}
        />
      </>
    );
  }

  return (
    <View className={className}>
      {label && (
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-app-label text-[13px]">{label}</Text>
          {onClear && value && (
            <Pressable onPress={onClear} hitSlop={8}>
              <Text className="text-app-muted text-[12px]">지우기</Text>
            </Pressable>
          )}
        </View>
      )}
      <Pressable
        onPress={() => setShowPicker(true)}
        className="bg-app-surface rounded-[10px] p-3 flex-row items-center justify-between"
      >
        <Text className={cn("text-sm", value ? "text-white" : "text-[#555]")}>
          {value ? formatLogDate(value) : placeholder}
        </Text>
        <Calendar size={18} color="#4ecdc4" />
      </Pressable>
      <CalendarPickerModal
        visible={showPicker}
        value={value}
        onSelect={handleSelect}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
}
