// 로그 상세 / 수정 / 삭제 모달 화면
import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { db } from "@/db/client";
import { logs, logPersons, groups, persons } from "@/db/schema";
import { formatLogDate } from "@/utils/date";

const REPEAT_OPTIONS = [
  { label: "없음", value: "none" },
  { label: "매일", value: "daily" },
  { label: "매주", value: "weekly" },
  { label: "매월", value: "monthly" },
  { label: "매년", value: "yearly" },
];

export default function LogDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: logList = [] } = useLiveQuery(db.select().from(logs).where(eq(logs.id, id)));
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

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [repeatType, setRepeatType] = useState("none");
  const [groupId, setGroupId] = useState("");
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);

  useEffect(() => {
    if (log) {
      setTitle(log.title);
      setMemo(log.memo ?? "");
      setRepeatType(log.repeatType ?? "none");
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

  async function save() {
    if (!title.trim()) { Alert.alert("제목을 입력해 주세요."); return; }
    await db.update(logs).set({
      title: title.trim(),
      memo: memo.trim() || null,
      repeatType: repeatType !== "none" ? repeatType : null,
      groupId,
      updatedAt: new Date(),
    }).where(eq(logs.id, id));

    await db.delete(logPersons).where(eq(logPersons.logId, id));
    if (selectedPersonIds.length > 0) {
      await db.insert(logPersons).values(
        selectedPersonIds.map((personId) => ({ logId: id, personId })),
      );
    }
    setEditing(false);
  }

  async function deleteLog() {
    Alert.alert("기록 삭제", "이 기록을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제", style: "destructive",
        onPress: async () => {
          await db.delete(logs).where(eq(logs.id, id));
          router.back();
        },
      },
    ]);
  }

  if (!log) return null;

  return (
    <ScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 40 }}>
      {editing ? (
        <>
          <TextInput className="bg-app-surface text-white rounded-[10px] p-3 text-[15px]" value={title} onChangeText={setTitle} placeholderTextColor="#555" />
          <Text className="text-app-label text-[13px] mt-3">메모</Text>
          <TextInput
            className="bg-app-surface text-white rounded-[10px] p-3 text-[15px]"
            value={memo}
            onChangeText={setMemo}
            multiline
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />
          <Text className="text-app-label text-[13px] mt-3">반복</Text>
          <View className="flex-row flex-wrap gap-2 mt-1">
            {REPEAT_OPTIONS.map(({ label, value }) => (
              <Pressable key={value} onPress={() => setRepeatType(value)} className={`rounded-[20px] px-3 py-1.5 ${repeatType === value ? 'bg-app-teal' : 'bg-app-surface'}`}>
                <Text className={`text-[13px] ${repeatType === value ? 'text-[#111] font-semibold' : 'text-app-label'}`}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Text className="text-app-label text-[13px] mt-3">그룹</Text>
          <View className="flex-row flex-wrap gap-2 mt-1">
            {allGroups.map((g) => (
              <Pressable key={g.id} onPress={() => setGroupId(g.id)} className={`rounded-[20px] px-3 py-1.5 ${groupId === g.id ? 'bg-app-teal' : 'bg-app-surface'}`}>
                <Text className={`text-[13px] ${groupId === g.id ? 'text-[#111] font-semibold' : 'text-app-label'}`}>{g.emoji} {g.name}</Text>
              </Pressable>
            ))}
          </View>
          <Text className="text-app-label text-[13px] mt-3">관련 인물</Text>
          <View className="flex-row flex-wrap gap-2 mt-1">
            {allPersons.map((p) => (
              <Pressable key={p.id} onPress={() => togglePerson(p.id)} className={`rounded-[20px] px-3 py-1.5 ${selectedPersonIds.includes(p.id) ? 'bg-app-teal' : 'bg-app-surface'}`}>
                <Text className={`text-[13px] ${selectedPersonIds.includes(p.id) ? 'text-[#111] font-semibold' : 'text-app-label'}`}>{p.name}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={save} className="bg-app-teal rounded-[12px] p-4 items-center mt-6">
            <Text className="text-[#111] text-base font-bold">저장</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View className="flex-row items-start justify-between">
            <Text className="flex-1 text-white text-[22px] font-bold mr-3">{log.title}</Text>
            <Pressable onPress={() => setEditing(true)} className="bg-app-surface rounded-lg px-3 py-1.5">
              <Text className="text-app-teal text-[14px]">수정</Text>
            </Pressable>
          </View>
          <Text className="text-app-muted text-[13px]">{formatLogDate(new Date(log.logDate))}</Text>
          {log.memo ? <Text className="text-app-label text-[15px] leading-[22px] mt-2">{log.memo}</Text> : null}

          {linkedPersons.length > 0 && (
            <>
              <Text className="text-app-label text-[13px] font-semibold mt-5 uppercase tracking-[0.5px]">함께한 인물</Text>
              <View className="flex-row flex-wrap gap-2 mt-1">
                {linkedPersons.map(({ person }) => (
                  <Pressable
                    key={person.id}
                    onPress={() => router.push({ pathname: "/persons/[id]", params: { id: person.id } })}
                    className="bg-app-surface rounded-[20px] px-3 py-1.5"
                  >
                    <Text className="text-app-label text-[13px]">{person.name}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Pressable onPress={deleteLog} className="mt-8 bg-app-danger-bg rounded-[12px] p-[14px] items-center">
            <Text className="text-app-danger text-[15px]">기록 삭제</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
