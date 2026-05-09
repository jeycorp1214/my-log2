// 인물 상세 / 수정 / 삭제 모달 화면
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus, X } from "lucide-react-native";
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
import { BirthDateInput } from "@/components/persons/BirthDateInput";
import { MbtiPicker } from "@/components/persons/MbtiPicker";
import { db } from "@/db/client";
import {
  groups,
  logPersons,
  logs,
  personAnniversaries,
  persons,
} from "@/db/schema";
import { ANNIVERSARY_PRESETS } from "@/db/seed";
import { calcAge, dDayLabel, formatLogDate, fromNow } from "@/utils/date";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

type DraftAnniversary = {
  id: string;
  title: string;
  date: Date | null;
  isRepeat: boolean;
};

export default function PersonDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: personList = [] } = useLiveQuery(
    db.select().from(persons).where(eq(persons.id, id)),
  );
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));
  const { data: dbAnniversaries = [] } = useLiveQuery(
    db
      .select()
      .from(personAnniversaries)
      .where(eq(personAnniversaries.personId, id)),
  );
  const { data: personLogs = [] } = useLiveQuery(
    db
      .select({ log: logs })
      .from(logPersons)
      .innerJoin(logs, eq(logPersons.logId, logs.id))
      .where(eq(logPersons.personId, id)),
  );

  const person = personList[0];

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [mbti, setMbti] = useState("");
  const [memo, setMemo] = useState("");
  const [groupId, setGroupId] = useState("");
  const [draftAnniversaries, setDraftAnniversaries] = useState<
    DraftAnniversary[]
  >([]);
  const [showPickerFor, setShowPickerFor] = useState<string | null>(null);

  useEffect(() => {
    if (person) {
      setName(person.name);
      setBirthDate(person.birthDate ? new Date(person.birthDate) : null);
      setMbti(person.mbti ?? "");
      setMemo(person.memo ?? "");
      setGroupId(person.groupId);
    }
  }, [person]);

  function startEditing() {
    if (!person) return;
    setName(person.name);
    setBirthDate(person.birthDate ? new Date(person.birthDate) : null);
    setMbti(person.mbti ?? "");
    setMemo(person.memo ?? "");
    setGroupId(person.groupId);
    setDraftAnniversaries(
      dbAnniversaries.map((a) => ({
        id: a.id,
        title: a.title,
        date: new Date(a.date),
        isRepeat: a.isRepeat,
      })),
    );
    setEditing(true);
  }

  function addAnniversary() {
    setDraftAnniversaries((prev) => [
      ...prev,
      { id: Math.random().toString(), title: "", date: null, isRepeat: false },
    ]);
  }

  function addPreset(title: string) {
    setDraftAnniversaries((prev) => [
      ...prev,
      { id: Math.random().toString(), title, date: null, isRepeat: true },
    ]);
  }

  function removeAnniversary(draftId: string) {
    setDraftAnniversaries((prev) => prev.filter((a) => a.id !== draftId));
  }

  function updateAnniversary<K extends keyof Omit<DraftAnniversary, "id">>(
    draftId: string,
    field: K,
    value: DraftAnniversary[K],
  ) {
    setDraftAnniversaries((prev) =>
      prev.map((a) => (a.id === draftId ? { ...a, [field]: value } : a)),
    );
  }

  async function save() {
    if (!name.trim()) {
      Alert.alert("이름을 입력해 주세요.");
      return;
    }
    await db
      .update(persons)
      .set({
        name: name.trim(),
        birthDate: birthDate ? dayjs(birthDate).format("YYYY-MM-DD") : null,
        mbti: mbti || null,
        memo: memo.trim() || null,
        groupId,
        updatedAt: new Date(),
      })
      .where(eq(persons.id, id));

    await db
      .delete(personAnniversaries)
      .where(eq(personAnniversaries.personId, id));

    for (const ann of draftAnniversaries) {
      if (!ann.title.trim() || !ann.date) continue;
      await db.insert(personAnniversaries).values({
        personId: id,
        title: ann.title.trim(),
        date: dayjs(ann.date).format("YYYY-MM-DD"),
        isRepeat: ann.isRepeat,
      });
    }

    setEditing(false);
  }

  async function deletePerson() {
    Alert.alert(
      "인물 삭제",
      `${person?.name}을(를) 삭제할까요? 관련 기록 연결도 삭제됩니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            await db.delete(persons).where(eq(persons.id, id));
            router.back();
          },
        },
      ],
    );
  }

  if (!person) return null;

  const age = person.birthDate ? calcAge(person.birthDate) : null;
  const lastLog = personLogs[0]?.log;

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
        {editing ? (
          <>
            <Text className="text-app-label text-[13px] mt-3">이름 *</Text>
            <TextInput
              className="bg-app-surface text-white rounded-[10px] p-3 text-[15px]"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#555"
            />

            <View className="mt-3">
              <BirthDateInput value={birthDate} onChange={setBirthDate} />
            </View>

            <View className="mt-3">
              <MbtiPicker value={mbti} onChange={setMbti} />
            </View>

            <Text className="text-app-label text-[13px] mt-3">메모</Text>
            <TextInput
              className="bg-app-surface text-white rounded-[10px] p-3 text-[15px]"
              value={memo}
              onChangeText={setMemo}
              multiline
              style={{ minHeight: 80, textAlignVertical: "top" }}
            />

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

            {/* 기념일 수정 */}
            <Text className="text-app-label text-[13px] mt-5">기념일</Text>
            <View className="flex-row flex-wrap gap-2 mt-1">
              {ANNIVERSARY_PRESETS.map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => addPreset(preset)}
                  className="bg-app-surface rounded-[20px] px-3 py-1.5"
                >
                  <Text className="text-app-label text-[13px]">{preset}</Text>
                </Pressable>
              ))}
            </View>

            {draftAnniversaries.map((ann) => (
              <View
                key={ann.id}
                className="bg-app-surface rounded-[10px] p-3 mt-1"
              >
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="flex-1 text-white text-[14px]"
                    value={ann.title}
                    onChangeText={(v) => updateAnniversary(ann.id, "title", v)}
                    placeholder="기념일 이름"
                    placeholderTextColor="#555"
                  />
                  <Pressable
                    onPress={() => removeAnniversary(ann.id)}
                    hitSlop={8}
                  >
                    <X size={16} color="#555" />
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-2 mt-2">
                  <Pressable
                    onPress={() => setShowPickerFor(ann.id)}
                    className="flex-1 bg-[#1a1a1a] rounded-[8px] px-2 py-1.5"
                  >
                    <Text
                      className="text-[13px]"
                      style={{ color: ann.date ? "#ccc" : "#555" }}
                    >
                      {ann.date
                        ? dayjs(ann.date).format("YYYY.MM.DD")
                        : "날짜 선택"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      updateAnniversary(ann.id, "isRepeat", !ann.isRepeat)
                    }
                    className="flex-row items-center gap-1.5 bg-[#1a1a1a] rounded-[8px] px-2.5 py-1.5"
                  >
                    <View
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: ann.isRepeat ? "#4ecdc4" : "#444",
                      }}
                    />
                    <Text className="text-[12px] text-app-muted">매년</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <Pressable
              onPress={addAnniversary}
              className="flex-row items-center gap-1.5 py-2"
            >
              <Plus size={14} color="#4ecdc4" />
              <Text className="text-app-teal text-[13px]">기념일 추가</Text>
            </Pressable>

            {showPickerFor && (
              <DatePickerModal
                visible
                value={
                  draftAnniversaries.find((a) => a.id === showPickerFor)
                    ?.date ?? new Date()
                }
                onChange={(date) => {
                  updateAnniversary(showPickerFor, "date", date);
                  setShowPickerFor(null);
                }}
                onClose={() => setShowPickerFor(null)}
              />
            )}

            <Pressable
              onPress={save}
              className="bg-app-teal rounded-[12px] p-4 items-center mt-6"
            >
              <Text className="text-[#111] text-base font-bold">저장</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white text-2xl font-bold">
                {person.name}
              </Text>
              <Pressable
                onPress={startEditing}
                className="bg-app-surface rounded-lg px-3 py-1.5"
              >
                <Text className="text-app-teal text-[14px]">수정</Text>
              </Pressable>
            </View>

            <View className="flex-row gap-2 mb-2">
              {age !== null && (
                <Text className="text-[#888] text-[14px]">{age}세</Text>
              )}
              {person.mbti && (
                <Text className="text-[#888] text-[14px]">{person.mbti}</Text>
              )}
            </View>

            {person.memo ? (
              <Text className="text-app-label text-[15px] leading-[22px]">
                {person.memo}
              </Text>
            ) : null}

            {lastLog && (
              <View className="bg-app-surface rounded-[12px] p-[14px] flex-row justify-between mt-3">
                <Text className="text-app-muted text-[13px]">마지막 기록</Text>
                <Text className="text-app-teal text-[13px]">
                  {fromNow(new Date(lastLog.logDate))}
                </Text>
              </View>
            )}

            {/* 기념일 */}
            {dbAnniversaries.length > 0 && (
              <>
                <Text className="text-app-label text-[13px] font-semibold mt-6 mb-2 uppercase tracking-[0.5px]">
                  기념일 ({dbAnniversaries.length})
                </Text>
                {dbAnniversaries.map((ann) => (
                  <View
                    key={ann.id}
                    className="bg-app-surface rounded-[10px] p-3 mb-1.5 flex-row items-center justify-between"
                  >
                    <View>
                      <Text className="text-white text-[14px]">
                        {ann.title}
                      </Text>
                      <Text className="text-app-muted text-[12px] mt-0.5">
                        {dayjs(ann.date).format("YYYY.MM.DD")}
                        {ann.isRepeat ? " · 매년" : ""}
                      </Text>
                    </View>
                    <Text className="text-app-teal text-[13px] font-semibold">
                      {dDayLabel(ann.date, ann.isRepeat)}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* 함께한 기록 */}
            <Text className="text-app-label text-[13px] font-semibold mt-6 mb-2 uppercase tracking-[0.5px]">
              함께한 기록 ({personLogs.length})
            </Text>
            {personLogs.map(({ log }) => (
              <Pressable
                key={log.id}
                onPress={() =>
                  router.push({
                    pathname: "/logs/[id]",
                    params: { id: log.id },
                  })
                }
                className="bg-app-surface rounded-[10px] p-3 mb-1.5"
              >
                <Text className="text-app-muted text-xs mb-[2px]">
                  {formatLogDate(new Date(log.logDate))}
                </Text>
                <Text className="text-white text-[14px]">{log.title}</Text>
              </Pressable>
            ))}

            <Pressable
              onPress={deletePerson}
              className="mt-8 bg-app-danger-bg rounded-[12px] p-[14px] items-center"
            >
              <Text className="text-app-danger text-[15px]">인물 삭제</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
