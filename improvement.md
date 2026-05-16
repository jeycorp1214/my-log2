# 프로젝트 개선점 분석

> 분석 기준일: 2026-05-17
> 대상: Expo React Native 개인 라이프 로깅 앱 (Phase 1–16 완료)

---

## 우선순위 분류

| 등급         | 기준                               |
| ------------ | ---------------------------------- |
| **Critical** | 데이터 손실 또는 앱 크래시 가능성  |
| **High**     | 성능 저하 또는 확장 시 명확한 문제 |
| **Medium**   | 코드 품질 / 유지보수성             |
| **Low**      | 정리 / 미래 대비                   |

---

## Critical — 데이터 무결성

### C1. `importData` 트랜잭션 없음 (`services/backup.ts:118`)

**문제.** DELETE 7개 + INSERT 7개를 순차 실행하는데 트랜잭션으로 묶이지 않는다. 중간에 INSERT 실패하면 일부 테이블은 비어있고 일부는 복원된 불완전한 상태가 된다.

```ts
// 현재: 트랜잭션 없음
await db.delete(logPersons);
await db.delete(logs);
// ... INSERT 실패 시 데이터 반쪽만 남음

// 개선
await db.transaction(async (tx) => {
  await tx.delete(logPersons);
  // ...
  if (d.groups.length > 0) await tx.insert(groups).values(...);
});
```

**편집 파일:** `services/backup.ts`

---

### C2. `BACKUP_VERSION = 1` 고정, 버전 업그레이드 경로 없음 (`services/backup.ts:18`)

**문제.** 스키마가 변경될 때마다 `version !== BACKUP_VERSION` 체크가 오래된 백업을 완전 차단한다. Phase 15에서 `todos.note`, `memos.pinnedAt` 등 컬럼이 추가됐지만 버전은 여전히 1이다.

**개선 방향.**

- 스키마 변경 시 버전 올리고 이전 버전 복원 로직(`migrateBackupV1toV2`) 추가.
- 또는 컬럼 누락은 기본값으로 채우는 관대한 복원 로직 도입.

**편집 파일:** `services/backup.ts`

---

## High — 성능

### H1. `expandRepeatInMonth` 스킵 루프 O(n) (`utils/repeat.ts:34`)

**문제.** 반복 시작일부터 `monthStart`까지 하나씩 반복한다. 3년 전에 시작된 일간 반복이면 루프 1,000회 이상.

```ts
// 현재: 선형 스킵
while (cur.toDate() < monthStart && guard++ < 10000) {
  cur = fn(cur);
}

// 개선: 수학적 점프 (daily/weekly 예시)
if (repeatType === "daily") {
  const diffDays = dayjs(monthStart).diff(dayjs(origin), "day");
  const stepsNeeded = Math.ceil(diffDays / step);
  if (stepsNeeded > 0) cur = cur.add(stepsNeeded * step, "day");
}
```

**편집 파일:** `utils/repeat.ts`

---

### H2. `useCalendarData` 전체 반복 로그 + 전체 프로필 로드 (`hooks/useCalendarData.ts:57,69`)

**문제.**

1. `repeatLogs` 쿼리: 날짜 상한만 있고 하한 없음 → 앱 초기부터의 모든 반복 로그 로드.
2. `allPersons` 쿼리: 생일 점 표시 목적으로 전체 프로필 로드 (컬럼 `birthDate`만 필요).

**개선.**

```ts
// repeatLogs: repeatUntil IS NULL OR repeatUntil >= monthStart 조건 추가
.where(and(
  isNotNull(logs.repeatType),
  ne(logs.repeatType, "none"),
  lte(logs.logDate, monthEnd.toDate()),
  or(isNull(logs.repeatUntil), gte(logs.repeatUntil, monthStart.toDate())), // 추가
))

// allPersons: birthDate만 select
db.select({ id: persons.id, birthDate: persons.birthDate }).from(persons)
  .where(isNotNull(persons.birthDate))
```

**편집 파일:** `hooks/useCalendarData.ts`

---

### H3. `useEventFilter` 반복 expand 범위 미지정 (`hooks/logs/use-event-filter.ts:63`)

**문제.** `expandRepeatInMonth(log, start, repeatEnd)` 호출에서 `start`가 수년 전일 수 있다("전체" 프리셋). H1 문제와 결합 시 호출당 수만 회 루프.

**개선.** 위 H1 수학적 점프 적용으로 같이 해결.

---

## Medium — 코드 품질

### M1. `ensureColumns` 패턴 증식 (`db/client.ts:15–73`)

**문제.** Phase마다 `ensureXxxColumns()` 함수가 추가되고 있다. 현재 4개 함수 = PRAGMA 4회 + ALTER 최대 9회(앱 시작마다). Migration이 정상 동작한다면 이 코드들은 불필요하다.

**개선 방향.**

- `drizzle-kit` 마이그레이션이 안정화된 Phase에 대해서는 `ensureColumns` 제거.
- 이미 배포된 앱 대응이 목적이라면 `ensure*` 함수들을 하나의 `ensureAllLegacyColumns()` 로 병합해 PRAGMA를 1회로 줄임.

**편집 파일:** `db/client.ts`

---

### M2. `persons.tags` JSON 문자열 저장 (`db/schema.ts:35`)

**문제.** `text("tags")` 컬럼에 JSON 배열 문자열 저장. 이미 Phase 16에서 `JSON.parse` 크래시 버그가 발생했다. 파싱 코드가 여러 파일에 분산될 위험.

