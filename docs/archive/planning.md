# mylog — 기술 기획서 v0.4

> "서버 없는 담백한 기록, 데이터의 주인은 나"

---

## 1. 서비스 개요

| 항목      | 내용                                                       |
| --------- | ---------------------------------------------------------- |
| 핵심 가치 | 데이터 주권(Local-first), 알림 없는 자발적 기록, 간결한 UI |
| 타겟 유저 | 관계 기록과 일정 추적을 조용히 관리하고 싶은 20-40대       |
| 플랫폼    | **Android 우선** → iOS 후속 출시 (React Native + Expo EAS) |
| 수익 모델 | Freemium → One-time Purchase (평생 소장권)                 |

### 1.1 확정 기술 스택

| 레이어       | 라이브러리                                | 선택 이유                                                      |
| ------------ | ----------------------------------------- | -------------------------------------------------------------- |
| 로컬 DB      | `expo-sqlite` v16                         | Expo 공식 지원, 추가 네이티브 모듈 없음                        |
| ORM          | `drizzle-orm`                             | 타입세이프, SQL-first, expo-sqlite 공식 통합                   |
| 마이그레이션 | `drizzle-kit`                             | SQL 파일 자동 생성, `drizzle/` 폴더로 관리                     |
| UI           | `@gluestack-ui/core` v3 + `nativewind` v4 | 현재 설치됨                                                    |
| 애니메이션   | `react-native-reanimated` v4              | Expo 공식 권장                                                 |
| Worklets     | `react-native-worklets` v0.5              | reanimated v4 peer dep — **제거 금지**                         |
| 네비게이션   | `expo-router` v6                          | Expo 공식, 파일 기반 라우팅                                    |
| 결제         | `react-native-iap`                        | Android/iOS 공통 IAP, 검증된 OSS (보류)                        |
| 알림         | `expo-notifications`                      | Expo 공식, 로컬 알림                                           |
| 파일/공유    | `expo-file-system` + `expo-sharing`       | Expo 공식                                                      |
| 암호화       | `expo-crypto`                             | Expo 공식                                                      |
| 날짜 유틸    | `dayjs`                                   | 경량, 나이 계산/표시/관계 온도계/On This Day                   |
| 비동기 상태  | `@tanstack/react-query`                   | Drive·IAP 뮤테이션 한정. 로컬 DB는 drizzle `useLiveQuery` 사용 |
| 보안 저장소  | `expo-secure-store`                       | 프리미엄 구매 플래그 이중 저장 (AsyncStorage 보완)             |

### 1.2 WatermelonDB 제외 근거

> 직접 적용 시도 후 확인된 불안정 요인. 재도입 금지.

| 문제                              | 상세                                                                    |
| --------------------------------- | ----------------------------------------------------------------------- |
| **네이티브 모듈 필수**            | JSI 기반 → Expo managed workflow에서 custom dev client 없으면 동작 불가 |
| **Babel 플러그인 충돌**           | `@babel/plugin-proposal-decorators`가 다른 플러그인과 충돌 빈발         |
| **Expo SDK 54 + React 19 미검증** | 커뮤니티 빌드 실패 이슈 다수 보고 중                                    |
| **expo-sqlite 대비 이점 없음**    | expo-sqlite v15는 JSI 기반으로 성능 격차 거의 없음                      |

---

## 2. 아키텍처 설계

### 2.1 Local-first 원칙

```
[Device]
  └─ expo-sqlite + drizzle-orm   ← 진실의 원천(Source of Truth)
       ├─ UI Layer (Gluestack v3 + NativeWind)
       └─ Sync Layer
            └─ Google Drive App Data Folder  ← 백업 전용 (서버 X)
```

**Local-first 이점:**

- 오프라인 완전 동작 — 네트워크 없어도 모든 기능 사용 가능
- 응답 속도 = 디스크 I/O 속도 (서버 왕복 없음)
- 개인정보 리스크 제로 — 서버에 데이터 없음
- 서버 비용 없음 → 지속 가능한 1인 개발 구조

### 2.2 데이터 정합성 전략 (멀티 디바이스)

