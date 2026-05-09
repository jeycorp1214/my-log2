// 인물 상세 / 수정 / 삭제 모달 화면
import {
  DraftAnniversary,
  PersonForm,
} from "@/components/persons/PersonForm";
import { db } from "@/db/client";
import {
  groups,
  logPersons,
  logs,
  personAnniversaries,
  persons,
} from "@/db/schema";
import { calcAge, dDayLabel, formatLogDate, fromNow } from "@/utils/date";
import dayjs from "dayjs";
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
  View,
} from "react-native";

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
            <PersonForm
              name={name}
              onNameChange={setName}
              birthDate={birthDate}
              onBirthDateChange={setBirthDate}
              mbti={mbti}
              onMbtiChange={setMbti}
              memo={memo}
              onMemoChange={setMemo}
              groupId={groupId}
              onGroupIdChange={setGroupId}
              allGroups={allGroups}
              draftAnniversaries={draftAnniversaries}
              onAnniversariesChange={setDraftAnniversaries}
            />
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