**단기 개선.** 파싱을 util 함수로 중앙화:

```ts
// utils/person.ts
export function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
```

**중기 개선.** `person_tags` 별도 테이블 (하지만 마이그레이션 비용 있음).

---

### M3. `TabPreferencesProvider`가 `SecureStore` 사용 (`providers/TabPreferencesProvider.tsx:89`)

**문제.** 필터 순서·뷰 모드 같은 비민감 설정에 `expo-secure-store` 사용. SecureStore는 보안 키체인에 저장되며 iOS에서 2KB 제한이 있다. 설정 항목이 늘어나면 조용히 실패할 수 있다.

```ts
// 개선: expo-file-system 또는 AsyncStorage 사용
import AsyncStorage from "@react-native-async-storage/async-storage";
await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
```

**편집 파일:** `providers/TabPreferencesProvider.tsx`

---

### M4. `logs.repeatType` DB 제약 없음 (`db/schema.ts:54`)

**문제.** `text("repeat_type")` 컬럼에 어떤 값이든 저장 가능. 실제 유효값은 `none|daily|weekly|monthly|yearly` 5가지인데 DB 레벨 CHECK 제약이 없다.

**개선.** 마이그레이션에 CHECK 제약 추가 또는 insert 시 유효성 검사 추가:

```sql
-- 신규 마이그레이션에서
ALTER TABLE logs ADD CHECK (
  repeat_type IS NULL OR
  repeat_type IN ('none','daily','weekly','monthly','yearly')
);
```

---

### M5. `resetDatabase` 함수명 혼동 위험 (`db/client.ts:76`)

**문제.** `resetDatabase()`는 "구조 초기화"가 아니라 "전체 데이터 삭제 + 마이그레이션 재실행"이다. 함수명만 보면 설정 초기화로 오해할 수 있다.

**개선.** `wipeDatabaseAndReinitialize()` 또는 최소한 JSDoc 경고 추가.

---

## Low — 정리

### L1. `expo-notifications` 사용하지 않는 의존성 (`package.json`)

Phase 4 기획에서 알림 기능이 명시적으로 제거됐지만 패키지가 남아있다. 앱 번들 크기 증가 + Android 권한 자동 선언.

```
npm uninstall expo-notifications
```

---

### L2. 루트 디렉토리 stale 문서 파일

아래 파일들이 루트에 산재해 있다. `docs/archive/`로 이동하거나 삭제 검토.

- `calendar-migration.md`
- `calendar-test-features.md`
- `calendar-test-plan.md`
- `calendar-view-fixes.md`
- `feature-evaluation.md`
- `planning.md`
- `context-notes.md`

---

### L3. 순수 함수 단위 테스트 없음

아래 유틸은 외부 의존성이 없어 테스트 작성이 쉽다.

| 파일              | 함수                                         |
| ----------------- | -------------------------------------------- |
| `utils/repeat.ts` | `expandRepeatInMonth`                        |
| `utils/date.ts`   | `parseBirthInput`, `dDayLabel`, `calcStreak` |

최소한 엣지 케이스(윤년 2/29, repeatUntil 경계값, invalid input)만 커버해도 Phase 16류 버그를 사전 차단 가능.

---

### L4. `drizzle/meta/` 스냅샷 불완전

`0001_snapshot.json` ~ `0003_snapshot.json`이 없다. `drizzle-kit diff` 또는 `drizzle-kit generate` 실행 시 스냅샷 불일치로 실패할 수 있다.

---

## 요약

| 코드 | 항목                                       | 파일                                   | 상태               |
| ---- | ------------------------------------------ | -------------------------------------- | ------------------ |
| C1   | importData 트랜잭션                        | `services/backup.ts`                   | ⬜ 미완료          |
| C2   | 백업 버전 관대한 체크                      | `services/backup.ts`                   | ⬜ 미완료          |
| H1   | expandRepeatInMonth O(1) 수학적 점프       | `utils/repeat.ts`                      | ⬜ 미완료          |
| H2   | useCalendarData 쿼리 최적화                | `hooks/useCalendarData.ts`             | ⬜ 미완료          |
| H3   | useEventFilter — H1 적용으로 자동 개선     | —                                      | ⬜ H1 선행 필요    |
| M1   | ensureAllLegacyColumns 단일 함수로 병합    | `db/client.ts`                         | ⬜ 미완료          |
| M2   | parseTags util 중앙화                      | `utils/person.ts`                      | ✅ Phase 16 완료   |
| M3   | SecureStore → AsyncStorage                 | `providers/TabPreferencesProvider.tsx` | ⬜ 미완료          |
| M4   | REPEAT_TYPES 상수 + RepeatType 타입 export | `utils/repeat.ts`                      | ⬜ 미완료          |
| M5   | resetDatabase 주석 경고 강화               | `db/client.ts`                         | ⬜ 미완료          |
| L1   | expo-notifications 제거                    | `package.json`                         | ✅ 완료            |
| L2   | 문서 정리 및 재구조화                      | `docs/`                                | ✅ 2026-05-17 완료 |
| L3   | 유틸 단위 테스트 작성                      | `__tests__/utils/`                     | ⬜ 미완료          |
| L4   | drizzle meta 스냅샷 보완                   | `drizzle/meta/`                        | ⬜ 미완료          |

### L3 테스트 실행 방법

```bash
npm install   # jest-expo, @types/jest 설치 필요
npm test
```