서버 없는 환경에서 멀티 디바이스 충돌을 막을 수 없다. **Last-Write-Wins + 타임스탬프 경고** 전략 채택.

```
백업 시: { data: [...], backup_at: ISO8601, device_id: uuid, device_name: string }
복원 시:
  ├─ local.updated_at > remote.backup_at → "로컬이 최신, 덮어쓸까요?"
  ├─ remote.backup_at > local.updated_at → "다른 기기(Galaxy S24)에서 온 데이터가 최신입니다. 교체할까요?"
  └─ 동일 타임스탬프 → 자동 복원
```

**구현 규칙:**

- `updated_at`은 매 update 쿼리에서 `updatedAt: new Date()` 수동 갱신 (명시적 제어)
- 백업 파일명: `mylog_backup_YYYYMMDD_HHmmss.json`
- App Data Folder에 최대 5개 백업 보관 (FIFO 방식으로 오래된 것 삭제)

---

## 3. 데이터 모델 (expo-sqlite + drizzle-orm)

> **현재 실제 스키마 기준.** planning.md의 초기 설계 코드와 다를 수 있음.

| 테이블 | 주요 컬럼 |
|--------|-----------|
| `groups` | id, name, color, emoji, isDefault, sortOrder |
| `persons` | id, name, birthDate, mbti, memo, groupId(**nullable**) |
| `logs` | id, title, logDate, memo, repeatType(none/daily/weekly/monthly/yearly), repeatInterval, repeatUntil, groupId(**nullable**), **checkedAt** |
| `logPersons` | id, logId, personId (N:M, cascade delete) |
| `personAnniversaries` | id, personId, title, date(YYYY-MM-DD), isRepeat (cascade delete) |
| `todos` | id, title, quadrant(do/schedule/delegate/eliminate), checkedAt |
| `memos` | id, content, checkedAt |

**마이그레이션 현황:**
- 0000: groups, persons, logs, logPersons 기본 생성
- 0001: logs.checked_at 추가
- 0002: person_anniversaries 테이블 생성
- 0003: memos 테이블 생성
- 0004: todos 테이블 생성

**drizzle-kit generate 해결 방법 (2026-05-15):**
- `db/generate-id.ts` → `node:crypto` (drizzle-kit/Node.js 환경)
- `db/generate-id.native.ts` → `expo-crypto` (React Native/Metro 환경)
- Metro가 `.native.ts` 우선 resolve → 앱/drizzle-kit 환경 분리됨
- generate 후 `drizzle/migrations.js`에 수동으로 import/export 추가 필요

```typescript
// db/schema.ts (실제 파일 참조, 아래는 요약)
import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { randomUUID } from "./generate-id";

// groups, persons, logs, logPersons, personAnniversaries, todos, memos
// → db/schema.ts 직접 참조
```

### 3.1 DB 클라이언트 설정

```typescript
// db/client.ts
import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";
import * as schema from "./schema";

const expo = SQLite.openDatabaseSync("mylog.db", {
  enableChangeListener: true,
});
export const db = drizzle(expo, { schema });

// 앱 시작 시 app/_layout.tsx에서 한 번 호출
export async function runMigrations() {
  await migrate(db, migrations);
}
```

> `updatedAt`이 있는 레코드 수정 시 항상 `updatedAt: new Date()`를 명시적으로 포함.

> 로컬 DB 조회는 `drizzle-orm/expo-sqlite`의 `useLiveQuery`를 사용하면 INSERT/UPDATE/DELETE 시 자동으로 리렌더링됩니다. `@tanstack/react-query`는 **Drive 백업·IAP 비동기 작업에만** 사용합니다.

### 3.2 기본 그룹 시드 데이터

앱 최초 실행 시 `isDefault: true` 3개 자동 생성. UI에서 삭제 버튼 비활성화.

