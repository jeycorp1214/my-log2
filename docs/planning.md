# mylog — 기술 기획서 v0.5

> "서버 없는 담백한 기록, 데이터의 주인은 나"
> 최종 업데이트: 2026-05-17

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
| 파일/공유    | `expo-file-system` + `expo-sharing`       | Expo 공식                                                      |
| 암호화       | `expo-crypto`                             | Expo 공식                                                      |
| 날짜 유틸    | `dayjs`                                   | 경량, 나이 계산/표시/관계 온도계/On This Day                   |
| 비동기 상태  | `@tanstack/react-query`                   | Drive·IAP 뮤테이션 한정. 로컬 DB는 drizzle `useLiveQuery` 사용 |
| 보안 저장소  | `expo-secure-store`                       | PIN 잠금 저장 (iOS Keychain / Android Keystore)                |

> **제거된 의존성:** `react-native-iap` (개발 단계 방해, 출시 전 재도입), `expo-notifications` (알림 기능 보류)

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
  ├─ remote.backup_at > local.updated_at → "다른 기기에서 온 데이터가 최신입니다."
  └─ 동일 타임스탬프 → 자동 복원
```

---

## 3. 데이터 모델 (expo-sqlite + drizzle-orm)

| 테이블                | 주요 컬럼                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `groups`              | id, name, color, emoji, isDefault, sortOrder                                                                                      |
| `persons`             | id, name, birthDate, mbti, memo, groupId(nullable), tags(JSON), metAt, contactInterval, isPinned                                  |
| `logs`                | id, title, logDate, memo, repeatType(none/daily/weekly/monthly/yearly), repeatInterval, repeatUntil, groupId(nullable), checkedAt |
| `logPersons`          | id, logId, personId (N:M, cascade delete)                                                                                         |
| `personAnniversaries` | id, personId, title, date(YYYY-MM-DD), isRepeat (cascade delete)                                                                  |
| `todos`               | id, title, quadrant(do/schedule/delegate/eliminate), checkedAt, dueDate, note                                                     |
| `memos`               | id, content, checkedAt, pinnedAt                                                                                                  |

**마이그레이션 현황:**

- 0000: groups, persons, logs, logPersons 기본 생성
- 0001: logs.checked_at 추가
- 0002: person_anniversaries 테이블 생성
- 0003: memos 테이블 생성
- 0004: todos 테이블 생성
- 0005: persons.is_pinned 추가
- 0006: persons.contact_interval 추가
- 0007: persons.tags, persons.met_at 추가
- 0008: memos.pinned_at 추가
- 0009: todos.due_date 추가

**drizzle-kit generate 해결 방법 (2026-05-15):**

- `db/generate-id.ts` → `node:crypto` (drizzle-kit/Node.js 환경)
- `db/generate-id.native.ts` → `expo-crypto` (React Native/Metro 환경)
- Metro가 `.native.ts` 우선 resolve → 앱/drizzle-kit 환경 분리됨
- generate 후 `drizzle/migrations.js`에 수동으로 import/export 추가 필요

### 3.1 DB 클라이언트 설정

```typescript
// db/client.ts
const expo = SQLite.openDatabaseSync("mylog.db", {
  enableChangeListener: true, // useLiveQuery 지원
});
export const db = drizzle(expo, { schema });

