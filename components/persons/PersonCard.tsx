// 인물 카드 컴포넌트 — 이름, 나이, 그룹 색상
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { InferSelectModel } from "drizzle-orm";
import type { persons } from "@/db/schema";
import { calcAge } from "@/utils/date";

type Person = InferSelectModel<typeof persons>;

interface Props {
  person: Person;
  groupColor: string;
  onPress: () => void;
}

export function PersonCard({ person, groupColor, onPress }: Props) {
  const age = person.birthDate ? calcAge(person.birthDate) : null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.colorBar, { backgroundColor: groupColor }]} />
      <View style={styles.content}>
        <Text style={styles.name}>{person.name}</Text>
        <View style={styles.meta}>
          {age !== null && <Text style={styles.metaText}>{age}세</Text>}
          {person.mbti && <Text style={styles.metaText}>{person.mbti}</Text>}
        </View>
        {person.memo ? (
          <Text style={styles.memo} numberOfLines={1}>{person.memo}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", backgroundColor: "#1e1e1e", borderRadius: 14, overflow: "hidden", marginBottom: 8 },
  pressed: { opacity: 0.7 },
  colorBar: { width: 4 },
  content: { flex: 1, padding: 14, gap: 4 },
  name: { color: "#fff", fontSize: 16, fontWeight: "600" },
  meta: { flexDirection: "row", gap: 8 },
  metaText: { color: "#888", fontSize: 13 },
  memo: { color: "#666", fontSize: 13 },
});