```typescript
// db/seed.ts
import { db } from "./client";
import { groups } from "./schema";

export const DEFAULT_GROUPS = [
  {
    name: "미설정",
    color: "#ADB5BD", // 회색톤으로 설정하여 '없음'의 느낌을 강조
    emoji: "⬛", // 비어있는 것보다 기본 이모지가 있는 것이 UI상 깔끔합니다
    isDefault: true,
    sortOrder: 0,
  },
  {
    name: "가족",
    color: "#FF6B6B",
    emoji: "🏠",
    isDefault: true,
    sortOrder: 1,
  },
  {
    name: "친구",
    color: "#4ECDC4",
    emoji: "👥",
    isDefault: true,
    sortOrder: 2,
  },
  {
    name: "회사",
    color: "#45B7D1",
    emoji: "💼",
    isDefault: true,
    sortOrder: 3,
  },
  {
    name: "지인",
    color: "#FFA07A", // 기존 노란색보다 가독성이 좋은 살구색 계열 추천
    emoji: "🤝",
    isDefault: true,
    sortOrder: 4,
  },
];

export async function seedDefaultGroups() {
  const existing = await db.select().from(groups);
  if (existing.length > 0) return;
  await db.insert(groups).values(DEFAULT_GROUPS);
}
```

### 3.3 마이그레이션 전략 (drizzle-kit)

컬럼 추가/수정 시 `db/schema.ts`만 수정 후 아래 명령을 실행하면 SQL 파일이 자동 생성됩니다.

```bash
# 스키마 변경 후 실행
npx drizzle-kit generate  # → drizzle/migrations/ 에 SQL 파일 생성
```

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "expo",
});
```

> 생성된 마이그레이션 파일은 반드시 git 커밋. `runMigrations()`가 앱 시작 시 자동 적용.

### 3.4 날짜 유틸리티 (dayjs)

앱 전반에서 날짜 포맷·나이 계산·경과 시간을 일관되게 처리합니다.

```typescript
// utils/date.ts
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";

dayjs.extend(relativeTime);
dayjs.locale("ko");

// 나이 계산 (birthDate: "YYYY-MM-DD")
export function calcAge(birthDate: string): number {
  return dayjs().diff(dayjs(birthDate), "year");
}

// 관계 온도계: 마지막 기록으로부터 경과 시간
// 예: "3일 전", "2개월 전"
export function fromNow(date: Date): string {
  return dayjs(date).fromNow();
}

// 캘린더 표시용 포맷
export function formatLogDate(date: Date): string {
  return dayjs(date).format("YYYY년 M월 D일");
}

// On This Day: 오늘 월/일과 같은 과거 기록 필터
export function isSameMonthDay(date: Date): boolean {
  const today = dayjs();
  return (
    dayjs(date).month() === today.month() && dayjs(date).date() === today.date()
  );
}
```

---

## 4. 핵심 기술 구현

### 4.1 인앱 결제 (react-native-iap) - 제거됨 (2026-05-08)

> **현황:** `react-native-iap` 의존성 제거. 개발/테스트 단계에서 방해 요소로 판단. 결제 기능 재도입 시 아래 코드 참조.

> **주의:** 서버 검증 없음 → Android 루팅/iOS 탈옥 환경에서 영수증 위조 가능. 허용 리스크로 판단하고 진행.

```typescript
// hooks/useIAP.ts
import { useEffect, useCallback, useState } from "react";
import {
  initConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type ProductPurchase,
} from "react-native-iap";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const PREMIUM_SKU = "com.mylog.premium_lifetime";
const PREMIUM_KEY = "@mylog/is_premium";

// AsyncStorage(빠른 읽기) + SecureStore(변조 방어) 이중 저장
async function savePremium() {
  await Promise.all([
    AsyncStorage.setItem(PREMIUM_KEY, "true"),
    SecureStore.setItemAsync(PREMIUM_KEY, "true"),
  ]);
}

async function loadPremium(): Promise<boolean> {
  const [fast, secure] = await Promise.all([
    AsyncStorage.getItem(PREMIUM_KEY),
    SecureStore.getItemAsync(PREMIUM_KEY),
  ]);
  return fast === "true" || secure === "true";
}

