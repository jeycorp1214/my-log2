// 로그 추가 모달 화면
import { LogForm } from "@/components/logs/LogForm";
import { db } from "@/db/client";
import { groups, logPersons, logs, persons } from "@/db/schema";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

export default function LogNewScreen() {
  const router = useRouter();
  const { date, personId } = useLocalSearchParams<{
    date?: string;
    personId?: string;
  }>();

  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));
  const { data: allPersons = [] } = useLiveQuery(db.select().from(persons));

  const initialDate = date ? new Date(date) : new Date();
  const preselectedPersonId = personId ? Number(personId) : null;

  const [title, setTitle] = useState("");
  const [logDate, setLogDate] = useState(initialDate);
  const [memo, setMemo] = useState("");
  const [repeatType, setRepeatType] = useState("none");
  const [repeatUntil, setRepeatUntil] = useState<Date | null>(null);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [selectedPersonIds, setSelectedPersonIds] = useState<number[]>(
    preselectedPersonId ? [preselectedPersonId] : [],
  );

  useEffect(() => {
    if (!groupId && allGroups.length > 0) {
      setGroupId(allGroups[0].id);
    }
  }, [allGroups, groupId]);

  function togglePerson(pid: number) {
    setSelectedPersonIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid],
    );
  }

  async function save() {
    if (!title.trim()) {
      Alert.alert("제목을 입력해 주세요.");
      return;
    }
    if (groupId === null) return;

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
    <KeyboardAwareScrollView
      className="flex-1 bg-app-bg"
      contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <LogForm
        title={title}
        onTitleChange={setTitle}
        logDate={logDate}
        onLogDateChange={setLogDate}
        memo={memo}
        onMemoChange={setMemo}
        repeatType={repeatType}
        onRepeatTypeChange={setRepeatType}
        repeatUntil={repeatUntil}
        onRepeatUntilChange={setRepeatUntil}
        groupId={groupId}
        onGroupIdChange={setGroupId}
        allGroups={allGroups}
        allPersons={allPersons}
        selectedPersonIds={selectedPersonIds}
        onTogglePerson={togglePerson}
      />

      <Pressable
        onPress={save}
        className="bg-app-teal rounded-[12px] p-4 items-center mt-6"
      >
        <Text className="text-[#111] text-base font-bold">저장</Text>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}
