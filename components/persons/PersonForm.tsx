// 프로필 폼 공유 컴포넌트 — 생성/편집에서 공통 사용
import { DateInput } from "@/components/DateInput";
import { BirthDateInput } from "@/components/persons/BirthDateInput";
import { MbtiPicker } from "@/components/persons/MbtiPicker";
import { db } from "@/db/client";
import { groups } from "@/db/schema";
import { ANNIVERSARY_PRESETS, PRESET_COLORS } from "@/db/seed";
import { cn } from "@/utils/utils";
import { Plus, X } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export type DraftAnniversary = {
  id: string;
  title: string;
  date: Date | null;
  isRepeat: boolean;
};

type Group = typeof groups.$inferSelect;

const CONTACT_PRESETS = [
  { label: "안함", value: null },
  { label: "7일", value: 7 },
  { label: "30일", value: 30 },
  { label: "90일", value: 90 },
] as const;

const TAG_PRESETS = [
  "연인",
  "가족",
  "직장동료",
  "오랜친구",
  "멘토",
  "온라인친구",
];

interface PersonFormProps {
  name: string;
  onNameChange: (v: string) => void;
  birthDate: Date | null;
  onBirthDateChange: (v: Date | null) => void;
  mbti: string;
  onMbtiChange: (v: string) => void;
  memo: string;
  onMemoChange: (v: string) => void;
  groupId: string;
  onGroupIdChange: (v: string) => void;
  allGroups: Group[];
  draftAnniversaries: DraftAnniversary[];
  onAnniversariesChange: (v: DraftAnniversary[]) => void;
  contactInterval: number | null;
  onContactIntervalChange: (v: number | null) => void;
  tags: string[];
  onTagsChange: (v: string[]) => void;
  metAt: Date | null;
  onMetAtChange: (v: Date | null) => void;
}

