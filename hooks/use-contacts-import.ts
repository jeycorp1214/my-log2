// 기기 연락처를 읽어 persons/person_anniversaries에 일괄 적재하는 훅
import { db } from "@/db/client";
import { personAnniversaries, persons } from "@/db/schema";
import * as Contacts from "expo-contacts";
import { useCallback, useState } from "react";

export type ImportableContact = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  memo?: string;
  anniversaries: { title: string; date: string }[];
};

export type ImportResult = { added: number };

// expo-contacts month: 0-indexed (0 = 1월)
function toDateStr(d: Contacts.Date): string | null {
  const { day, month, year } = d;
  if (day == null || month == null) return null;
  const y = year ?? new Date().getFullYear();
  const m = month + 1;
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const LABEL_MAP: Record<string, string> = {
  anniversary: "기념일",
  birthday: "생일",
  other: "기타",
};

function mapLabel(label: string): string {
  return LABEL_MAP[label.toLowerCase()] ?? label;
}

export function parseContact(raw: Contacts.Contact): ImportableContact | null {
  const name = (
    raw.name ||
    [raw.firstName, raw.lastName].filter(Boolean).join(" ")
  ).trim();
  if (!name) return null;

  const phone = raw.phoneNumbers?.[0]?.number ?? undefined;
  const email = raw.emails?.[0]?.email ?? undefined;
  const birthDate = raw.birthday ? (toDateStr(raw.birthday) ?? undefined) : undefined;
  const memo = raw.note ?? undefined;

  const anniversaries: { title: string; date: string }[] = [];
  for (const d of raw.dates ?? []) {
    const dateStr = toDateStr(d);
    if (!dateStr) continue;
    anniversaries.push({ title: mapLabel(d.label ?? "기타"), date: dateStr });
  }

  // expo-contacts Contact.id는 플랫폼별 식별자 — UI 선택 추적용으로만 사용
  const id = (raw as Record<string, unknown>).id as string | undefined;
  return { id: id ?? name, name, phone, email, birthDate, memo, anniversaries };
}

export function useContactsImport() {
  const [contacts, setContacts] = useState<ImportableContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.Birthday,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.Note,
        Contacts.Fields.Dates,
      ],
    });

    const parsed = data
      .map(parseContact)
      .filter((c): c is ImportableContact => c !== null)
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));

    setContacts(parsed);
    setLoading(false);
  }, []);

  const importContacts = useCallback(
    async (selected: ImportableContact[], groupId: number): Promise<ImportResult> => {
      const now = new Date();
      let added = 0;

      for (const c of selected) {
        const [person] = await db
          .insert(persons)
          .values({
            name: c.name,
            birthDate: c.birthDate ?? null,
            phone: c.phone ?? null,
            email: c.email ?? null,
            memo: c.memo ?? null,
            groupId,
            isPinned: false,
            createdAt: now,
            updatedAt: now,
          })
          .returning({ id: persons.id });

        if (c.anniversaries.length > 0) {
          await db.insert(personAnniversaries).values(
            c.anniversaries.map((a) => ({
              personId: person.id,
              title: a.title,
              date: a.date,
              isRepeat: true,
              createdAt: now,
            })),
          );
        }
        added++;
      }

      return { added };
    },
    [],
  );

  return { contacts, loading, permissionDenied, loadContacts, importContacts };
}
