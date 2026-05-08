// 인물 상세 / 수정 / 삭제 모달 화면
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
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
import { MBTI_OPTIONS } from "@/db/seed";
import { calcAge, formatLogDate, fromNow } from "@/utils/date";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

export default function PersonDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: personList = [] } = useLiveQuery(
    db.select().from(persons).where(eq(persons.id, id)),
  );
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));

  const person = personList[0];

  const { data: personLogs = [] } = useLiveQuery(
    db
      .select({ log: logs })
      .from(logPersons)
      .innerJoin(logs, eq(logPersons.logId, logs.id))
      .where(eq(logPersons.personId, id)),
  );

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [mbti, setMbti] = useState("");
  const [memo, setMemo] = useState("");
  const [groupId, setGroupId] = useState("");

  useEffect(() => {
    if (person) {
      setName(person.name);
      setBirthDate(person.birthDate ? new Date(person.birthDate) : null);
      setMbti(person.mbti ?? "");
      setMemo(person.memo ?? "");
      setGroupId(person.groupId);
    }
  }, [person]);

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
            <Text className="text-app-label text-[13px] mt-3">생년월일</Text>
            <Pressable
              onPress={() => setShowBirthDatePicker(true)}
              className="bg-app-surface rounded-[10px] p-3 flex-row items-center justify-between"
            >
              <Text
                className={
                  birthDate
                    ? "text-white text-[15px]"
                    : "text-[#555] text-[15px]"
                }
              >
                {birthDate
                  ? dayjs(birthDate).format("YYYY년 M월 D일")
                  : "생년월일 선택"}
              </Text>
              <Text className="text-app-muted text-[13px]">변경</Text>
            </Pressable>
            <DatePickerModal
              visible={showBirthDatePicker}
              value={birthDate ?? new Date()}
              onChange={setBirthDate}
              onClose={() => setShowBirthDatePicker(false)}
            />
            <Text className="text-app-label text-[13px] mt-3">MBTI</Text>
            <View className="flex-row flex-wrap gap-2 mt-1">
              {MBTI_OPTIONS.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMbti(mbti === m ? "" : m)}
                  className={`rounded-[20px] px-3 py-1.5 ${mbti === m ? "bg-app-teal" : "bg-app-surface"}`}
                >
                  <Text
                    className={`text-[13px] ${mbti === m ? "text-[#111] font-semibold" : "text-app-label"}`}
                  >
                    {m}
                  </Text>
                </Pressable>
              ))}
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
                onPress={() => setEditing(true)}
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
