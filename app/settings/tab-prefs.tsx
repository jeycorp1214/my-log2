// 탭별 기본 설정 제어 화면 — 각 탭의 필터·뷰 설정을 저장
import { MbtiPicker } from "@/components/persons/MbtiPicker";
import { db } from "@/db/client";
import { groups } from "@/db/schema";
import { cn } from "@/utils/utils";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";

import {
  type CalendarPrefs,
  type ListPrefs,
  type MemoPrefs,
  type PersonsPrefs,
  useTabPreferences,
} from "@/providers/TabPreferencesProvider";

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mt-6 mb-3">
      {label}
    </Text>
  );
}

function RowLabel({ label }: { label: string }) {
  return <Text className="text-app-muted text-[12px] mb-2">{label}</Text>;
}

function Chips<T extends string>({
  options,
  current,
  onSelect,
}: {
  options: { value: T; label: string }[];
  current: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2 mb-4">
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onSelect(opt.value)}
          className={cn(
            "rounded-[10px] px-4 py-2 items-center",
            current === opt.value ? "bg-app-teal" : "bg-[#2a2a2a]",
          )}
        >
          <Text
            className={cn(
              "text-[13px] font-semibold",
              current === opt.value ? "text-[#111]" : "text-[#888]",
            )}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function SwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-white text-[14px]">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#333", true: "#1a3a2e" }}
        thumbColor={value ? "#4ecdc4" : "#666"}
      />
    </View>
  );
}

