import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { router } from "expo-router";
import { Cake, Search, SlidersHorizontal } from "lucide-react-native";
import { View } from "react-native";

interface TabsHeaderProps {
  title: string;
  CustomRight?: React.ReactNode;
  cakeOnPress?: () => void;
  searchOnPress?: boolean;
  slidersOnPress?: () => void;
  cakeActive?: boolean;
  slidersActive?: boolean;
}

export default function TabsHeader({
  title,
  cakeOnPress,
  searchOnPress,
  slidersOnPress,
  CustomRight,
  cakeActive = false,
  slidersActive = false,
}: TabsHeaderProps) {
  return (
    <HStack className="flex-row items-center justify-between px-5 pt-14 pb-3">
      <Text className="text-white text-2xl font-bold">{title}</Text>

      <View className="flex-row items-center gap-2">
        {cakeOnPress && (
          <Pressable className="p-2" onPress={cakeOnPress}>
            <Cake size={22} color={cakeActive ? "#c084fc" : "#888"} />
          </Pressable>
        )}
        {searchOnPress && (
          <Pressable className="p-2" onPress={() => router.push("/search")}>
            <Search size={22} color="#888" />
          </Pressable>
        )}
        {slidersOnPress && (
          <Pressable className="p-2" onPress={slidersOnPress}>
            <SlidersHorizontal
              size={22}
              color={slidersActive ? "#4ecdc4" : "#888"}
            />
          </Pressable>
        )}
        {CustomRight}
      </View>
    </HStack>
  );
}
