// 연도·월 드럼롤 선택 Modal — 리스트 탭 커스텀 기간 선택에 사용
import { Picker } from "@react-native-picker/picker";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
};

const CURRENT_YEAR = dayjs().year();
const YEARS = Array.from({ length: 21 }, (_, i) => CURRENT_YEAR - 10 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function MonthPickerModal({ visible, value, onChange, onClose }: Props) {
  const [year, setYear] = useState(dayjs(value).year());
  const [month, setMonth] = useState(dayjs(value).month() + 1);

  useEffect(() => {
    if (visible) {
      setYear(dayjs(value).year());
      setMonth(dayjs(value).month() + 1);
    }
  }, [visible, value]);

  function handleConfirm() {
    onChange(
      dayjs().year(year).month(month - 1).startOf("month").toDate(),
    );
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
      >
        <Pressable className="bg-app-surface rounded-t-[20px]">
          <View className="w-10 h-1 bg-[#444] rounded-full self-center mt-3" />

          <View className="flex-row justify-between items-center px-5 pt-4 pb-1">
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-app-muted text-[15px]">취소</Text>
            </Pressable>
            <Text className="text-white text-[15px] font-semibold">
              {year}년 {month}월
            </Text>
            <Pressable onPress={handleConfirm} hitSlop={12}>
              <Text className="text-app-teal text-[15px] font-semibold">
                확인
              </Text>
            </Pressable>
          </View>

          <View className="flex-row">
            <Picker
              style={{ flex: 1 }}
              selectedValue={year}
              onValueChange={(v) => setYear(Number(v))}
              itemStyle={{ color: "white", fontSize: 18 }}
            >
              {YEARS.map((y) => (
                <Picker.Item key={y} label={`${y}년`} value={y} />
              ))}
            </Picker>
            <Picker
              style={{ flex: 1 }}
              selectedValue={month}
              onValueChange={(v) => setMonth(Number(v))}
              itemStyle={{ color: "white", fontSize: 18 }}
            >
              {MONTHS.map((m) => (
                <Picker.Item key={m} label={`${m}월`} value={m} />
              ))}
            </Picker>
          </View>

          <View style={{ height: 34 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
