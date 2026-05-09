// 로그 폼 공유 컴포넌트 — 생성/수정에서 공통 사용
import { DatePickerModal } from "@/components/DatePickerModal";
import { groups, persons } from "@/db/schema";
import { REPEAT_OPTIONS } from "@/db/seed";
import { formatLogDate } from "@/utils/date";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type Group = typeof groups.$inferSelect;
type Person = typeof persons.$inferSelect;

interface LogFormProps {
  title: string;
  onTitleChange: (v: string) => void;
  logDate: Date;
  onLogDateChange: (v: Date) => void;
  memo: string;
  onMemoChange: (v: string) => void;
  repeatType: string;
  onRepeatTypeChange: (v: string) => void;
  repeatUntil: Date | null;
  onRepeatUntilChange: (v: Date | null) => void;
  groupId: string;
  onGroupIdChange: (v: string) => void;
  allGroups: Group[];
  allPersons: Person[];
  selectedPersonIds: string[];
  onTogglePerson: (id: string) => void;
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRepeatUntilPicker, setShowRepeatUntilPicker] = useState(false);

  return (
    <>
      <Text className="text-app-label text-[13px] mt-3">날짜</Text>
      <Pressable
        onPress={() => setShowDatePicker(true)}
        className="bg-app-surface rounded-[10px] p-3 flex-row items-center justify-between"
      >
        <Text className="text-white text-[15px]">{formatLogDate(logDate)}</Text>
        <Text className="text-app-muted text-[13px]">변경</Text>
      </Pressable>
      <DatePickerModal
        visible={showDatePicker}
        value={logDate}
        onChange={onLogDateChange}
        onClose={() => setShowDatePicker(false)}
      />

      <Text className="text-app-label text-[13px] mt-3">제목 *</Text>
      <TextInput
        className="bg-app-surface text-white rounded-[10px] p-3 text-[15px]"
        value={title}
        onChangeText={onTitleChange}
        placeholder="기록 제목"
        placeholderTextColor="#555"
      />

      <Text className="text-app-label text-[13px] mt-3">메모</Text>
      <TextInput
        className="bg-app-surface text-white rounded-[10px] p-3 text-[15px]"
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
          <Text className="text-app-label text-[13px] mt-3">반복</Text>
          <View className="flex-row flex-wrap gap-2 mt-1">
            {REPEAT_OPTIONS.map(({ label, value }) => (
              <Pressable
                key={value}
                onPress={() => {
                  onRepeatTypeChange(value);
                  if (value === "none") onRepeatUntilChange(null);
                }}
                className={`rounded-[20px] px-3 py-1.5 ${repeatType === value ? "bg-app-teal" : "bg-app-surface"}`}
              >
                <Text
                  className={`text-[13px] ${repeatType === value ? "text-[#111] font-semibold" : "text-app-label"}`}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {repeatType !== "none" && (
            <View className="mt-1">
              <Text className="text-app-label text-[13px] mb-2">반복 종료일</Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => onRepeatUntilChange(null)}
                  className={`rounded-[20px] px-3 py-1.5 ${!repeatUntil ? "bg-app-teal" : "bg-app-surface"}`}
                >
                  <Text
                    className={`text-[13px] ${!repeatUntil ? "text-[#111] font-semibold" : "text-app-label"}`}
                  >
                    영구
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (!repeatUntil) {
                      const d = new Date(logDate);
                      d.setMonth(d.getMonth() + 3);
                      onRepeatUntilChange(d);
                    }
                    setShowRepeatUntilPicker(true);
                  }}
                  className={`flex-1 rounded-[20px] px-3 py-1.5 ${repeatUntil ? "bg-app-teal" : "bg-app-surface"}`}
                >
                  <Text
                    className={`text-[13px] ${repeatUntil ? "text-[#111] font-semibold" : "text-app-label"}`}
                  >
                    {repeatUntil ? formatLogDate(repeatUntil) : "종료일 지정"}
                  </Text>
                </Pressable>
              </View>
              <DatePickerModal
                visible={showRepeatUntilPicker}
                value={repeatUntil ?? logDate}
                onChange={onRepeatUntilChange}
                onClose={() => setShowRepeatUntilPicker(false)}
              />
            </View>
          )}
        </>
      )}

      <Text className="text-app-label text-[13px] mt-3">그룹</Text>
      <View className="flex-row flex-wrap gap-2 mt-1">
        {allGroups.map((g) => (
          <Pressable
            key={g.id}
            onPress={() => onGroupIdChange(g.id)}
            className={`rounded-[20px] px-3 py-1.5 ${groupId === g.id ? "bg-app-teal" : "bg-app-surface"}`}
          >
            <Text
              className={`text-[13px] ${groupId === g.id ? "text-[#111] font-semibold" : "text-app-label"}`}
            >
              {g.emoji} {g.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-app-label text-[13px] mt-3">관련 인물</Text>
      <View className="flex-row flex-wrap gap-2 mt-1">
        {allPersons.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => onTogglePerson(p.id)}
            className={`rounded-[20px] px-3 py-1.5 ${selectedPersonIds.includes(p.id) ? "bg-app-teal" : "bg-app-surface"}`}
          >
            <Text
              className={`text-[13px] ${selectedPersonIds.includes(p.id) ? "text-[#111] font-semibold" : "text-app-label"}`}
            >
              {p.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}
