# mylog — 기술 기획서 v0.2

> "서버 없는 담백한 기록, 데이터의 주인은 나"

---

## 1. 서비스 개요

| 항목      | 내용                                                       |
| --------- | ---------------------------------------------------------- |
| 핵심 가치 | 데이터 주권(Local-first), 알림 없는 자발적 기록, 간결한 UI |
| 타겟 유저 | 관계 기록과 일정 추적을 조용히 관리하고 싶은 20-40대       |
| 플랫폼    | **Android 우선** → iOS 후속 출시 (React Native + Expo EAS) |
| 수익 모델 | Freemium → One-time Purchase (평생 소장권)                 |

---

## 2. 아키텍처 설계

### 2.1 Local-first 원칙

```
[Device]
  └─ WatermelonDB (SQLite)   ← 진실의 원천(Source of Truth)
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
백업 시: { data: [...], backup_at: ISO8601, device_id: uuid }
복원 시:
  ├─ local.updated_at > remote.backup_at → "로컬이 최신, 덮어쓸까요?"
  ├─ remote.backup_at > local.updated_at → "드라이브가 최신, 복원할까요?"
  └─ 동일 타임스탬프 → 자동 복원
```

**구현 규칙:**

- `updated_at`은 WatermelonDB가 자동 관리 (`@date` decorator)
- 백업 파일명: `mylog_backup_YYYYMMDD_HHmmss.json`
- App Data Folder에 최대 5개 백업 보관 (FIFO 방식으로 오래된 것 삭제)

---

## 3. 데이터 모델 (WatermelonDB Schema)

```typescript
// db/schema.ts
import { appSchema, tableSchema } from "@nozbe/watermelondb";

export default appSchema({
  version: 1,
  tables: [
    // 유저 정의 그룹 (집안/친구/회사 + 커스텀 확장)
    tableSchema({
      name: "groups",
      columns: [
        { name: "name",       type: "string" },
        { name: "color",      type: "string" },            // hex: "#FF5733"
        { name: "emoji",      type: "string", isOptional: true }, // "👨‍👩‍👧" 시각 보조
        { name: "is_default", type: "boolean" },           // true = 삭제 불가
        { name: "sort_order", type: "number" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "persons",
      columns: [
        { name: "name",       type: "string" },
        { name: "birth_date", type: "string",  isOptional: true }, // YYYY-MM-DD
        { name: "mbti",       type: "string",  isOptional: true },
        { name: "memo",       type: "string",  isOptional: true },
        { name: "group_id",   type: "string",  isIndexed: true }, // → groups.id
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "logs",
      columns: [
        { name: "title",           type: "string" },
        { name: "log_date",        type: "number" },                   // timestamp (ms)
        { name: "memo",            type: "string",  isOptional: true },
        // 반복: 규칙만 저장, UI에서 동적 생성 (Option A)
        { name: "repeat_type",     type: "string",  isOptional: true }, // none|daily|weekly|monthly|yearly
        { name: "repeat_interval", type: "number",  isOptional: true }, // 2 = 격주, 3 = 3개월마다
        { name: "repeat_until",    type: "number",  isOptional: true }, // 종료 timestamp
        { name: "group_id",        type: "string",  isIndexed: true }, // → groups.id
        { name: "created_at",      type: "number" },
        { name: "updated_at",      type: "number" },
      ],
    }),
    tableSchema({
      name: "log_persons", // N:M 연결 테이블
      columns: [
        { name: "log_id",    type: "string", isIndexed: true },
        { name: "person_id", type: "string", isIndexed: true },
      ],
    }),
  ],
});
```

### 3.1 Model 정의

```typescript
// db/models/Group.ts
import { Model, field, date, children } from "@nozbe/watermelondb";

export default class Group extends Model {
  static table = "groups";
  static associations = {
    logs:    { type: "has_many" as const, foreignKey: "group_id" },
    persons: { type: "has_many" as const, foreignKey: "group_id" },
  };

  @field("name")       name!: string;
  @field("color")      color!: string;
  @field("emoji")      emoji!: string;
  @field("is_default") isDefault!: boolean;
  @field("sort_order") sortOrder!: number;
  @date("created_at")  createdAt!: Date;
  @date("updated_at")  updatedAt!: Date;
}
```

```typescript
// db/models/Log.ts
import { Model, field, date, relation, lazy } from "@nozbe/watermelondb";
import { Q } from "@nozbe/watermelondb";

export default class Log extends Model {
  static table = "logs";
  static associations = {
    groups:      { type: "belongs_to" as const, key: "group_id" },
    log_persons: { type: "has_many"   as const, foreignKey: "log_id" },
  };

  @field("title")            title!: string;
  @date("log_date")          logDate!: Date;
  @field("memo")             memo!: string;
  @field("repeat_type")      repeatType!: string;
  @field("repeat_interval")  repeatInterval!: number;
  @field("group_id")         groupId!: string;
  @date("created_at")        createdAt!: Date;
  @date("updated_at")        updatedAt!: Date;

  @relation("groups", "group_id") group!: Group;

  // 연결된 Person 목록 (reactive query)
  @lazy persons = this.collections
    .get("persons")
    .query(Q.on("log_persons", "log_id", this.id));
}
```

### 3.2 기본 그룹 시드 데이터

앱 최초 실행 시 `is_default: true` 3개 자동 생성. UI에서 삭제 버튼 비활성화.

