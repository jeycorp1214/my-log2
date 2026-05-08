// 인물 추가 모달 화면
import dayjs from "dayjs";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
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
import { groups, persons } from "@/db/schema";
import { MBTI_OPTIONS } from "@/db/seed";

export default function PersonNewScreen() {
  const router = useRouter();
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [mbti, setMbti] = useState("");
  const [memo, setMemo] = useState("");
  const [groupId, setGroupId] = useState("");

  // 그룹 목록 로드 시 첫 번째 그룹 자동 선택
  useEffect(() => {
    if (!groupId && allGroups.length > 0) {
      setGroupId(allGroups[0].id);
    }
  }, [allGroups, groupId]);

  async function save() {
    if (!name.trim()) {
      Alert.alert("이름을 입력해 주세요.");
      return;
    }

    await db.insert(persons).values({
      name: name.trim(),
      birthDate: birthDate ? dayjs(birthDate).format("YYYY-MM-DD") : undefined,
      mbti: mbti || undefined,
      memo: memo.trim() || undefined,
      groupId,
    });
    router.back();
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
        <Text className="text-app-label text-[13px] mt-3">이름 *</Text>
        <TextInput
          className="bg-app-surface text-white rounded-[10px] p-3 text-[15px]"
          value={name}
          onChangeText={setName}
          placeholder="이름 입력"
          placeholderTextColor="#555"
        />

        <Text className="text-app-label text-[13px] mt-3">생년월일</Text>
        <Pressable
          onPress={() => setShowBirthDatePicker(true)}
          className="bg-app-surface rounded-[10px] p-3 flex-row items-center justify-between"
        >
          <Text
            className={
              birthDate ? "text-white text-[15px]" : "text-[#555] text-[15px]"
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
          placeholder="메모"
          placeholderTextColor="#555"
          multiline
          numberOfLines={3}
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
        <Pressable onPress={() => router.back()} className="items-center py-3">
          <Text className="text-app-muted text-[14px]">취소</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
