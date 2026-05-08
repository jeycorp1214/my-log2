// 그룹 관리 화면 — 그룹 목록 조회/삭제 + FAB 추가
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { groups } from "@/db/schema";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";

export default function GroupsScreen() {
  const router = useRouter();
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));

  async function deleteGroup(id: string, isDefault: boolean) {
    if (isDefault) {
      Alert.alert("삭제 불가", "기본 그룹은 삭제할 수 없습니다.");
      return;
    }
    Alert.alert("그룹 삭제", "그룹을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await db.delete(groups).where(eq(groups.id, id));
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-app-bg">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 }}>
        <VStack space="sm">
          {allGroups.length === 0 ? (
            <Text className="text-app-muted text-center mt-8">그룹이 없습니다.</Text>
          ) : (
            allGroups.map((group) => (
              <HStack key={group.id} className="items-center bg-app-surface rounded-[12px] p-[14px]">
                <View
                  className="w-3 h-3 rounded-full mr-[10px]"
                  style={{ backgroundColor: group.color }}
                />
                <Text className="flex-1 text-white text-[15px]">
                  {group.emoji} {group.name}
                </Text>
                {!group.isDefault && (
                  <Pressable
                    onPress={() => deleteGroup(group.id, group.isDefault)}
                    className="p-1"
                  >
                    <Trash2 size={16} color="#ff6b6b" />
                  </Pressable>
                )}
              </HStack>
            ))
          )}
        </VStack>
      </ScrollView>

      <Pressable
        onPress={() => router.push("/groups/new")}
        className="absolute right-5 bottom-8 w-14 h-14 rounded-full bg-app-teal items-center justify-center"
        style={{ elevation: 6 }}
      >
        <Plus size={24} color="#111" />
      </Pressable>
    </View>
  );
}