export function PersonForm({
  name,
  onNameChange,
  birthDate,
  onBirthDateChange,
  mbti,
  onMbtiChange,
  memo,
  onMemoChange,
  groupId,
  onGroupIdChange,
  allGroups,
  draftAnniversaries,
  onAnniversariesChange,
  contactInterval,
  onContactIntervalChange,
  tags,
  onTagsChange,
  metAt,
  onMetAtChange,
}: PersonFormProps) {
  // 그룹 직접 입력
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [groupInput, setGroupInput] = useState("");

  // 태그 직접 입력
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");
  const tagInputRef = useRef<TextInput>(null);

  // 연락 주기 직접 입력
  const [customIntervalMode, setCustomIntervalMode] = useState(false);
  const [customIntervalText, setCustomIntervalText] = useState("");

  const customTags = tags.filter((t) => !TAG_PRESETS.includes(t));

  function toggleTag(tag: string) {
    if (tags.includes(tag)) {
      onTagsChange(tags.filter((t) => t !== tag));
    } else {
      onTagsChange([...tags, tag]);
    }
  }

  async function submitGroupCreate() {
    const trimmed = groupInput.trim();
    if (trimmed) {
      const color = PRESET_COLORS[allGroups.length % PRESET_COLORS.length];
      const result = await db
        .insert(groups)
        .values({ name: trimmed, color })
        .returning({ id: groups.id });
      onGroupIdChange(result[0].id);
    }
    setGroupInput("");
    setIsAddingGroup(false);
  }

  function submitCustomTag() {
    const trimmed = customTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
    }
    setCustomTagInput("");
    setIsAddingTag(false);
  }

  function handlePresetIntervalSelect(value: number | null) {
    setCustomIntervalMode(false);
    setCustomIntervalText("");
    onContactIntervalChange(value);
  }

  function handleCustomIntervalChange(text: string) {
    setCustomIntervalText(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) {
      onContactIntervalChange(num);
    } else {
      onContactIntervalChange(null);
    }
  }

  function addAnniversary() {
    onAnniversariesChange([
      ...draftAnniversaries,
      { id: Math.random().toString(), title: "", date: null, isRepeat: false },
    ]);
  }

  function addPreset(title: string) {
    onAnniversariesChange([
      ...draftAnniversaries,
      { id: Math.random().toString(), title, date: null, isRepeat: true },
    ]);
  }

  function removeAnniversary(draftId: string) {
    onAnniversariesChange(draftAnniversaries.filter((a) => a.id !== draftId));
  }

  function updateAnniversary<K extends keyof Omit<DraftAnniversary, "id">>(
    draftId: string,
    field: K,
    value: DraftAnniversary[K],
  ) {
    onAnniversariesChange(
      draftAnniversaries.map((a) =>
        a.id === draftId ? { ...a, [field]: value } : a,
      ),
    );
  }

  return (
    <>
      <Text className="text-app-label text-[13px] mt-3">이름 *</Text>
      <TextInput
        className="bg-app-surface text-white rounded-[10px] p-3 text-sm"
        value={name}
        onChangeText={onNameChange}
        placeholder="이름 입력"
        placeholderTextColor="#555"
      />

      <View className="mt-3">
        <BirthDateInput value={birthDate} onChange={onBirthDateChange} />
      </View>

      <View className="mt-3">
        <MbtiPicker value={mbti} onChange={onMbtiChange} />
      </View>

      <Text className="text-app-label text-[13px] mt-3">메모</Text>
      <TextInput
        className="bg-app-surface text-white rounded-[10px] p-3 text-sm min-h-[80px]"
        value={memo}
        onChangeText={onMemoChange}
        placeholder="메모"
        placeholderTextColor="#555"
        multiline
        style={{ textAlignVertical: "top" }}
      />

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
        {isAddingGroup ? (
          <View className="flex-row items-center bg-app-surface rounded-[20px] px-3 py-1">
            <TextInput
              className="text-white text-[13px] min-w-[60px] max-w-[120px]"
              value={groupInput}
              onChangeText={setGroupInput}
              onSubmitEditing={submitGroupCreate}
              onBlur={submitGroupCreate}
              placeholder="그룹 이름"
              placeholderTextColor="#555"
              autoFocus
              returnKeyType="done"
            />
          </View>
        ) : (
          <Pressable
            onPress={() => setIsAddingGroup(true)}
            className="flex-row items-center gap-1 rounded-[20px] px-3 py-1.5 bg-app-surface"
          >
            <Plus size={12} color="#4ecdc4" />
            <Text className="text-app-teal text-[13px]">직접 입력</Text>
          </Pressable>
        )}
      </View>

      <Text className="text-app-label text-[13px] mt-4">연락 주기</Text>
      <View className="flex-row gap-2 mt-1 flex-wrap">
        {CONTACT_PRESETS.map((preset) => {
          const active = !customIntervalMode && contactInterval === preset.value;
          return (
            <Pressable
              key={preset.label}
              onPress={() => handlePresetIntervalSelect(preset.value)}
              className={`rounded-[20px] px-3 py-1.5 ${active ? "bg-app-teal" : "bg-app-surface"}`}
            >
              <Text
                className={`text-[13px] ${active ? "text-[#111] font-semibold" : "text-app-label"}`}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setCustomIntervalMode(true)}
          className={`flex-row items-center gap-1 rounded-[20px] px-3 py-1.5 ${customIntervalMode ? "bg-app-teal" : "bg-app-surface"}`}
        >
          {!customIntervalMode && <Plus size={12} color="#4ecdc4" />}
          <Text
            className={`text-[13px] ${customIntervalMode ? "text-[#111] font-semibold" : "text-app-teal"}`}
          >
            직접 입력
          </Text>
        </Pressable>
      </View>
      {customIntervalMode && (
        <View className="flex-row items-center gap-2 mt-2">
          <TextInput
            className="bg-app-surface text-white rounded-[10px] px-3 py-2 text-sm w-24"
            value={customIntervalText}
            onChangeText={handleCustomIntervalChange}
            placeholder="일 수"
            placeholderTextColor="#555"
            keyboardType="number-pad"
            autoFocus
          />
          <Text className="text-app-label text-[13px]">일</Text>
        </View>
      )}

      <Text className="text-app-label text-[13px] mt-4">관계 태그</Text>
      <View className="flex-row flex-wrap gap-2 mt-1">
        {TAG_PRESETS.map((tag) => {
          const active = tags.includes(tag);
          return (
            <Pressable
              key={tag}
              onPress={() => toggleTag(tag)}
              className={`rounded-[20px] px-3 py-1.5 ${active ? "bg-app-teal" : "bg-app-surface"}`}
            >
              <Text
                className={`text-[13px] ${active ? "text-[#111] font-semibold" : "text-app-label"}`}
              >
                {tag}
              </Text>
            </Pressable>
          );
        })}
        {customTags.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => toggleTag(tag)}
            className="flex-row items-center gap-1 rounded-[20px] px-3 py-1.5 bg-app-teal"
          >
            <Text className="text-[13px] text-[#111] font-semibold">{tag}</Text>
            <X size={11} color="#111" />
          </Pressable>
        ))}
        {isAddingTag ? (
          <View className="flex-row items-center bg-app-surface rounded-[20px] px-3 py-1">
            <TextInput
              ref={tagInputRef}
              className="text-white text-[13px] min-w-[60px] max-w-[120px]"
              value={customTagInput}
              onChangeText={setCustomTagInput}
              onSubmitEditing={submitCustomTag}
              onBlur={submitCustomTag}
              placeholder="태그 입력"
              placeholderTextColor="#555"
              autoFocus
              returnKeyType="done"
            />
          </View>
        ) : (
          <Pressable
            onPress={() => setIsAddingTag(true)}
            className="flex-row items-center gap-1 rounded-[20px] px-3 py-1.5 bg-app-surface"
          >
            <Plus size={12} color="#4ecdc4" />
            <Text className="text-app-teal text-[13px]">직접 입력</Text>
          </Pressable>
        )}
      </View>

      <Text className="text-app-label text-[13px] mt-4">첫 만남 날짜</Text>
      <View className="mt-1">
        <BirthDateInput value={metAt} onChange={onMetAtChange} />
      </View>

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
        <Pressable
          onPress={addAnniversary}
          className="flex-row items-center gap-1 rounded-[20px] px-3 py-1.5 bg-app-surface"
        >
          <Plus size={12} color="#4ecdc4" />
          <Text className="text-app-teal text-[13px]">직접 입력</Text>
        </Pressable>
      </View>

      {draftAnniversaries.map((ann) => (
        <View key={ann.id} className="bg-app-surface rounded-[10px] p-3 mt-1">
          <View className="flex-row items-center gap-2">
            <TextInput
              className="flex-1 text-white text-[14px]"
              value={ann.title}
              onChangeText={(v) => updateAnniversary(ann.id, "title", v)}
              placeholder="기념일 이름"
              placeholderTextColor="#555"
            />
            <Pressable onPress={() => removeAnniversary(ann.id)} hitSlop={8}>
              <X size={16} color="#555" />
            </Pressable>
          </View>
          <View className="flex-row items-center gap-2 mt-2">
            <DateInput
              variant="compact"
              value={ann.date}
              onChange={(date) => updateAnniversary(ann.id, "date", date)}
            />
            <Pressable
              onPress={() =>
                updateAnniversary(ann.id, "isRepeat", !ann.isRepeat)
              }
              className="flex-row items-center gap-1.5 bg-[#1a1a1a] rounded-[8px] px-2.5 py-1.5"
            >
              <View
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  ann.isRepeat ? "bg-[#4ecdc4]" : "bg-[#444]",
                )}
              />
              <Text className="text-[12px] text-app-muted">매년</Text>
            </Pressable>
          </View>
        </View>
      ))}

    </>
  );
}
