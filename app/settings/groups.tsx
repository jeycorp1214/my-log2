// 그룹 관리 화면 — 그룹 목록 조회/삭제 + 퀵 추가
import { QuickInputBar } from "@/components/calendar/QuickInputBar";
import { db } from "@/db/client";
import { groups } from "@/db/schema";
import { PRESET_COLORS } from "@/db/seed";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Keyboard, Platform, Pressable, ScrollView, Text, View } from "react-native";

export default function GroupsScreen() {
  const router = useRouter();
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));
  const [quickName, setQuickName] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
      router.push("/groups/new");
      return;
    }
    await db.insert(groups).values({
      name,
      color: PRESET_COLORS[0],
      isDefault: false,
    });
    setQuickName("");
    Keyboard.dismiss();
  }

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

  const inputBarBottom = keyboardHeight > 0 ? keyboardHeight + 8 : 24;

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

      <QuickInputBar
        placeholder="그룹 이름으로 추가"
        value={quickName}
        onChange={setQuickName}
        onSubmit={handleQuickAdd}
        bottom={inputBarBottom}
      />
    </View>
  );
}
