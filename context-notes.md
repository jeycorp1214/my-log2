# Context Notes — Phase 1

## 2026-05-07

### DB 설정
- expo-sqlite v16 (package.json 기준) — drizzle-orm/expo-sqlite 통합 사용
- drizzle.config.ts: dialect=sqlite, driver=expo, out=./drizzle
- db/client.ts: openDatabaseSync + enableChangeListener:true (useLiveQuery 지원)
- runMigrations() + seedDefaultGroups() → app/_layout.tsx에서 useEffect로 호출

### 탭 구조 결정
- 탭 3개: 캘린더(index), 인물(persons), 설정(settings)
- explore.tsx 제거 → persons.tsx, settings.tsx로 교체
- lucide-react-native 아이콘 사용 (이미 설치됨, IconSymbol은 iOS SF Symbols 전용)

### drizzle-kit generate 이슈
- expo driver용 config 필요: driver: "expo" 명시
- 생성된 drizzle/ 폴더 전체 git commit 필수 (R4 리스크)

### QueryClient 설정
- mutations: { retry: 1 } — Drive/IAP 뮤테이션용
- 로컬 DB는 useLiveQuery만 사용, react-query 불필요

---

## 2026-05-08 — 실기기 테스트 완료 / Phase 2 진입

### RN-IAP 제거
- react-native-iap 이 단계에서 개발/테스트 방해 → 의존성 제거
- 추후 결제 기능 필요 시 재도입 예정

### 실기기 테스트에서 발견된 버그
1. **월 전환 시 selectedDate 불일치**: currentMonth 바뀌어도 selectedDate 유지됨
   - 예) 5월에서 6월로 이동해도 "5월 15일" 선택 상태 유지 → 로그 리스트 빈 화면
   - 수정: nextMonth/prevMonth 호출 시 selectedDate를 해당 월 1일로 리셋
2. **반복 기능 미작동**: DB에 repeatType 저장은 되나, 캘린더 렌더링 시 반복 occurrence 생성 로직 없음
   - 현재 쿼리: `between(logs.logDate, monthStart, monthEnd)` → 원본 logDate만 히트

### 반복 기능 아키텍처 결정 — Virtual Occurrences 채택
- **Virtual (Runtime Expansion)**: DB에 원본 1개 저장, 렌더 시 반복 날짜를 메모리에서 계산
  - 장점: DB 단순, 전체 수정 쉬움
  - 단점: "이 이벤트만" 개별 수정 불가, repeatUntil 없으면 무한 계산
- **Materialized**: 반복마다 DB 레코드 생성
  - 장점: 개별 occurrence 수정/삭제 가능, 쿼리 단순
  - 단점: DB 비대화, 일괄 수정 복잡
- **결정**: Virtual 방식 채택. repeatUntil 최대 2년 제한 강제. 개별 occurrence 수정은 Phase 3 이후 고려.

### UX 우선순위 결정
- P0 버그: 월 전환 selectedDate 리셋, 반복 렌더링
- P1 핵심: FAB, 스와이프, 오늘 버튼, 그룹 선택 → 선택사항
- P2 고도화: 년/월 피커, 반복 관리 (설정 탭 내 섹션)
- 반복 전용 탭 제안 → 설정 탭 내 "반복 관리" 섹션으로 대체 결정 (탭 추가는 IA 복잡도 증가)
