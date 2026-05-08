// 로그 상세 / 수정 / 삭제 모달 화면
import { eq } from "drizzle-orm";
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
import { formatLogDate, isSameDay } from "@/utils/date";

type EditingMode = "none" | "edit" | "copy";

export default function LogDetailScreen() {
  const router = useRouter();
  const { id, occurrenceDate } = useLocalSearchParams<{
    id: string;
    occurrenceDate?: string;
  }>();

  const { data: logList = [] } = useLiveQuery(
    db.select().from(logs).where(eq(logs.id, id)),
  );
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));
  const { data: allPersons = [] } = useLiveQuery(db.select().from(persons));
  const { data: linkedPersons = [] } = useLiveQuery(
    db
      .select({ person: persons })
      .from(logPersons)
      .innerJoin(persons, eq(logPersons.personId, persons.id))
      .where(eq(logPersons.logId, id)),
  );

  const log = logList[0];
  const occurrenceDateObj = occurrenceDate ? new Date(occurrenceDate) : null;
  const isOccurrenceView =
    occurrenceDateObj !== null && log
      ? !isSameDay(occurrenceDateObj, new Date(log.logDate))
      : false;

  const [editingMode, setEditingMode] = useState<EditingMode>("none");
  const [title, setTitle] = useState("");
  const [logDate, setLogDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [memo, setMemo] = useState("");
  const [repeatType, setRepeatType] = useState("none");
  const [repeatUntil, setRepeatUntil] = useState<Date | null>(null);
  const [showRepeatUntilPicker, setShowRepeatUntilPicker] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);

  useEffect(() => {
    if (log) {
      setTitle(log.title);
      setLogDate(new Date(log.logDate));
      setMemo(log.memo ?? "");
      setRepeatType(log.repeatType ?? "none");
      setRepeatUntil(log.repeatUntil ? new Date(log.repeatUntil) : null);
      setGroupId(log.groupId);
    }
  }, [log]);

  useEffect(() => {
    setSelectedPersonIds(linkedPersons.map((lp) => lp.person.id));
  }, [linkedPersons]);

  function togglePerson(pid: string) {
    setSelectedPersonIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid],
    );
  }

  function handleEditPress() {
    if (isOccurrenceView && log?.repeatType && log.repeatType !== "none") {
      Alert.alert("수정 방식", "", [
        {
          text: "이 날만 별도 기록",
          onPress: () => {
            setLogDate(occurrenceDateObj!);
            setRepeatType("none");
            setRepeatUntil(null);
            setEditingMode("copy");
          },
        },
        { text: "반복 전체 수정", onPress: () => setEditingMode("edit") },
        { text: "취소", style: "cancel" },
      ]);
    } else {
      setEditingMode("edit");
    }
  }

  async function save() {
    if (!title.trim()) {
      Alert.alert("제목을 입력해 주세요.");
      return;
    }

    if (editingMode === "copy") {
      const [newLog] = await db
        .insert(logs)
        .values({
          title: title.trim(),
          logDate,
          memo: memo.trim() || undefined,
          repeatType: undefined,
          repeatUntil: undefined,
          groupId,
        })
        .returning({ id: logs.id });

      if (selectedPersonIds.length > 0) {
        await db.insert(logPersons).values(
          selectedPersonIds.map((personId) => ({
            logId: newLog.id,
            personId,
          })),
        );
      }
      router.back();
    } else {
      await db
        .update(logs)
        .set({
          title: title.trim(),
          logDate,
          memo: memo.trim() || null,
          repeatType: repeatType !== "none" ? repeatType : null,
          repeatUntil: repeatType !== "none" ? repeatUntil : null,
          groupId,
          updatedAt: new Date(),
        })
        .where(eq(logs.id, id));

      await db.delete(logPersons).where(eq(logPersons.logId, id));
      if (selectedPersonIds.length > 0) {
        await db
          .insert(logPersons)
          .values(
            selectedPersonIds.map((personId) => ({ logId: id, personId })),
          );
      }
      setEditingMode("none");
    }
  }

  async function deleteLog() {
    Alert.alert("기록 삭제", "이 기록을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await db.delete(logs).where(eq(logs.id, id));
          router.back();
        },
      },
    ]);
  }

  if (!log) return null;

  const isEditing = editingMode !== "none";
  const isCopyMode = editingMode === "copy";
  const displayDate =
    isOccurrenceView && !isEditing ? occurrenceDateObj! : new Date(log.logDate);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 40 }}
      >
        {isEditing ? (
          <>
            {isCopyMode && (
              <View className="bg-app-teal-dark rounded-[10px] px-3 py-2 mb-1">
                <Text className="text-app-teal text-[13px]">
                  이 날짜만 별도 기록으로 저장됩니다
                </Text>
              </View>
            )}

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
              placeholderTextColor="#555"
            />
            <Text className="text-app-label text-[13px] mt-3">메모</Text>
            <TextInput
              className="bg-app-surface text-white rounded-[10px] p-3 text-[15px]"
              value={memo}
              onChangeText={setMemo}
              multiline
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />

            {!isCopyMode && (
              <>
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
                    <Text className="text-app-label text-[13px] mb-2">
                      반복 종료일
                    </Text>
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
                          {repeatUntil
                            ? formatLogDate(repeatUntil)
                            : "종료일 지정"}
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
              </>
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
              <Text className="text-[#111] text-base font-bold">
                {isCopyMode ? "이 날 기록으로 저장" : "저장"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setEditingMode("none")}
              className="items-center py-3"
            >
              <Text className="text-app-muted text-[14px]">취소</Text>
            </Pressable>
          </>
        ) : (
          <>
            {isOccurrenceView && (
              <View className="bg-app-teal-dark rounded-[10px] px-3 py-2 mb-1">
                <Text className="text-app-teal text-[13px]">
                  🔄 반복 기록 — {formatLogDate(occurrenceDateObj!)}
                </Text>
              </View>
            )}

            <View className="flex-row items-start justify-between">
              <Text className="flex-1 text-white text-[22px] font-bold mr-3">
                {log.title}
              </Text>
              <Pressable
                onPress={handleEditPress}
                className="bg-app-surface rounded-lg px-3 py-1.5"
              >
                <Text className="text-app-teal text-[14px]">수정</Text>
              </Pressable>
            </View>
            <Text className="text-app-muted text-[13px]">
              {formatLogDate(displayDate)}
            </Text>
            {log.memo ? (
              <Text className="text-app-label text-[15px] leading-[22px] mt-2">
                {log.memo}
              </Text>
            ) : null}

            {linkedPersons.length > 0 && (
              <>
                <Text className="text-app-label text-[13px] font-semibold mt-5 uppercase tracking-[0.5px]">
                  함께한 인물
                </Text>
                <View className="flex-row flex-wrap gap-2 mt-1">
                  {linkedPersons.map(({ person }) => (
                    <Pressable
                      key={person.id}
                      onPress={() =>
                        router.push({
                          pathname: "/persons/[id]",
                          params: { id: person.id },
                        })
                      }
                      className="bg-app-surface rounded-[20px] px-3 py-1.5"
                    >
                      <Text className="text-app-label text-[13px]">
                        {person.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Pressable
              onPress={deleteLog}
              className="mt-8 bg-app-danger-bg rounded-[12px] p-[14px] items-center"
            >
              <Text className="text-app-danger text-[15px]">기록 삭제</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
