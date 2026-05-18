// 로그 폼 공유 컴포넌트 — 생성/편집에서 공통 사용
import { CalendarPickerModal } from "@/components/CalendarPickerModal";
import { DateInput } from "@/components/DateInput";
import { FilterBottomSheet } from "@/components/FilterBottomSheet";
import { db } from "@/db/client";
import { groups, persons } from "@/db/schema";
import { PRESET_COLORS, REPEAT_OPTIONS } from "@/db/seed";
import { formatLogDate } from "@/utils/date";
import { Plus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type Group = typeof groups.$inferSelect;
type Person = typeof persons.$inferSelect;

type ActiveSheet = "group" | "interval" | null;

interface LogFormProps {
  title: string;
  onTitleChange: (v: string) => void;
  logDate: Date;
  onLogDateChange: (v: Date) => void;
  memo: string;
  onMemoChange: (v: string) => void;
  repeatType: string;
  onRepeatTypeChange: (v: string) => void;
  repeatInterval: number | null;
  onRepeatIntervalChange: (v: number | null) => void;
  repeatUntil: Date | null;
  onRepeatUntilChange: (v: Date | null) => void;
  groupId: number | null;
  onGroupIdChange: (v: number) => void;
  allGroups: Group[];
  allPersons: Person[];
  selectedPersonIds: number[];
  onTogglePerson: (id: number) => void;
  showRepeat?: boolean;
}

export function LogForm({
  title,
  onTitleChange,
  logDate,
  onLogDateChange,
  memo,
  onMemoChange,
  repeatType,
  onRepeatTypeChange,
  repeatInterval,
  onRepeatIntervalChange,
  repeatUntil,
  onRepeatUntilChange,
  groupId,
  onGroupIdChange,
  allGroups,
  allPersons,
  selectedPersonIds,
  onTogglePerson,
  showRepeat = true,
}: LogFormProps) {
  const [showRepeatUntilPicker, setShowRepeatUntilPicker] = useState(false);
  const [personSearch, setPersonSearch] = useState("");
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [sheetInput, setSheetInput] = useState("");

  const isCustomRepeat =
    repeatType === "daily" && repeatInterval !== null && repeatInterval > 1;

  function openSheet(sheet: ActiveSheet) {
    setSheetInput("");
    setActiveSheet(sheet);
  }

  function closeSheet() {
    setSheetInput("");
    setActiveSheet(null);
  }

  async function handleSheetConfirm() {
    const trimmed = sheetInput.trim();
    if (activeSheet === "group" && trimmed) {
      const color = PRESET_COLORS[allGroups.length % PRESET_COLORS.length];
      const result = await db
        .insert(groups)
        .values({ name: trimmed, color })
        .returning({ id: groups.id });
      onGroupIdChange(result[0].id);
    } else if (activeSheet === "interval") {
      const num = parseInt(sheetInput, 10);
      if (!isNaN(num) && num > 1) {
        onRepeatIntervalChange(num);
        onRepeatTypeChange("daily");
      }
    }
    closeSheet();
  }

  return (
    <>
      <DateInput
        label="날짜"
        value={logDate}
        onChange={onLogDateChange}
        className="mt-3"
      />

      <Text className="text-app-label text-sm mt-3">제목 *</Text>
      <TextInput
        className="bg-app-surface text-white rounded-[10px] p-3 text-sm"
        value={title}
        onChangeText={onTitleChange}
        placeholder="기록 제목"
        placeholderTextColor="#555"
      />

      <Text className="text-app-label text-sm mt-3">메모</Text>
      <TextInput
        className="bg-app-surface text-white rounded-[10px] p-3 text-sm"
        value={memo}
        onChangeText={onMemoChange}
        placeholder="메모"
        placeholderTextColor="#555"
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: "top" }}
      />

      {showRepeat && (
        <>
          <Text className="text-app-label text-sm mt-3">반복</Text>
          <View className="flex-row flex-wrap gap-2 mt-1">
            {REPEAT_OPTIONS.map(({ label, value }) => (
              <Pressable
                key={value}
                onPress={() => {
                  onRepeatTypeChange(value);
                  onRepeatIntervalChange(null);
                  if (value === "none") onRepeatUntilChange(null);
                }}
                className={`rounded-[20px] px-3 py-1.5 ${
                  repeatType === value && !isCustomRepeat
                    ? "bg-app-teal"
                    : "bg-app-surface"
                }`}
              >
                <Text
                  className={`text-sm ${
                    repeatType === value && !isCustomRepeat
                      ? "text-[#111] font-semibold"
                      : "text-app-label"
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => openSheet("interval")}
              className={`flex-row items-center gap-1 rounded-[20px] px-3 py-1.5 ${
                isCustomRepeat ? "bg-app-teal" : "bg-app-surface"
              }`}
            >
              {!isCustomRepeat && <Plus size={12} color="#4ecdc4" />}
              <Text
                className={`text-sm ${
                  isCustomRepeat ? "text-[#111] font-semibold" : "text-app-teal"
                }`}
              >
                {isCustomRepeat ? `${repeatInterval}일마다` : "직접 입력"}
              </Text>
            </Pressable>
          </View>

          {repeatType !== "none" && (
            <View className="mt-1">
              <Text className="text-app-label text-sm mb-2">반복 종료일</Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => onRepeatUntilChange(null)}
                  className={`rounded-[20px] px-3 py-1.5 ${
                    !repeatUntil ? "bg-app-teal" : "bg-app-surface"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      !repeatUntil
                        ? "text-[#111] font-semibold"
                        : "text-app-label"
                    }`}
                  >
                    영구
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowRepeatUntilPicker(true)}
                  className={`flex-1 rounded-[20px] px-3 py-1.5 ${
                    repeatUntil ? "bg-app-teal" : "bg-app-surface"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      repeatUntil
                        ? "text-[#111] font-semibold"
                        : "text-app-label"
                    }`}
                  >
                    {repeatUntil ? formatLogDate(repeatUntil) : "종료일 지정"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}

      <Text className="text-app-label text-sm mt-3">그룹</Text>
      <View className="flex-row flex-wrap gap-2 mt-1">
        {allGroups.map((g) => (
          <Pressable
            key={g.id}
            onPress={() => onGroupIdChange(g.id)}
            className={`rounded-[20px] px-3 py-1.5 ${
              groupId === g.id ? "bg-app-teal" : "bg-app-surface"
            }`}
          >
            <Text
              className={`text-sm ${
                groupId === g.id ? "text-[#111] font-semibold" : "text-app-label"
              }`}
            >
              {g.emoji} {g.name}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => openSheet("group")}
          className="flex-row items-center gap-1 rounded-[20px] px-3 py-1.5 bg-app-surface"
        >
          <Plus size={12} color="#4ecdc4" />
          <Text className="text-app-teal text-sm">직접 입력</Text>
        </Pressable>
      </View>

      <Text className="text-app-label text-sm mt-3">관련 프로필</Text>
      {allPersons.length > 8 && (
        <TextInput
          className="bg-app-surface text-white rounded-[10px] px-3 py-2 text-sm mt-1"
          value={personSearch}
          onChangeText={setPersonSearch}
          placeholder="프로필 검색"
          placeholderTextColor="#555"
        />
      )}
      <View className="flex-row flex-wrap gap-2 mt-1">
        {[
          ...allPersons.filter((p) => selectedPersonIds.includes(p.id)),
          ...allPersons
            .filter((p) => !selectedPersonIds.includes(p.id))
            .filter((p) =>
              personSearch.trim() ? p.name.includes(personSearch.trim()) : true,
            ),
        ].map((p) => (
          <Pressable
            key={p.id}
            onPress={() => onTogglePerson(p.id)}
            className={`rounded-[20px] px-3 py-1.5 ${
              selectedPersonIds.includes(p.id) ? "bg-app-teal" : "bg-app-surface"
            }`}
          >
            <Text
              className={`text-sm ${
                selectedPersonIds.includes(p.id)
                  ? "text-[#111] font-semibold"
                  : "text-app-label"
              }`}
            >
              {p.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <FilterBottomSheet visible={activeSheet !== null} onClose={closeSheet}>
        {activeSheet !== null && (
          <>
            <Text className="text-white text-base font-semibold mb-4">
              {activeSheet === "group" ? "새 그룹 추가" : "반복 간격 설정"}
            </Text>
            <TextInput
              className="bg-[#1a1a1a] text-white rounded-[10px] px-4 py-3 text-sm"
              value={sheetInput}
              onChangeText={setSheetInput}
              placeholder={activeSheet === "group" ? "그룹 이름" : "일 수 입력"}
              placeholderTextColor="#555"
              keyboardType={activeSheet === "interval" ? "number-pad" : "default"}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSheetConfirm}
            />
            {activeSheet === "interval" && (
              <Text className="text-app-muted text-xs mt-2">
                숫자만 입력하세요 (예: 7 = 7일마다)
              </Text>
            )}
            <View className="flex-row gap-3 mt-5">
              <Pressable
                onPress={closeSheet}
                className="flex-1 rounded-[10px] py-3 items-center bg-[#1a1a1a]"
              >
                <Text className="text-app-label text-sm">취소</Text>
              </Pressable>
              <Pressable
                onPress={handleSheetConfirm}
                className="flex-1 rounded-[10px] py-3 items-center bg-app-teal"
              >
                <Text className="text-[#111] text-sm font-semibold">확인</Text>
              </Pressable>
            </View>
          </>
        )}
      </FilterBottomSheet>

      <CalendarPickerModal
        visible={showRepeatUntilPicker}
        value={repeatUntil}
        onSelect={(date) => {
          onRepeatUntilChange(date);
          setShowRepeatUntilPicker(false);
        }}
        onClose={() => setShowRepeatUntilPicker(false)}
      />
    </>
  );
}
