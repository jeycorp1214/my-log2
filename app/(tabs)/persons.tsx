// 인물 목록 탭 — 그룹별 섹션 + 인물 카드 + 퀵 추가
import { QuickInputBar } from "@/components/calendar/QuickInputBar";
import { PersonCard } from "@/components/persons/PersonCard";
import { db } from "@/db/client";
import { groups, persons } from "@/db/schema";
import { usePersonsWithGroups } from "@/hooks/persons/use-persons-with-groups";
import { useRouter } from "expo-router";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect, useState } from "react";
import { Keyboard, Platform, ScrollView, Text, View } from "react-native";

export default function PersonsScreen() {
  const router = useRouter();
  const { allPersons, groupedPersons, ungrouped } = usePersonsWithGroups();
  const [quickName, setQuickName] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const { data: allGroups = [] } = useLiveQuery(
    db.select().from(groups).orderBy(groups.sortOrder),
  );

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  async function handleQuickAdd() {
    const name = quickName.trim();
    if (name.length === 0) {
      router.push("/persons/new");
      return;
    }
    if (allGroups.length === 0) return;
    await db.insert(persons).values({
      name,
      groupId: allGroups[0].id,
    });
    setQuickName("");
    Keyboard.dismiss();
  }

  const inputBarBottom = keyboardHeight > 0 ? keyboardHeight + 8 : 24;

  return (
    <View className="flex-1 bg-app-bg">
      <View className="px-5 pt-14 pb-3">
        <Text className="text-white text-2xl font-bold">인물</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}>
        {allPersons.length === 0 ? (
          <Text className="text-app-muted text-center mt-12">인물을 추가해 보세요.</Text>
        ) : (
          <>
            {groupedPersons.map(({ group, members }) => (
              <View key={group.id} className="mb-6">
                <Text className="text-[#aaa] text-[13px] font-semibold uppercase tracking-[0.5px] mb-2">
                  {group.emoji} {group.name}
                </Text>
                {members.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    groupColor={group.color}
                    onPress={() =>
                      router.push({
                        pathname: "/persons/[id]",
                        params: { id: person.id },
                      })
                    }
                  />
                ))}
              </View>
            ))}

            {ungrouped.length > 0 && (
              <View className="mb-6">
                <Text className="text-[#aaa] text-[13px] font-semibold uppercase tracking-[0.5px] mb-2">분류 없음</Text>
                {ungrouped.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    groupColor="#555"
                    onPress={() =>
                      router.push({
                        pathname: "/persons/[id]",
                        params: { id: person.id },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <QuickInputBar
        placeholder="이름으로 인물 추가"
        value={quickName}
        onChange={setQuickName}
        onSubmit={handleQuickAdd}
        bottom={inputBarBottom}
      />
    </View>
  );
}
