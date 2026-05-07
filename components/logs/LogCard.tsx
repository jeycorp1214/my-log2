// 로그 카드 컴포넌트 — 제목, 메모 미리보기, 반복 배지
import { View, Text, Pressable, StyleSheet } from "react-native";
import { RotateCw } from "lucide-react-native";
import type { InferSelectModel } from "drizzle-orm";
import type { logs } from "@/db/schema";

type Log = InferSelectModel<typeof logs>;

interface Props {
  log: Log;
  onPress: () => void;
}

export function LogCard({ log, onPress }: Props) {
  const hasRepeat = log.repeatType && log.repeatType !== "none";

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{log.title}</Text>
          {hasRepeat && (
            <View style={styles.repeatBadge}>
              <RotateCw size={10} color="#4ECDC4" />
            </View>
          )}
        </View>
        {log.memo ? (
          <Text style={styles.memo} numberOfLines={2}>{log.memo}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1e1e1e", borderRadius: 14, padding: 14 },
  pressed: { opacity: 0.7 },
  content: { gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "600" },
  repeatBadge: { backgroundColor: "#1a3a3a", borderRadius: 10, padding: 4 },
  memo: { color: "#888", fontSize: 13, lineHeight: 18 },
});
