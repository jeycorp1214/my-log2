// 인물 목록 탭 — 그룹별 섹션 + 인물 카드
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

import { PersonCard } from "@/components/persons/PersonCard";
import { db } from "@/db/client";
import { groups, persons } from "@/db/schema";

export default function PersonsScreen() {
  const router = useRouter();

  const { data: allPersons = [] } = useLiveQuery(db.select().from(persons));
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));

  const groupedPersons = allGroups
    .map((group) => ({
      group,
      members: allPersons.filter((p) => p.groupId === group.id),
    }))
    .filter((section) => section.members.length > 0);

  const ungrouped = allPersons.filter((p) => !p.groupId);

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

      {/* FAB — 인물 추가 */}
      <Pressable
        onPress={() => router.push("/persons/new")}
        className="absolute right-5 bottom-8 w-14 h-14 rounded-full bg-app-teal items-center justify-center shadow-lg"
        style={{ elevation: 6 }}
      >
        <Plus size={24} color="#111" />
      </Pressable>
    </View>
  );
}