export async function runMigrations() {
  await migrate(db, migrations);
}
```

> `updatedAt`이 있는 레코드 편집 시 항상 `updatedAt: new Date()`를 명시적으로 포함.

> 로컬 DB 조회는 `useLiveQuery` 사용 → INSERT/UPDATE/DELETE 시 자동 리렌더링. `@tanstack/react-query`는 **Drive 백업·IAP에만** 사용.

### 3.2 프로필 기능 현황

| 기능                 | 상태    | DB 컬럼                             |
| -------------------- | ------- | ----------------------------------- |
| 관계 태그            | ✅      | `persons.tags` (JSON 문자열)        |
| 연락 주기            | ✅      | `persons.contactInterval` (일 단위) |
| 첫 만남 날짜         | ✅      | `persons.metAt`                     |
| 즐겨찾기/고정        | ✅      | `persons.isPinned`                  |
| 프로필 상세 타임라인 | ✅      | logPersons 조인                     |
| 통계 카드            | ✅      | PersonStatsCard.tsx                 |
| 이니셜 아바타        | ✅      | 이름 해시 기반 원형                 |
| 프로필 간 연결       | ❌ 폐기 | 오버엔지니어링                      |
| 감정 온도            | ❌ 폐기 | UX 마찰 > 가치                      |
| 이미지 아바타        | ❌ 폐기 | URI 관리 복잡도                     |

> `tags`: `JSON.parse` 크래시 방지를 위해 `utils/person.ts`의 `parseTags()` 사용 필수.

---

## 4. 핵심 기술 구현

### 4.1 Google Drive 백업

저장 즉시 Drive 호출 = API rate limit 초과 + 배터리 낭비.
**전략: 단일 최신 파일 덮어쓰기 + debounce 30초**

```
저장 이벤트 발생
  → 30초 debounce 타이머 시작
  → 타이머 만료 → Drive 최신 백업 파일 PATCH (덮어쓰기)
  → 앱 백그라운드 진입 시 → 즉시 강제 업로드