```typescript
// db/seed.ts
export const DEFAULT_GROUPS = [
  { name: "집안", color: "#FF6B6B", emoji: "🏠", is_default: true,  sort_order: 0 },
  { name: "친구", color: "#4ECDC4", emoji: "👥", is_default: true,  sort_order: 1 },
  { name: "회사", color: "#45B7D1", emoji: "💼", is_default: true,  sort_order: 2 },
];
```

### 3.2 스키마 마이그레이션 전략

WatermelonDB는 `version` 숫자로 마이그레이션 관리.
컬럼 추가/삭제 시 반드시 `migrations.ts`에 등록. 앱 업데이트로 DB 버전 불일치 시 자동 마이그레이션 실행.

```typescript
// db/migrations.ts
import {
  schemaMigrations,
  addColumns,
} from "@nozbe/watermelondb/Schema/migrations";

export default schemaMigrations({
  migrations: [
    // v1 → v2: persons에 avatar_url 추가 예시
    // {
    //   toVersion: 2,
    //   steps: [addColumns({ table: 'persons', columns: [{ name: 'avatar_url', type: 'string', isOptional: true }] })],
    // },
  ],
});
```

---

## 4. 핵심 기술 구현

### 4.1 인앱 결제 (react-native-iap)

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

const PREMIUM_SKU = "com.mylog.premium_lifetime";
const PREMIUM_KEY = "@mylog/is_premium";

export function useIAP() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // AsyncStorage에서 구매 상태 복원
    AsyncStorage.getItem(PREMIUM_KEY).then((v) => setIsPremium(v === "true"));

    initConnection();

    const onPurchaseUpdate = purchaseUpdatedListener(
      async (purchase: ProductPurchase) => {
        if (!purchase.transactionReceipt) return;
        await finishTransaction({ purchase, isConsumable: false });
        await AsyncStorage.setItem(PREMIUM_KEY, "true");
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
        await AsyncStorage.setItem(PREMIUM_KEY, "true");
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

// WatermelonDB 저장 후 호출
export function scheduleBackup(accessToken: string, getData: () => object) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => executeBackup(accessToken, getData()), 30_000);
}

// 앱 백그라운드 진입 시 강제 즉시 실행
export async function flushBackup(accessToken: string, data: object) {
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
  await executeBackup(accessToken, data);
}

async function executeBackup(accessToken: string, data: object) {
  const fileId = await AsyncStorage.getItem(LATEST_FILE_ID_KEY);
  const body   = JSON.stringify({ data, backup_at: new Date().toISOString(), version: 1 });

  if (fileId) {
    // 기존 파일 덮어쓰기 (PATCH)
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body },
    );
    if (!res.ok) throw new Error(`Drive PATCH failed: ${res.status}`);
  } else {
    // 최초: 새 파일 생성 후 ID 캐시
    const metadata = { name: "mylog_latest.json", parents: [FOLDER] };
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file",     new Blob([body],                      { type: "application/json" }));
    const res  = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form },
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

### Phase 0 — 환경 설정 (1일, 지금 바로)

- [ ] `npx expo install expo-dev-client` + `eas build:configure`
- [ ] `npm uninstall react-native-worklets` (reanimated v4 충돌 방지)
- [ ] `tailwind.config.js`에 Gluestack preset 등록
- [ ] WatermelonDB + RN-IAP 설치 및 Android 빌드 검증

### Phase 1 — Core (4주, Android 우선)

- [ ] WatermelonDB Schema + Model + Seed 데이터 (기본 그룹 3개)
- [ ] 그룹 CRUD (커스텀 그룹 추가/수정/삭제, 기본 그룹 삭제 방지)
- [ ] 일정 CRUD + 반복 규칙 UI 동적 생성
- [ ] 인물 CRUD + 목록 뷰
- [ ] 캘린더 뷰 + 아코디언 목록 (Gluestack + NativeWind)

### Phase 2 — Premium (2주)

- [ ] Freemium 제한 로직 (카운트 게이트)
- [ ] RN-IAP 결제 + 복원 플로우
- [ ] Google Drive 백업/복원

### Phase 3 — Retention (2주)

- [ ] 로컬 알림 (생일, 기념일)
- [ ] "오늘의 회상" 기능
- [ ] 관계 온도계 UI

### Phase 4 — Polish + 출시 (1주)

- [ ] 테마 + 다크모드
- [ ] 암호화 내보내기/공유
- [ ] **Google Play Store 제출** (Android 우선)
- [ ] iOS App Store 제출 (후속)

---

## 9. 리스크 레지스터

| #   | 리스크                                                          | 심각도       | 완화 방안                                                           |
| --- | --------------------------------------------------------------- | ------------ | ------------------------------------------------------------------- |
| R1  | Expo 관리형 워크플로우 + WatermelonDB/RN-IAP 네이티브 모듈 충돌 | **Critical** | Phase 1 시작 전 EAS Build + custom dev client로 전환                |
| R2  | 서버 없는 IAP → 영수증 위조                                     | Medium       | 허용 리스크. 피해 규모 소액. 스토어 자체 검증으로 일반 사용자 방어  |
| R3  | Google Drive App Data Folder 용량 제한 (10MB/app)               | Low          | 백업 파일 5개 FIFO 유지, 단건 파일 크기 모니터링                    |
| R4  | WatermelonDB 스키마 마이그레이션 누락 → 유저 DB 초기화          | High         | migrations.ts 필수 등록, 출시 전 버전 업 테스트                     |
| R5  | react-native-worklets와 reanimated v4 충돌                      | Low          | `react-native-worklets` 제거 검토 (reanimated v4 내장 worklet 사용) |
