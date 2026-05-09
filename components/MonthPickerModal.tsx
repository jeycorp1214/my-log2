// 연도별 월 선택 모달 — 12개 미니 캘린더 스크롤로 월 선택
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

const WEEKDAYS_SHORT = ["일", "월", "화", "수", "목", "금", "토"];

interface Props {
  visible: boolean;
  currentMonth: Date;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}

function MiniCalendar({ year, month }: { year: number; month: number }) {
  const start = dayjs(new Date(year, month, 1));
  const daysInMonth = start.daysInMonth();
  const startDow = start.day();

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const today = new Date();
  const todayDate =
    today.getFullYear() === year && today.getMonth() === month
      ? today.getDate()
      : -1;

  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        {WEEKDAYS_SHORT.map((d, i) => (
          <Text
            key={d}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 9,
              color: i === 0 ? "#ff6b6b" : i === 6 ? "#4ecdc4" : "#555",
            }}
          >
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: "row" }}>
          {week.map((day, di) => (
            <View
              key={di}
              style={{ flex: 1, alignItems: "center", paddingVertical: 1 }}
            >
              {day !== null && (
                <View
                  style={{
                    width: 15,
                    height: 15,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      day === todayDate ? "#4ecdc4" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      color:
                        day === todayDate
                          ? "#111"
                          : di === 0
                            ? "#ff6b6b"
                            : di === 6
                              ? "#4ecdc4"
                              : "#bbb",
                    }}
                  >
                    {day}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function MonthPickerModal({
  visible,
  currentMonth,
  onSelect,
  onClose,
}: Props) {
  const [pickerYear, setPickerYear] = useState(currentMonth.getFullYear());

  useEffect(() => {
    if (visible) setPickerYear(currentMonth.getFullYear());
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#111" }}>
        <SafeAreaView style={{ backgroundColor: "#111" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#222",
              paddingTop: 40,
            }}
          >
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color="#e0e0e0" />
            </Pressable>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 20 }}
            >
              <Pressable
                onPress={() => setPickerYear((y) => y - 1)}
                hitSlop={8}
              >
                <ChevronLeft size={20} color="#e0e0e0" />
              </Pressable>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
                {pickerYear}년
              </Text>
              <Pressable
                onPress={() => setPickerYear((y) => y + 1)}
                hitSlop={8}
              >
                <ChevronRight size={20} color="#e0e0e0" />
              </Pressable>
            </View>
            <View style={{ width: 22 }} />
          </View>
        </SafeAreaView>

        <ScrollView
          contentContainerStyle={{ padding: 12, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {[0, 2, 4, 6, 8, 10].map((startMonth) => (
            <View key={startMonth} style={{ flexDirection: "row", gap: 12 }}>
              {[startMonth, startMonth + 1].map((m) => {
                const isSelected =
                  pickerYear === currentMonth.getFullYear() &&
                  m === currentMonth.getMonth();
                return (
                  <Pressable
                    key={m}
                    onPress={() => onSelect(pickerYear, m)}
                    style={{
                      flex: 1,
                      backgroundColor: "#1a1a1a",
                      borderRadius: 12,
                      padding: 10,
                      borderWidth: isSelected ? 1.5 : 0,
                      borderColor: "#4ecdc4",
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#4ecdc4" : "#fff",
                        fontSize: 13,
                        fontWeight: "600",
                        textAlign: "center",
                        marginBottom: 6,
                      }}
                    >
                      {m + 1}월
                    </Text>
                    <MiniCalendar year={pickerYear} month={m} />
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
