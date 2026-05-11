// 달력 기능 탐색 테스트 화면 — react-native-calendars 주요 기능 실습
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { Check, ChevronLeft, Plus, Trash2, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Agenda, Calendar, CalendarList } from "react-native-calendars";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── 타입 ─────────────────────────────────────────────────────────────
type ViewMode = "month" | "infinite" | "agenda";
type MarkingMode = "dots" | "selected" | "period" | "custom";
type EventCategory = "work" | "personal" | "family" | "todo";

interface CalendarEvent {
  id: string;
  date: string; // 'YYYY-MM-DD'
  title: string;
  category: EventCategory;
  isDone?: boolean;
}

// ─── 상수 ─────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<EventCategory, string> = {
  work: "#3b82f6",
  personal: "#eab308",
  family: "#22c55e",
  todo: "#a855f7",
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  work: "업무",
  personal: "개인",
  family: "가족",
  todo: "할 일",
};

const DARK_THEME = {
  backgroundColor: "#111111",
  calendarBackground: "#1e1e1e",
  textSectionTitleColor: "#888888",
  selectedDayBackgroundColor: "#4ECDC4",
  selectedDayTextColor: "#111111",
  todayTextColor: "#4ECDC4",
  todayBackgroundColor: "#1a3a3a",
  dayTextColor: "#e0e0e0",
  textDisabledColor: "#444444",
  dotColor: "#4ECDC4",
  selectedDotColor: "#111111",
  arrowColor: "#4ECDC4",
  disabledArrowColor: "#444444",
  monthTextColor: "#ffffff",
  indicatorColor: "#4ECDC4",
  textDayFontSize: 14,
  textMonthFontSize: 15,
  textDayHeaderFontSize: 11,
  "stylesheet.calendar.header": {
    week: {
      marginTop: 4,
      flexDirection: "row" as const,
      justifyContent: "space-around" as const,
    },
  },
};

const TODAY = dayjs().format("YYYY-MM-DD");

// 샘플 초기 일정
const INITIAL_EVENTS: CalendarEvent[] = [
  { id: "1", date: TODAY, title: "팀 미팅", category: "work" },
  { id: "2", date: TODAY, title: "점심 약속", category: "personal" },
  {
    id: "3",
    date: dayjs().add(2, "day").format("YYYY-MM-DD"),
    title: "보고서 제출",
    category: "todo",
    isDone: false,
  },
  {
    id: "4",
    date: dayjs().add(2, "day").format("YYYY-MM-DD"),
    title: "가족 저녁",
    category: "family",
  },
  {
    id: "5",
    date: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
    title: "운동",
    category: "personal",
  },
  {
    id: "6",
    date: dayjs().add(5, "day").format("YYYY-MM-DD"),
    title: "발표 준비",
    category: "work",
  },
  {
    id: "7",
    date: dayjs().add(7, "day").format("YYYY-MM-DD"),
    title: "필라테스",
    category: "personal",
  },
];

