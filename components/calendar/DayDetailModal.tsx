// 보드 모드 날짜 상세 모달 — 선택된 날짜의 전체 기록 목록
import { AnniversaryItem } from "@/components/persons/AnniversaryItem";
import { LogCard } from "@/components/logs/LogCard";
import { logs } from "@/db/schema";
import { formatLogDate } from "@/utils/date";
import type { InferSelectModel } from "drizzle-orm";
import { X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

type Log = InferSelectModel<typeof logs>;
export type LogItem = { log: Log; isOccurrence: boolean };

interface Props {
  visible: boolean;
  date: Date | null;
  items: LogItem[];
  anniversaries: { title: string; personId: string }[];
  onClose: () => void;
  onLogPress: (item: LogItem) => void;
  onPersonPress: (personId: string) => void;
}

export function DayDetailModal({
  visible,
  date,
  items,
  anniversaries,
  onClose,
  onLogPress,
  onPersonPress,
}: Props) {
  if (!date) return null;

  const isEmpty = items.length === 0 && anniversaries.length === 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable
          className="bg-app-surface rounded-t-[20px]"
          style={{ maxHeight: "70%" }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
            <Text className="text-app-dim text-[15px] font-semibold">
              {formatLogDate(date)}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color="#888" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}
          >
            {isEmpty ? (
              <Text className="text-app-muted text-center mt-4 mb-4">기록이 없습니다.</Text>
            ) : (
              <>
                {anniversaries.map((ann, i) => (
                  <AnniversaryItem
                    key={`ann-${i}`}
                    title={ann.title}
                    onPress={() => {
                      onPersonPress(ann.personId);
                      onClose();
                    }}
                  />
                ))}
                {items.map((item) => (
                  <LogCard
                    key={item.log.id}
                    log={item.log}
                    onPress={() => {
                      onLogPress(item);
                      onClose();
                    }}
                  />
                ))}
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