```

### 4.2 공유 기능 (서버 없는 암호화 내보내기)

서버 없이 공유: **암호화 JSON 파일 → 네이티브 Share Sheet**. (`services/shareExport.ts`)

### 4.3 PIN 비밀번호 잠금

- 6자리 숫자 PIN. 저장소: `expo-secure-store` (iOS Keychain / Android Keystore).
- `PinLockProvider` → 전역 `isLocked/isPinEnabled` 상태.
- 단계: enable(새PIN→확인), disable(현재PIN 검증), change(현재→새→확인).
- `isError` → `flashError()` → 700ms 후 에러 해제 + 핀 초기화.

---

## 5. UI 스택 방침

- **Gluestack UI v3 메인**: VStack, HStack, Card, Box 등 레이아웃 컴포넌트
- **NativeWind + cn() 보조**: className prop에 Tailwind 클래스
- **inline style 유지**: dynamic backgroundColor, elevation (Tailwind 표현 불가)
- plain View로 Gluestack 컴포넌트 교체 리팩터링 금지

---

## 6. 수익 모델

| 기능        | 무료       | 프리미엄           |
| ----------- | ---------- | ------------------ |
| 일정 등록   | 30개       | 무제한             |
| 프로필 등록 | 3명        | 무제한             |
| 백업        | 수동 (1회) | 자동 (주 1회)      |
| 테마        | 기본 1종   | 추가 테마          |
| 내보내기    | JSON만     | JSON + 암호화 공유 |

- SKU: `com.mylog.premium_lifetime`
- 가격대: ₩9,900 ~ ₩14,900

---

## 7. 리텐션 전략

| 기능                          | 설명                                          | 상태    |
| ----------------------------- | --------------------------------------------- | ------- |
| **잔디 히트맵**               | 연간 기록 밀도 시각화                         | ✅ 구현 |
| **통계**                      | 프로필 랭킹, 카테고리 비율, 스트릭, 완료율 등 | ✅ 구현 |
| **PIN 잠금**                  | 앱 보안                                       | ✅ 구현 |
| **오늘의 회상** (On This Day) | N년 전 오늘 기록된 일정/프로필 노출           | 미구현  |
| **생일/기념일 알림**          | 로컬 알림                                     | 미구현  |
| **홈 위젯**                   | 오늘 일정 또는 "N일만에 기록" 위젯            | 미구현  |

---

## 8. 개발 로드맵

### Phase 0 — 환경 설정 ✅

### Phase 1 — Core ✅

drizzle Schema + 마이그레이션 + Seed + 그룹/프로필/로그 CRUD + 캘린더 뷰

### Phase 2 — 모바일 UX 최적화 ✅

FAB, 스와이프 월 이동, MonthPicker, 반복 기능 Virtual Occurrences

### Phase 3 — 반복 완성 ✅

repeatUntil 날짜 선택, 단일/전체 편집 분기

### Phase 4 — 검색 ✅

logs + persons + memos + todos 통합 검색, 필터 칩, 프로필-기록 연결

### Phase 5 — 리스트 탭 ✅

체크박스, 기간 필터, 바텀시트 필터, 월별 섹션

### Phase 6 — 프로필 기념일 ✅

personAnniversaries 테이블, D-Day 계산, 프리셋 칩

### Phase 7 — UI/UX 고도화 ✅

리스트 탭 기간 프리셋 재설계, 캘린더 board 모드, MBTI/생년월일 입력

### Phase 8 — 스타일 통일 ✅

StyleSheet.create → className + cn() 전환 완료

### Phase 9 — 노트 탭 + 홈 탭 변경 ✅

메모/할일 서브탭, 아이젠하워 매트릭스, QuickInputBar, 홈 탭 최근 기록 피드

### Phase 10 — PIN 비밀번호 ✅

PinLockProvider, PinPad, LockScreen, settings/password.tsx

### Phase 11 — 통계 ✅

use-stats.ts (6개 훅), stats.tsx (요약/랭킹/연락/비율/스트릭/완료율/MBTI/동반 빈도)

### Phase 12 — 캘린더 탭 ✅

react-native-calendars 기반, multi-dot marking, 기념일 dot, 고정 5:5 분할 레이아웃

### Phase 13 — 리스트 탭 고도화 v2 ✅

MonthPickerModal 신규, 그룹 색상 인디케이터, 진행률 바, 섹션 완료율

### Phase 14 — 프로필 탭 고도화 ✅

마지막 연락 정렬, 연락 주기 초과 필터, 태그 동적 추출, 진행률 바, 핀 버튼

### Phase 15 — 노트 탭 개선 ✅

할일 필터 시트, 메모 생성일 표시, pinnedAt(memos), dueDate(todos), todos/[id].tsx

### Phase 16 — 버그 편집 및 코드 품질 ✅

tags JSON 크래시 편집, 리스트 탭 로그 누락, ensureGroupsColumns, FilterBottomSheet 공통화

### Phase Next — 미착수

- [ ] Freemium 제한 로직 (카운트 게이트)
- [ ] RN-IAP 결제 + 복원 플로우
- [ ] Google Drive 백업/복원
- [ ] 로컬 알림 (생일, 기념일) — `expo-notifications` 재설치 필요
- [ ] "오늘의 회상" 기능
- [ ] 관계 온도계 UI
- [ ] **Google Play Store 제출** (Android 우선)
- [ ] `importData` 트랜잭션 래핑 (`services/backup.ts`)
- [ ] `expandRepeatInMonth` O(1) 수학적 점프 (`utils/repeat.ts`)
- [ ] `useCalendarData` 쿼리 최적화 (`hooks/useCalendarData.ts`)
- [ ] `TabPreferencesProvider` SecureStore → AsyncStorage 교체

---

## 9. 리스크 레지스터

| #   | 리스크                                                           | 심각도       | 완화 방안                                                               |
| --- | ---------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------- |
| R1  | RN-IAP 네이티브 모듈 + Expo managed workflow 충돌                | High         | EAS Build + custom dev client 전환                                      |
| R2  | 서버 없는 IAP → 영수증 위조                                      | Medium       | 허용 리스크. 스토어 자체 검증으로 일반 사용자 방어                      |
| R3  | Google Drive App Data Folder 용량 제한 (10MB/app)                | Low          | 백업 파일 5개 FIFO 유지                                                 |
| R4  | drizzle 스키마 변경 시 마이그레이션 파일 미커밋 → 유저 DB 오동작 | High         | 스키마 변경 후 `drizzle-kit generate` 실행 및 `drizzle/` 폴더 커밋 필수 |
| R5  | react-native-worklets 의도적 제거 시 reanimated v4 오동작        | **Critical** | worklets는 reanimated v4 peer dep. **절대 제거 금지**                   |
| R6  | `persons.tags` JSON 파싱 크래시                                  | High         | `utils/person.ts`의 `parseTags()` 사용 필수. Phase 16에서 편집됨.       |