export default function CalendarTestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ─── 뷰·마킹 모드 ─────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [markingMode, setMarkingMode] = useState<MarkingMode>("dots");

  // ─── 날짜 선택 ────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string>(TODAY);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  // ─── 인터랙션 제어 ────────────────────────────────────────────────
  const [minDateEnabled, setMinDateEnabled] = useState(false);
  const [maxDateEnabled, setMaxDateEnabled] = useState(false);
  const [lastEvent, setLastEvent] = useState<string>("");

  // ─── 일정 CRUD ────────────────────────────────────────────────────
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputTitle, setInputTitle] = useState("");
  const [inputCategory, setInputCategory] = useState<EventCategory>("work");

  // ─── 마킹 데이터 파생 ─────────────────────────────────────────────
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    if (markingMode === "dots") {
      events.forEach((e) => {
        if (!marks[e.date]) marks[e.date] = { dots: [] };
        else if (!marks[e.date].dots) marks[e.date].dots = [];
        const alreadyAdded = marks[e.date].dots.some(
          (d: any) => d.key === e.category,
        );
        if (!alreadyAdded) {
          marks[e.date].dots.push({
            key: e.category,
            color: CATEGORY_COLORS[e.category],
          });
        }
      });
      // 선택 날짜 강조
      if (!marks[selectedDate]) marks[selectedDate] = {};
      marks[selectedDate].selected = true;
      marks[selectedDate].selectedColor = "#4ECDC4";
    } else if (markingMode === "selected") {
      marks[selectedDate] = {
        selected: true,
        selectedColor: "#4ECDC4",
        selectedTextColor: "#111111",
      };
    } else if (markingMode === "period") {
      if (rangeStart) {
        const end = rangeEnd ?? rangeStart;
        let cur = dayjs(rangeStart);
        const endDay = dayjs(end);
        while (!cur.isAfter(endDay)) {
          const d = cur.format("YYYY-MM-DD");
          marks[d] = {
            color: "#4ECDC4",
            textColor: "#111111",
            startingDay: d === rangeStart,
            endingDay: d === end,
          };
          cur = cur.add(1, "day");
        }
      }
    } else if (markingMode === "custom") {
      events.forEach((e) => {
        if (!marks[e.date]) {
          marks[e.date] = {
            customStyles: {
              container: {
                backgroundColor: CATEGORY_COLORS[e.category] + "40",
                borderRadius: 6,
                borderWidth: 1,
                borderColor: CATEGORY_COLORS[e.category],
              },
              text: { color: "#ffffff", fontWeight: "bold" as const },
            },
          };
        }
      });
      marks[selectedDate] = {
        customStyles: {
          container: { backgroundColor: "#4ECDC4", borderRadius: 6 },
          text: { color: "#111111", fontWeight: "bold" as const },
        },
      };
    }

    return marks;
  }, [events, markingMode, selectedDate, rangeStart, rangeEnd]);

  // CalendarList 전용 마킹 (항상 multi-dot)
  const infiniteMarks = useMemo(() => {
    const marks: Record<string, any> = {};
    events.forEach((e) => {
      if (!marks[e.date]) marks[e.date] = { dots: [] };
      const alreadyAdded = marks[e.date].dots.some(
        (d: any) => d.key === e.category,
      );
      if (!alreadyAdded)
        marks[e.date].dots.push({
          key: e.category,
          color: CATEGORY_COLORS[e.category],
        });
    });
    marks[TODAY] = {
      ...(marks[TODAY] ?? {}),
      selected: true,
      selectedColor: "#4ECDC4",
    };
    return marks;
  }, [events]);

  // Agenda items (오늘 기준 -30 ~ +60일)
  const agendaItems = useMemo(() => {
    const items: Record<string, any[]> = {};
    for (let i = -30; i <= 60; i++) {
      items[dayjs().add(i, "day").format("YYYY-MM-DD")] = [];
    }
    events.forEach((e) => {
      if (items[e.date] !== undefined) {
        items[e.date].push({
          id: e.id,
          name: e.title,
          category: e.category,
          isDone: e.isDone,
          color: CATEGORY_COLORS[e.category],
        });
      }
    });
    return items;
  }, [events]);

  // ─── 핸들러 ───────────────────────────────────────────────────────
  function handleDayPress(day: { dateString: string }) {
    const date = day.dateString;
    setLastEvent(`onDayPress → ${date}`);

    if (markingMode === "period") {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(date);
        setRangeEnd(null);
      } else {
        if (dayjs(date).isBefore(dayjs(rangeStart))) {
          setRangeStart(date);
          setRangeEnd(null);
        } else {
          setRangeEnd(date);
        }
      }
    } else {
      setSelectedDate(date);
    }
  }

  function openAddModal() {
    setEditingId(null);
    setInputTitle("");
    setInputCategory("work");
    setShowModal(true);
  }

  function openEditModal(e: CalendarEvent) {
    setEditingId(e.id);
    setInputTitle(e.title);
    setInputCategory(e.category);
    setShowModal(true);
  }

  function saveEvent() {
    if (!inputTitle.trim()) return;
    if (editingId) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? { ...e, title: inputTitle.trim(), category: inputCategory }
            : e,
        ),
      );
    } else {
      setEvents((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          date: selectedDate,
          title: inputTitle.trim(),
          category: inputCategory,
          isDone: inputCategory === "todo" ? false : undefined,
        },
      ]);
    }
    setShowModal(false);
  }

  function deleteEvent(id: string) {
    Alert.alert("일정 삭제", "이 일정을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => setEvents((prev) => prev.filter((e) => e.id !== id)),
      },
    ]);
  }

  function toggleTodo(id: string) {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isDone: !e.isDone } : e)),
    );
  }

  const selectedDateEvents = events.filter((e) => e.date === selectedDate);

  const calMarkingType =
    markingMode === "dots"
      ? ("multi-dot" as const)
      : markingMode === "period"
        ? ("period" as const)
        : markingMode === "custom"
          ? ("custom" as const)
          : undefined;

  const minDate = minDateEnabled
    ? dayjs().subtract(30, "day").format("YYYY-MM-DD")
    : undefined;
  const maxDate = maxDateEnabled
    ? dayjs().add(30, "day").format("YYYY-MM-DD")
    : undefined;

  return (
    <View className="flex-1 bg-app-bg" style={{ paddingTop: insets.top }}>
      {/* 헤더 */}
      <View className="flex-row items-center px-4 py-3 border-b border-[#222]">
        <Pressable
          onPress={() => router.back()}
          className="mr-2 p-1"
          style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
        >
          <ChevronLeft size={22} color="#fff" />
        </Pressable>
        <Text className="text-white text-lg font-bold">캘린더 테스트</Text>
      </View>

      {/* 뷰 모드 탭 */}
      <View className="flex-row px-4 pt-3 pb-2 gap-2">
        {(["month", "infinite", "agenda"] as ViewMode[]).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setViewMode(mode)}
            className={`flex-1 py-2 rounded-[8px] items-center ${
              viewMode === mode ? "bg-app-teal" : "bg-app-surface"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                viewMode === mode ? "text-[#111]" : "text-app-label"
              }`}
            >
              {mode === "month"
                ? "Month"
                : mode === "infinite"
                  ? "Infinite"
                  : "Agenda"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Month View ─────────────────────────────────────────────── */}
      {viewMode === "month" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        >
          {/* 마킹 타입 탭 */}
          <View className="flex-row px-4 mb-3 gap-1.5">
            {(["dots", "selected", "period", "custom"] as MarkingMode[]).map(
              (mode) => (
                <Pressable
                  key={mode}
                  onPress={() => {
                    setMarkingMode(mode);
                    setRangeStart(null);
                    setRangeEnd(null);
                  }}
                  className={`flex-1 py-1.5 rounded-[6px] items-center ${
                    markingMode === mode
                      ? "bg-[#4ECDC4]/15 border border-app-teal"
                      : "bg-app-surface"
                  }`}
                >
                  <Text
                    className={`text-[11px] font-medium ${
                      markingMode === mode ? "text-app-teal" : "text-app-label"
                    }`}
                  >
                    {mode === "dots"
                      ? "Dots"
                      : mode === "selected"
                        ? "Selected"
                        : mode === "period"
                          ? "Period"
                          : "Custom"}
                  </Text>
                </Pressable>
              ),
            )}
          </View>

          {/* Period 안내 */}
          {markingMode === "period" && (
            <View className="mx-4 mb-2 bg-app-surface rounded-[8px] px-3 py-2 flex-row items-center">
              <Text className="flex-1 text-app-label text-[11px]">
                {!rangeStart
                  ? "시작 날짜를 선택하세요"
                  : !rangeEnd
                    ? `시작: ${rangeStart} — 종료 날짜를 선택하세요`
                    : `선택 기간: ${rangeStart} ~ ${rangeEnd}`}
              </Text>
              {rangeStart && (
                <Pressable
                  onPress={() => {
                    setRangeStart(null);
                    setRangeEnd(null);
                  }}
                >
                  <Text className="text-app-teal text-[11px] ml-2">초기화</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* 달력 */}
          <View className="mx-4 rounded-[12px] overflow-hidden">
            <Calendar
              current={selectedDate}
              markedDates={markedDates}
              markingType={calMarkingType}
              minDate={minDate}
              maxDate={maxDate}
              onDayPress={handleDayPress}
              onMonthChange={(month) =>
                setLastEvent(`onMonthChange → ${month.dateString}`)
              }
              theme={DARK_THEME}
              enableSwipeMonths
            />
          </View>

          {/* 인터랙션 컨트롤 */}
          <View className="mx-4 mt-3 bg-app-surface rounded-[12px] px-4 py-3">
            <Text className="text-app-label text-[10px] uppercase tracking-widest mb-2">
              인터랙션 제어
            </Text>
            <View className="flex-row gap-2 mb-2">
              <Pressable
                onPress={() => setMinDateEnabled((v) => !v)}
                className={`flex-1 py-2 rounded-[6px] items-center ${
                  minDateEnabled
                    ? "bg-[#3b82f6]/15 border border-[#3b82f6]"
                    : "bg-[#2a2a2a]"
                }`}
              >
                <Text
                  className={`text-[11px] font-medium ${
                    minDateEnabled ? "text-[#3b82f6]" : "text-app-label"
                  }`}
                >
                  minDate {minDateEnabled ? "ON" : "OFF"}
                </Text>
                {minDateEnabled && (
                  <Text className="text-[#3b82f6]/70 text-[10px] mt-0.5">
                    -30일 이전 비활성
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => setMaxDateEnabled((v) => !v)}
                className={`flex-1 py-2 rounded-[6px] items-center ${
                  maxDateEnabled
                    ? "bg-[#3b82f6]/15 border border-[#3b82f6]"
                    : "bg-[#2a2a2a]"
                }`}
              >
                <Text
                  className={`text-[11px] font-medium ${
                    maxDateEnabled ? "text-[#3b82f6]" : "text-app-label"
                  }`}
                >
                  maxDate {maxDateEnabled ? "ON" : "OFF"}
                </Text>
                {maxDateEnabled && (
                  <Text className="text-[#3b82f6]/70 text-[10px] mt-0.5">
                    +30일 이후 비활성
                  </Text>
                )}
              </Pressable>
            </View>
            {lastEvent ? (
              <View className="bg-[#181818] rounded-[6px] px-3 py-2">
                <Text className="text-app-teal text-[11px]">{lastEvent}</Text>
              </View>
            ) : (
              <View className="bg-[#181818] rounded-[6px] px-3 py-2">
                <Text className="text-app-muted text-[11px]">
                  날짜 또는 월 변경 시 이벤트가 여기에 표시됩니다
                </Text>
              </View>
            )}
          </View>

          {/* 일정 목록 (CRUD) */}
          <View className="mx-4 mt-3">
            <View className="flex-row items-center mb-2">
              <Text className="flex-1 text-app-label text-[10px] uppercase tracking-widest">
                {selectedDate} 일정 ({selectedDateEvents.length})
              </Text>
              <Pressable
                onPress={openAddModal}
                className="bg-app-teal rounded-full w-6 h-6 items-center justify-center"
                style={({ pressed }) =>
                  pressed ? { opacity: 0.75 } : undefined
                }
              >
                <Plus size={14} color="#111111" />
              </Pressable>
            </View>

            {selectedDateEvents.length === 0 ? (
              <View className="bg-app-surface rounded-[10px] py-6 items-center">
                <Text className="text-app-muted text-sm">등록된 일정 없음</Text>
                <Pressable onPress={openAddModal} className="mt-2">
                  <Text className="text-app-teal text-xs">+ 일정 추가</Text>
                </Pressable>
              </View>
            ) : (
              <View className="bg-app-surface rounded-[12px] overflow-hidden">
                {selectedDateEvents.map((event, idx) => (
                  <View key={event.id}>
                    {idx > 0 && <View className="h-[1px] bg-[#2a2a2a] mx-3" />}
                    <Pressable
                      onPress={() => openEditModal(event)}
                      className="flex-row items-center px-3 py-3"
                      style={({ pressed }) =>
                        pressed ? { opacity: 0.7 } : undefined
                      }
                    >
                      <View
                        className="w-2.5 h-2.5 rounded-full mr-3 shrink-0"
                        style={{
                          backgroundColor: CATEGORY_COLORS[event.category],
                        }}
                      />
                      <View className="flex-1">
                        <Text
                          className={`text-sm ${
                            event.isDone
                              ? "line-through text-app-muted"
                              : "text-white"
                          }`}
                        >
                          {event.title}
                        </Text>
                        <Text
                          className="text-[11px] mt-0.5"
                          style={{ color: CATEGORY_COLORS[event.category] }}
                        >
                          {CATEGORY_LABELS[event.category]}
                        </Text>
                      </View>
                      {event.category === "todo" && (
                        <Pressable
                          onPress={() => toggleTodo(event.id)}
                          className="w-5 h-5 rounded border mr-2 items-center justify-center shrink-0"
                          style={
                            event.isDone
                              ? {
                                  backgroundColor: "#a855f7",
                                  borderColor: "#a855f7",
                                }
                              : { borderColor: "#555" }
                          }
                        >
                          {event.isDone && <Check size={11} color="#fff" />}
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => deleteEvent(event.id)}
                        className="p-1 shrink-0"
                        hitSlop={8}
                      >
                        <Trash2 size={14} color="#555" />
                      </Pressable>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 카테고리 범례 */}
          <View className="mx-4 mt-3 bg-app-surface rounded-[12px] px-4 py-3">
            <Text className="text-app-label text-[10px] uppercase tracking-widest mb-2">
              카테고리 컬러 코딩
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(["work", "personal", "family", "todo"] as EventCategory[]).map(
                (cat) => (
                  <View key={cat} className="flex-row items-center gap-1.5">
                    <View
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                    />
                    <Text className="text-app-dim text-[12px]">
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </View>
                ),
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── Infinite Scroll View ──────────────────────────────────── */}
      {viewMode === "infinite" && (
        <View className="flex-1 px-4">
          <Text className="text-app-label text-[10px] uppercase tracking-widest mb-2">
            CalendarList — 위아래로 스크롤하여 월 이동
          </Text>
          <View className="flex-1 rounded-[12px] overflow-hidden">
            <CalendarList
              pastScrollRange={6}
              futureScrollRange={6}
              markedDates={infiniteMarks}
              markingType="multi-dot"
              onDayPress={(day) => {
                setLastEvent(`onDayPress → ${day.dateString}`);
              }}
              onVisibleMonthsChange={(months) => {
                if (months.length > 0)
                  setLastEvent(`표시 중: ${months[0].dateString}`);
              }}
              theme={DARK_THEME}
              calendarHeight={340}
              showScrollIndicator={false}
            />
          </View>
          {lastEvent ? (
            <View className="mt-2 mb-4 bg-app-surface rounded-[8px] px-3 py-2">
              <Text className="text-app-teal text-[11px]">{lastEvent}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* ── Agenda View ───────────────────────────────────────────── */}
      {viewMode === "agenda" && (
        <View className="flex-1 mx-4">
          <Text className="text-app-label text-[10px] uppercase tracking-widest mb-2">
            Agenda — 날짜 탭 ↔ 일정 목록 연동
          </Text>
          <View className="flex-1 rounded-[12px] overflow-hidden">
            <Agenda
              items={agendaItems}
              selected={TODAY}
              renderItem={(item: any) => (
                <View
                  className="bg-app-surface rounded-[10px] px-3 py-3 mr-4 mb-2"
                  style={{ borderLeftWidth: 3, borderLeftColor: item.color }}
                >
                  <Text className="text-white text-sm">{item.name}</Text>
                  <Text
                    className="text-[11px] mt-0.5"
                    style={{ color: item.color }}
                  >
                    {CATEGORY_LABELS[item.category as EventCategory]}
                    {item.isDone !== undefined && (
                      <Text className="text-app-muted">
                        {item.isDone ? " · 완료" : " · 미완"}
                      </Text>
                    )}
                  </Text>
                </View>
              )}
              renderEmptyDate={() => (
                <View className="h-12 justify-center mr-4">
                  <Text className="text-app-muted text-sm">일정 없음</Text>
                </View>
              )}
              rowHasChanged={(r1: any, r2: any) => r1.id !== r2.id}
              theme={{
                ...DARK_THEME,
                agendaDayTextColor: "#4ECDC4",
                agendaDayNumColor: "#ffffff",
                agendaTodayColor: "#4ECDC4",
                agendaKnobColor: "#4ECDC4",
                reservationsBackgroundColor: "#111111",
              }}
            />
          </View>
        </View>
      )}

      {/* ── 일정 추가/수정 모달 ──────────────────────────────────────── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setShowModal(false)}
        >
          {/* onPress 전파 차단 */}
          <Pressable
            onPress={() => {}}
            className="bg-[#1c1c1c] rounded-t-[20px] px-5 pt-4"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <View className="w-10 h-1 bg-[#3a3a3a] rounded-full self-center mb-4" />

            <View className="flex-row items-center mb-4">
              <Text className="flex-1 text-white text-base font-bold">
                {editingId ? "일정 수정" : `일정 추가 — ${selectedDate}`}
              </Text>
              <Pressable
                onPress={() => setShowModal(false)}
                className="p-1"
                hitSlop={8}
              >
                <X size={18} color="#666" />
              </Pressable>
            </View>

            <Text className="text-app-label text-[10px] uppercase tracking-widest mb-1.5">
              제목
            </Text>
            <TextInput
              value={inputTitle}
              onChangeText={setInputTitle}
              placeholder="일정 제목을 입력하세요"
              placeholderTextColor="#555"
              className="bg-[#2a2a2a] text-white rounded-[10px] px-3 py-3 text-sm mb-4"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveEvent}
            />

            <Text className="text-app-label text-[10px] uppercase tracking-widest mb-1.5">
              카테고리
            </Text>
            <View className="flex-row gap-2 mb-5">
              {(["work", "personal", "family", "todo"] as EventCategory[]).map(
                (cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setInputCategory(cat)}
                    className="flex-1 py-2.5 rounded-[8px] items-center"
                    style={
                      inputCategory === cat
                        ? {
                            backgroundColor: CATEGORY_COLORS[cat] + "30",
                            borderWidth: 1,
                            borderColor: CATEGORY_COLORS[cat],
                          }
                        : { backgroundColor: "#2a2a2a" }
                    }
                  >
                    <Text
                      className="text-[11px] font-medium"
                      style={{
                        color:
                          inputCategory === cat ? CATEGORY_COLORS[cat] : "#777",
                      }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>

            <Pressable
              onPress={saveEvent}
              disabled={!inputTitle.trim()}
              className="bg-app-teal rounded-[10px] py-3.5 items-center"
              style={({ pressed }) =>
                !inputTitle.trim()
                  ? { opacity: 0.35 }
                  : pressed
                    ? { opacity: 0.8 }
                    : undefined
              }
            >
              <Text className="text-[#111] font-bold text-sm">
                {editingId ? "수정 완료" : "저장"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