export function useIAP() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // SecureStore 우선, AsyncStorage fallback으로 구매 상태 복원
    loadPremium().then(setIsPremium);

    initConnection();

    const onPurchaseUpdate = purchaseUpdatedListener(
      async (purchase: ProductPurchase) => {
        if (!purchase.transactionReceipt) return;
        await finishTransaction({ purchase, isConsumable: false });
        await savePremium();
        setIsPremium(true);
      },
    );

    const onPurchaseError = purchaseErrorListener((err) => {
      console.warn("[IAP Error]", err.code, err.message);
    });

    return () => {
      onPurchaseUpdate.remove();
      onPurchaseError.remove();
    };
  }, []);

  const purchase = useCallback(async () => {
    setLoading(true);
    try {
      await requestPurchase({ sku: PREMIUM_SKU });
    } finally {
      setLoading(false);
    }
  }, []);

  // 재설치 / 기기 변경 시 구매 복원
  const restore = useCallback(async () => {
    setLoading(true);
    try {
      const purchases = await getAvailablePurchases();
      const has = purchases.some((p) => p.productId === PREMIUM_SKU);
      if (has) {
        await savePremium();
        setIsPremium(true);
      }
      return has;
    } finally {
      setLoading(false);
    }
  }, []);

  return { isPremium, loading, purchase, restore };
}
```

### 4.2 Google Drive 백업 (Debounced Real-time)

저장 즉시 Drive 호출 = API rate limit 초과 + 배터리 낭비.
**전략: 단일 최신 파일 덮어쓰기 + debounce 30초**

```
저장 이벤트 발생
  → 30초 debounce 타이머 시작 (타이머 중 재저장 시 재시작)
  → 타이머 만료 → Drive 최신 백업 파일 PATCH (덮어쓰기)
  → UI "동기화 완료" 표시

앱 백그라운드 진입 시 → 타이머 무시, 즉시 강제 업로드
```

```typescript
// services/driveBackup.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const LATEST_FILE_ID_KEY = "@mylog/drive_latest_file_id";
const FOLDER = "appDataFolder";
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// DB 저장 후 호출
export function scheduleBackup(accessToken: string, getData: () => object) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(
    () => executeBackup(accessToken, getData()),
    30_000,
  );
}

// 앱 백그라운드 진입 시 강제 즉시 실행
export async function flushBackup(accessToken: string, data: object) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  await executeBackup(accessToken, data);
}

async function executeBackup(accessToken: string, data: object) {
  const fileId = await AsyncStorage.getItem(LATEST_FILE_ID_KEY);
  const body = JSON.stringify({
    data,
    backup_at: new Date().toISOString(),
    version: 1,
  });

  if (fileId) {
    // 기존 파일 덮어쓰기 (PATCH)
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body,
      },
    );
    if (!res.ok) throw new Error(`Drive PATCH failed: ${res.status}`);
  } else {
    // 최초: 새 파일 생성 후 ID 캐시
    const metadata = { name: "mylog_latest.json", parents: [FOLDER] };
    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" }),
    );
    form.append("file", new Blob([body], { type: "application/json" }));
    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      },
    );
    if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
    const { id } = await res.json();
    await AsyncStorage.setItem(LATEST_FILE_ID_KEY, id);
  }
}
```

> **스냅샷 백업** (프리미엄 전용): 주 1회 타임스탬프 파일 별도 생성 → 최대 5개 FIFO 보관.

### 4.3 공유 기능 (서버 없는 암호화 내보내기)

서버 없이 공유하는 가장 현실적 방법: **암호화 JSON 파일 → 네이티브 Share Sheet**.

```typescript
// services/shareExport.ts
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as Crypto from "expo-crypto";

export async function sharePersonLog(personData: object, passphrase: string) {
  // 1) SHA-256 키 파생 (간단 버전 — 실제론 PBKDF2 사용 권장)
  const key = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    passphrase,
  );

  // 2) 데이터 직렬화 + 메타데이터 포함
  const payload = JSON.stringify({
    version: 1,
    exported_at: new Date().toISOString(),
    checksum: key.slice(0, 8), // 수신자 검증용 hint
    data: personData,
  });

  // 3) 파일로 저장 후 Share Sheet 실행
  const path = FileSystem.cacheDirectory + "mylog_share.json";
  await FileSystem.writeAsStringAsync(path, payload);
  await Sharing.shareAsync(path, { mimeType: "application/json" });
}
```

> 수신자는 mylog 앱에서 "가져오기" → 동일 passphrase 입력 → checksum 검증 → import.

### 4.4 비동기 상태 관리 (@tanstack/react-query)

> **사용 범위:** Drive 백업/복원, IAP 뮤테이션에만 한정. 로컬 SQLite 쿼리는 drizzle `useLiveQuery`를 사용합니다.

```typescript
// app/_layout.tsx (QueryClient 설정)
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: { mutations: { retry: 1 } },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... */}
    </QueryClientProvider>
  );
}
```

```typescript
// hooks/useDriveBackup.ts (Drive 백업 뮤테이션 예시)
import { useMutation } from "@tanstack/react-query";
import { flushBackup } from "../services/driveBackup";

