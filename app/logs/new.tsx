// 로그 추가 모달 화면
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { DatePickerModal } from "@/components/DatePickerModal";
import { db } from "@/db/client";
import { groups, logPersons, logs, persons } from "@/db/schema";
import { REPEAT_OPTIONS } from "@/db/seed";
import { formatLogDate } from "@/utils/date";

export default function LogNewScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();

  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));
  const { data: allPersons = [] } = useLiveQuery(db.select().from(persons));

  const initialDate = date ? new Date(date) : new Date();

  const [title, setTitle] = useState("");
  const [logDate, setLogDate] = useState(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [memo, setMemo] = useState("");
  const [repeatType, setRepeatType] = useState("none");
  const [repeatUntil, setRepeatUntil] = useState<Date | null>(null);
  const [showRepeatUntilPicker, setShowRepeatUntilPicker] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);

  useEffect(() => {
    if (!groupId && allGroups.length > 0) {
      setGroupId(allGroups[0].id);
    }
  }, [allGroups, groupId]);

  function togglePerson(pid: string) {
    setSelectedPersonIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid],
    );
  }

  async function save() {
    if (!title.trim()) {
      Alert.alert("제목을 입력해 주세요.");
      return;
    }
    if (!groupId) return;

    const [inserted] = await db
      .insert(logs)
      .values({
        title: title.trim(),
        logDate,
        memo: memo.trim() || undefined,
        repeatType: repeatType !== "none" ? repeatType : undefined,
        repeatUntil:
          repeatType !== "none" ? (repeatUntil ?? undefined) : undefined,
        groupId,
      })
      .returning({ id: logs.id });

    if (selectedPersonIds.length > 0) {
      await db.insert(logPersons).values(
        selectedPersonIds.map((personId) => ({
          logId: inserted.id,
          personId,
        })),
      );
    }

    router.navigate({
      pathname: "/(tabs)",
      params: { savedDate: logDate.toISOString() },
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-app-label text-[13px] mt-3">날짜</Text>
        <Pressable
          onPress={() => setShowDatePicker(true)}
          className="bg-app-surface rounded-[10px] p-3 flex-row items-center justify-between"
        >
          <Text className="text-white text-[15px]">
            {formatLogDate(logDate)}
          </Text>
          <Text className="text-app-muted text-[13px]">변경</Text>
        </Pressable>
        <DatePickerModal
          visible={showDatePicker}
          value={logDate}
          onChange={setLogDate}
          onClose={() => setShowDatePicker(false)}
        />

        <Text className="text-app-label text-[13px] mt-3">제목 *</Text>
        <TextInput
          className="bg-app-surface text-white rounded-[10px] p-3 text-[15px]"
          value={title}
          onChangeText={setTitle}
          placeholder="기록 제목"
          placeholderTextColor="#555"
        />

        <Text className="text-app-label text-[13px] mt-3">메모</Text>
        <TextInput
          className="bg-app-surface text-white rounded-[10px] p-3 text-[15px]"
          value={memo}
          onChangeText={setMemo}
          placeholder="메모"
          placeholderTextColor="#555"
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />

        <Text className="text-app-label text-[13px] mt-3">반복</Text>
        <View className="flex-row flex-wrap gap-2 mt-1">
          {REPEAT_OPTIONS.map(({ label, value }) => (
            <Pressable
              key={value}
              onPress={() => {
                setRepeatType(value);
                if (value === "none") setRepeatUntil(null);
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
                onPress={() => setRepeatUntil(null)}
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
                    setRepeatUntil(d);
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
              onChange={setRepeatUntil}
              onClose={() => setShowRepeatUntilPicker(false)}
            />
          </View>
        )}

        <Text className="text-app-label text-[13px] mt-3">그룹</Text>
        <View className="flex-row flex-wrap gap-2 mt-1">
          {allGroups.map((g) => (
            <Pressable
              key={g.id}
              onPress={() => setGroupId(g.id)}
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
              onPress={() => togglePerson(p.id)}
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

        <Pressable
          onPress={save}
          className="bg-app-teal rounded-[12px] p-4 items-center mt-6"
        >
          <Text className="text-[#111] text-base font-bold">저장</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="items-center py-3">
          <Text className="text-app-muted text-[14px]">취소</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