export default function TabPrefsScreen() {
  const {
    prefs,
    setCalendarPrefs,
    setListPrefs,
    setPersonsPrefs,
    setMemoPrefs,
  } = useTabPreferences();

  const { data: allGroups = [] } = useLiveQuery(
    db.select().from(groups).orderBy(groups.sortOrder),
  );

  const cal = prefs.calendar;
  const list = prefs.list;
  const persons = prefs.persons;
  const memo = prefs.memo;

  const groupChipsAll = [
    { value: "all", label: "전체" },
    ...allGroups.map((g) => ({ value: String(g.id), label: g.name })),
  ];

  return (
    <ScrollView
      className="flex-1 bg-app-bg"
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
    >
      {/* ── 캘린더 ─────────────────────────────────────── */}
      <SectionLabel label="캘린더" />
      <View className="bg-app-surface rounded-[12px] px-4 pt-4 pb-1">
        <RowLabel label="뷰모드" />
        <Chips<CalendarPrefs["viewMode"]>
          options={[
            { value: "compact", label: "일반" },
            { value: "board", label: "확장" },
          ]}
          current={cal.viewMode}
          onSelect={(v) => setCalendarPrefs({ viewMode: v })}
        />
        <SwitchRow
          label="기념일 표시"
          value={cal.showAnniversaries}
          onValueChange={(v) => setCalendarPrefs({ showAnniversaries: v })}
        />
      </View>

      {/* ── 리스트 ─────────────────────────────────────── */}
      <SectionLabel label="리스트" />
      <View className="bg-app-surface rounded-[12px] px-4 pt-4 pb-1">
        <RowLabel label="기본 기간" />
        <Chips<ListPrefs["preset"]>
          options={[
            { value: "this-week", label: "이번 주" },
            { value: "this-month", label: "이번 달" },
            { value: "recent-3m", label: "최근 3개월" },
          ]}
          current={list.preset}
          onSelect={(v) => setListPrefs({ preset: v })}
        />

        <RowLabel label="완료 상태" />
        <Chips<ListPrefs["completionFilter"]>
          options={[
            { value: "all", label: "전체" },
            { value: "undone", label: "미완료" },
            { value: "done", label: "완료" },
          ]}
          current={list.completionFilter}
          onSelect={(v) => setListPrefs({ completionFilter: v })}
        />

        <RowLabel label="관련 프로필" />
        <Chips<ListPrefs["personFilter"]>
          options={[
            { value: "all", label: "전체" },
            { value: "yes", label: "있음" },
            { value: "no", label: "없음" },
          ]}
          current={list.personFilter}
          onSelect={(v) => setListPrefs({ personFilter: v })}
        />

        <RowLabel label="정렬" />
        <Chips<ListPrefs["sortOrder"]>
          options={[
            { value: "oldest", label: "오래된순" },
            { value: "newest", label: "최신순" },
          ]}
          current={list.sortOrder}
          onSelect={(v) => setListPrefs({ sortOrder: v })}
        />

        <RowLabel label="그룹" />
        <View className="flex-row flex-wrap gap-2 mb-4">
          {groupChipsAll.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setListPrefs({ groupFilter: opt.value })}
              className={cn(
                "rounded-[10px] px-4 py-2 items-center",
                list.groupFilter === opt.value ? "bg-app-teal" : "bg-[#2a2a2a]",
              )}
            >
              <Text
                className={cn(
                  "text-[13px] font-semibold",
                  list.groupFilter === opt.value
                    ? "text-[#111]"
                    : "text-[#888]",
                )}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <SwitchRow
          label="기념일 표시"
          value={list.showAnniversaries}
          onValueChange={(v) => setListPrefs({ showAnniversaries: v })}
        />
      </View>

      {/* ── 프로필 ─────────────────────────────────────── */}
      <SectionLabel label="프로필" />
      <View className="bg-app-surface rounded-[12px] px-4 pt-4 pb-1">
        <RowLabel label="정렬" />
        <Chips<PersonsPrefs["sortOrder"]>
          options={[
            { value: "name-asc", label: "이름순" },
            { value: "age-asc", label: "나이순" },
          ]}
          current={persons.sortOrder}
          onSelect={(v) => setPersonsPrefs({ sortOrder: v })}
        />

        <RowLabel label="그룹" />
        <View className="flex-row flex-wrap gap-2 mb-4">
          {groupChipsAll.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setPersonsPrefs({ groupFilter: opt.value })}
              className={cn(
                "rounded-[10px] px-4 py-2 items-center",
                persons.groupFilter === opt.value
                  ? "bg-app-teal"
                  : "bg-[#2a2a2a]",
              )}
            >
              <Text
                className={cn(
                  "text-[13px] font-semibold",
                  persons.groupFilter === opt.value
                    ? "text-[#111]"
                    : "text-[#888]",
                )}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <RowLabel label="MBTI" />
        <Chips<PersonsPrefs["mbtiFilter"]>
          options={[
            { value: "all", label: "전체" },
            { value: "yes", label: "있음" },
            { value: "no", label: "없음" },
          ]}
          current={persons.mbtiFilter}
          onSelect={(v) => {
            setPersonsPrefs({ mbtiFilter: v });
            if (v !== "yes") setPersonsPrefs({ mbtiDetail: "" });
          }}
        />
        {persons.mbtiFilter === "yes" && (
          <View className="mb-4">
            <MbtiPicker
              value={persons.mbtiDetail}
              onChange={(v) => setPersonsPrefs({ mbtiDetail: v })}
            />
          </View>
        )}
      </View>

      {/* ── 메모 ─────────────────────────────────────── */}
      <SectionLabel label="메모" />
      <View className="bg-app-surface rounded-[12px] px-4 pt-4 pb-1">
        <RowLabel label="표시 상태" />
        <Chips<MemoPrefs["completionFilter"]>
          options={[
            { value: "all", label: "전체" },
            { value: "undone", label: "미완료" },
            { value: "done", label: "완료" },
          ]}
          current={memo.completionFilter}
          onSelect={(v) => setMemoPrefs({ completionFilter: v })}
        />

        <RowLabel label="정렬" />
        <Chips<MemoPrefs["sortOrder"]>
          options={[
            { value: "newest", label: "최신순" },
            { value: "oldest", label: "오래된순" },
          ]}
          current={memo.sortOrder}
          onSelect={(v) => setMemoPrefs({ sortOrder: v })}
        />
      </View>
    </ScrollView>
  );
}
