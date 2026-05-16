// 필터 바텀 시트 공통 래퍼 — Modal + 반투명 backdrop + 드래그 핸들
import { Modal, Pressable, Text, View } from "react-native";

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function FilterBottomSheet({ visible, onClose, children }: FilterBottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable
          className="bg-app-surface rounded-t-[20px] px-5 pt-5 pb-10"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-10 h-1 bg-[#444] rounded-full self-center mb-5" />
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface FilterChipGroupProps<T extends string | boolean> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export function FilterChipGroup<T extends string | boolean>({
  label,
  options,
  value,
  onChange,
  className = "mb-5",
}: FilterChipGroupProps<T>) {
  return (
    <View className={className}>
      <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
        {label}
      </Text>
      <View className="flex-row gap-2">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <Pressable
              key={String(opt.value)}
              onPress={() => onChange(opt.value)}
              className="flex-1 rounded-[10px] py-2.5 items-center"
              style={{ backgroundColor: isSelected ? "#4ecdc4" : "#2a2a2a" }}
            >
              <Text
                className="text-[13px] font-semibold"
                style={{ color: isSelected ? "#111" : "#888" }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
