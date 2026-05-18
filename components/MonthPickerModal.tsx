// 연도·월 드럼롤 선택 Modal — 리스트 탭 커스텀 기간 선택에 사용
import { Picker } from "@react-native-picker/picker";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
};

const CURRENT_YEAR = dayjs().year();
// 최근 10년 전부터 향후 10년까지 총 21개년
const YEARS = Array.from({ length: 21 }, (_, i) => CURRENT_YEAR - 10 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function MonthPickerModal({ visible, value, onChange, onClose }: Props) {
  const [year, setYear] = useState(dayjs(value).year());
  const [month, setMonth] = useState(dayjs(value).month() + 1);

  // 모달이 열릴 때마다 props로 들어온 value 값으로 상태 초기화
  useEffect(() => {
    if (visible) {
      setYear(dayjs(value).year());
      setMonth(dayjs(value).month() + 1);
    }
  }, [visible, value]);

  function handleConfirm() {
    // 기존 value를 기반으로 연/월을 변경하고 해당 월의 1일로 설정
    const updatedDate = dayjs(value)
      .year(year)
      .month(month - 1)
      .startOf("month")
      .toDate();

    onChange(updatedDate);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* 바깥 어두운 배경 클릭 시 닫기 */}
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        {/* 내부 콘텐츠 클릭 시 닫히는 현상 방지용 onPress */}
        <Pressable
          className="bg-app-surface rounded-t-[20px]"
          onPress={(e) => Platform.OS === "ios" && e.stopPropagation()} // iOS 전파 방지 트리거
        >
          {/* 상단 핸들 바 */}
          <View className="w-10 h-1 bg-[#444] rounded-full self-center mt-3" />

          {/* 헤더 영역 */}
          <View className="flex-row justify-between items-center px-5 pt-4 pb-1">
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-app-muted text-sm">취소</Text>
            </Pressable>
            <Text className="text-white text-sm font-semibold">
              {year}년 {month}월
            </Text>
            <Pressable onPress={handleConfirm} hitSlop={12}>
              <Text className="text-app-teal text-sm font-semibold">
                확인
              </Text>
            </Pressable>
          </View>

          {/* 드럼롤 픽커 영역 */}
          <View className="flex-row">
            <Picker
              style={{ flex: 1 }}
              selectedValue={year}
              onValueChange={(v) => setYear(Number(v))}
              itemStyle={{ color: "white", fontSize: 18 }}
              dropdownIconColor="white" // 안드로이드 화살표 색상 대응
            >
              {YEARS.map((y) => (
                <Picker.Item
                  key={y}
                  label={`${y}년`}
                  value={y}
                  color={Platform.OS === "android" ? "#fff" : undefined}
                />
              ))}
            </Picker>

            <Picker
              style={{ flex: 1 }}
              selectedValue={month}
              onValueChange={(v) => setMonth(Number(v))}
              itemStyle={{ color: "white", fontSize: 18 }}
              dropdownIconColor="white"
            >
              {MONTHS.map((m) => (
                <Picker.Item
                  key={m}
                  label={`${m}월`}
                  value={m}
                  color={Platform.OS === "android" ? "#fff" : undefined}
                />
              ))}
            </Picker>
          </View>

          {/* 하단 여백 (기기별 노치 대응을 위해 react-native-safe-area-context의 인셋을 활용하는 것을 추천합니다) */}
          <View style={{ height: 34 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