export function useDriveBackup() {
  return useMutation({
    mutationFn: ({ token, data }: { token: string; data: object }) =>
      flushBackup(token, data),
  });
}

// 사용: const { mutate, isPending, isError } = useDriveBackup();
```

---

## 5. Gluestack v3 UI 패턴

```tsx
// components/PersonCard.tsx
import {
  Box,
  Text,
  Badge,
  BadgeText,
  Pressable,
  HStack,
  VStack,
} from "@gluestack-ui/core";

interface Props {
  name: string;
  age: number;
  group: "family" | "friend" | "work";
  onPress: () => void;
}

const GROUP_COLOR = {
  family: "bg-rose-100",
  friend: "bg-sky-100",
  work: "bg-amber-100",
} as const;

export function PersonCard({ name, age, group, onPress }: Props) {
  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <Box className={`rounded-2xl p-4 ${GROUP_COLOR[group]}`}>
        <HStack className="items-center justify-between">
          <VStack>
            <Text className="text-lg font-semibold text-gray-900">{name}</Text>
            <Text className="text-sm text-gray-500">{age}세</Text>
          </VStack>
          <Badge className="rounded-full">
            <BadgeText>{group}</BadgeText>
          </Badge>
        </HStack>
      </Box>
    </Pressable>
  );
}
```

---

## 6. 수익 모델 상세

### 6.1 Freemium 제한

| 기능      | 무료       | 프리미엄           |
| --------- | ---------- | ------------------ |
| 일정 등록 | 30개       | 무제한             |
| 인물 등록 | 3명        | 무제한             |
| 백업      | 수동 (1회) | 자동 (주 1회)      |
| 테마      | 기본 1종   | 추가 테마          |
| 내보내기  | JSON만     | JSON + 암호화 공유 |

### 6.2 One-time Purchase

- SKU: `com.mylog.premium_lifetime`
- 가격대 추천: ₩9,900 ~ ₩14,900 (커피 한두 잔)
- Apple Family Sharing 활성화 권장 (구매 허들 낮춤)

### 6.3 서버 비용 없는 추가 전략

1. **테마 팩 개별 IAP**: `com.mylog.theme_dark`, `com.mylog.theme_pastel` 등 소액(₩1,900) 추가 판매
2. **위젯 팩**: 홈 화면 위젯 기능을 프리미엄 전용으로 — 재방문율 최강 피처
3. **Apple Family Sharing**: 한 명이 구매하면 가족 공유 → 입소문 효과

---

## 7. 리텐션 전략 ("데이터 주권" 극대화)

| 기능                          | 설명                                              | 리텐션 효과      |
| ----------------------------- | ------------------------------------------------- | ---------------- |
| **오늘의 회상** (On This Day) | N년 전 오늘 기록된 일정/인물 노출                 | 일일 재방문 유도 |
| **관계 온도계**               | 마지막 기록으로부터 경과 시간 시각화              | 기록 결핍감 자극 |
| **생일/기념일 알림**          | `expo-notifications` 로컬 알림                    | 앱 삭제 방어     |
| **연간 리포트**               | 연말 "당신의 2024" 통계 (기록 수, 자주 만난 인물) | 공유 유도        |
| **홈 위젯**                   | 오늘 일정 또는 "N일만에 기록" 위젯                | 진입 마찰 최소화 |

---

## 8. 개발 로드맵

### Phase 0 — 환경 설정 ✅ DONE

- [x] `npx expo install expo-dev-client` + `eas build:configure`
- [x] `tailwind.config.js`에 Gluestack preset 등록
- [x] `expo-sqlite` + `drizzle-orm` + `drizzle-kit` + `dayjs` + `@tanstack/react-query` + `expo-secure-store` 설치
- [x] **실기기(Android)** 에서 빌드 검증

### Phase 1 — Core ✅ DONE

- [x] drizzle Schema 정의 + 마이그레이션 + Seed 데이터
- [x] 그룹/인물/로그 CRUD
- [x] logPersons N:M 연결
- [x] 캘린더 뷰

### Phase 2 ~ 9 — ✅ DONE (checklist.md 상세 참조)

- [x] 반복 기능 (Virtual Occurrences)
- [x] 리스트 탭 (체크박스·기간 필터·바텀시트 필터)
- [x] 인물 기념일 D-Day
- [x] 검색
- [x] 캘린더 board 모드
- [x] 노트 탭 (메모 + 아이젠하워 할 일)
- [x] 홈 탭 → 최근 기록 30개 피드
- [x] PIN 비밀번호 잠금 (LockScreen + PinPad + PinLockProvider)
- [x] 히트맵, 타임라인 바텀시트
- [x] StyleSheet → className 전환 완료

### Phase 11 — 통계 (Stats) 🔄 진행 중

**v1 완료 (2026-05-16)**
- [x] `hooks/stats/use-stats.ts` — 6개 훅 + `calcStreak()`
- [x] `app/settings/stats.tsx` — 요약 / 인물 랭킹 / 마지막 연결 / 카테고리 비율 / 스트릭 / 완료율
- [x] `settings.tsx` 통계 링크 + `_layout.tsx` Stack.Screen 등록

**v2 추가 아이디어 — 우선순위별 구현**

| 우선순위 | 항목 | 훅 | 조건 |
|---------|------|-----|------|
| P1 | 반복 기록 비율 | `useRepeatRatio(period)` | 즉시 |
| P1 | 평균 기록 간격 | `useAvgInterval()` | 즉시 |
| P1 | 할일 사분면별 완료율 | `useQuadrantStats()` | 즉시 |
| P2 | 기록 없는 최장 공백 | `calcLongestGap()` | 기록 30개↑ |
| P3 | MBTI 분포 | `useMbtiDistribution()` | 인물 10명↑ |
| P3 | 함께 등장 빈도 | `useCoAppearance()` | 동반 기록 10건↑ |

> 구현 상세: checklist.md Phase 11 추가 아이디어 섹션 참조

### Phase Next — 미착수

- [ ] Freemium 제한 로직 (카운트 게이트)
- [ ] RN-IAP 결제 + 복원 플로우
- [ ] Google Drive 백업/복원
- [ ] 로컬 알림 (생일, 기념일)
- [ ] "오늘의 회상" 기능
- [ ] 관계 온도계 UI
- [ ] **Google Play Store 제출** (Android 우선)

---

## 9. 리스크 레지스터

| #   | 리스크                                                           | 심각도       | 완화 방안                                                                          |
| --- | ---------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------- |
| R1  | RN-IAP 네이티브 모듈 + Expo managed workflow 충돌                | High         | EAS Build + custom dev client로 전환. expo-sqlite는 Expo 공식으로 별도 처리 불필요 |
| R2  | 서버 없는 IAP → 영수증 위조                                      | Medium       | 허용 리스크. 피해 규모 소액. 스토어 자체 검증으로 일반 사용자 방어                 |
| R3  | Google Drive App Data Folder 용량 제한 (10MB/app)                | Low          | 백업 파일 5개 FIFO 유지, 단건 파일 크기 모니터링                                   |
| R4  | drizzle 스키마 변경 시 마이그레이션 파일 미커밋 → 유저 DB 오동작 | High         | 스키마 변경 후 `drizzle-kit generate` 실행 및 `drizzle/` 폴더 커밋 필수            |
| R5  | react-native-worklets 의도적 제거 시 reanimated v4 오동작        | **Critical** | worklets는 reanimated v4 peer dep. **절대 제거 금지**                              |
| R6  | 재설치 후 AsyncStorage 초기화 → 프리미엄 플래그 소실             | High         | `expo-secure-store` 이중 저장으로 보완. restore 플로우 반드시 QA 검증              |
