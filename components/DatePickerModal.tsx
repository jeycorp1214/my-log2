// 날짜 선택 모달 컴포넌트 — CalendarGrid 기반 인라인 날짜 선택
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import dayjs from "dayjs";

import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { formatMonthYear } from "@/utils/date";

interface Props {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

export function DatePickerModal({ visible, value, onChange, onClose }: Props) {
  const [pickerMonth, setPickerMonth] = useState(value);

  useEffect(() => {
    if (visible) setPickerMonth(value);
  }, [visible]);

  function handleSelect(date: Date) {
    onChange(date);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center"
        onPress={onClose}
      >
        <Pressable className="bg-app-surface rounded-[16px] w-80 overflow-hidden">
          <View className="flex-row items-center justify-between px-4 pt-4 pb-1">
            <Pressable
              onPress={() => setPickerMonth(dayjs(pickerMonth).subtract(1, "month").toDate())}
              className="p-2"
            >
              <Text className="text-white text-xl">‹</Text>
            </Pressable>
            <Text className="text-white text-base font-semibold">
              {formatMonthYear(pickerMonth)}
            </Text>
            <Pressable
              onPress={() => setPickerMonth(dayjs(pickerMonth).add(1, "month").toDate())}
              className="p-2"
            >
              <Text className="text-white text-xl">›</Text>
            </Pressable>
          </View>
          <View className="pb-3">
            <CalendarGrid
              currentMonth={pickerMonth}
              selectedDate={value}
              markedDates={[]}
              onSelectDate={handleSelect}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
