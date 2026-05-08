# Phase 1 체크리스트 ✅ DONE

## DB 기반 작업
- [x] drizzle.config.ts 생성
- [x] db/schema.ts — groups, persons, logs, logPersons
- [x] db/client.ts — SQLite + drizzle 초기화
- [x] db/seed.ts — 기본 그룹 3개 + "미설정" 그룹 (sortOrder:0) + REPEAT_OPTIONS export
- [x] 마이그레이션 파일 수동 생성 (drizzle-kit generate는 expo-crypto import 문제로 사용 불가)
- [x] utils/date.ts — dayjs 유틸

## 앱 구조
- [x] app/_layout.tsx — migrations + QueryClient + seed 호출 + GestureHandlerRootView
- [x] app/(tabs)/_layout.tsx — 탭 구조 (캘린더/인물/설정)
- [x] app/(tabs)/index.tsx — 캘린더 뷰
- [x] app/(tabs)/persons.tsx — 인물 목록
- [x] app/(tabs)/settings.tsx — 설정

## 그룹 CRUD
- [x] app/groups/new.tsx — 그룹 추가 모달
- [x] settings 탭에서 그룹 목록 + 삭제
- [x] 기본 그룹 삭제 방지 로직

## 인물 CRUD
- [x] app/persons/new.tsx — 인물 추가
- [x] app/persons/[id].tsx — 인물 상세/수정/삭제
- [x] components/persons/PersonCard.tsx — 카드 컴포넌트
- [x] 나이 표시: calcAge(birthDate)

## 일정(로그) CRUD
- [x] app/logs/new.tsx — 로그 추가
- [x] app/logs/[id].tsx — 로그 상세/수정/삭제
- [x] components/logs/LogCard.tsx — 카드 컴포넌트 (반복 배지 포함)
- [x] 반복 규칙 UI (없음/매일/매주/매월/매년)
- [x] logPersons N:M 연결 UI

## 캘린더 뷰
- [x] components/calendar/CalendarGrid.tsx — 월별 달력 직접 구현
- [x] 날짜 탭 시 해당 날짜 로그 목록

---

# Phase 2 체크리스트 — 모바일 UX 최적화 + 반복 기능 완성

## P0 — 버그 수정 (즉시)
- [x] 월 전환 시 selectedDate null로 리셋 → 월간 전체 뷰로 복귀
- [x] 반복 기능: Virtual Occurrences 렌더링 로직 구현 (캘린더에 반복 dot 표시)

## P1 — 모바일 UX 핵심
- [x] FAB (Floating Action Button) — 우측 하단, 기록 추가 / 인물 추가
- [x] 스와이프로 월 이동 (GestureDetector + Gesture.Pan)
- [x] 오늘로 돌아가기 버튼 (Today button)
- [x] logs/new.tsx — 그룹 첫 번째 자동 pre-select (useEffect)
- [x] persons/new.tsx — 그룹 첫 번째 자동 pre-select (useEffect)

## 실기기 피드백 반영 (2026-05-08)
- [x] 캘린더: 월 이동 시 selectedDate null → 월간 전체 뷰
- [x] 캘린더: 날짜 탭 → 선택, 재탭 → 전체 뷰 토글
- [x] 캘린더: 월간 전체 뷰에 날짜별 섹션 헤더 추가
- [x] 반복: repeatUntil null → 영구 반복 (monthEnd까지 계산)
- [x] 반복: 현재 월 내 시작한 반복 로그도 이후 occurrence 표시
- [x] 반복: "없음" 항목 추가 (기본값 "none", REPEAT_OPTIONS에 포함)
- [x] 스키마: logs.groupId nullable 변경 + migration 0001 수동 생성
- [x] 스키마: persons.groupId nullable 변경 + migration 0002 수동 생성
- [x] seed: "미설정" 그룹 추가 (sortOrder:0, gray #ADB5BD)
- [x] UI: 인물 탭 FAB 교체 (헤더 버튼 → 우측 하단 FAB)
- [x] 설정: 전체 데이터 초기화 버튼 (개발 도구 섹션)
- [x] 설정: 초기화 후 router.replace → UI 즉시 갱신
- [x] NativeWind 전환: 모든 화면/컴포넌트 StyleSheet → className

## P2 — UX 고도화
- [x] 년/월 타이틀 클릭 시 MonthPicker 모달 (Gluestack Modal → RN Modal로 교체, 즉시 닫힘 버그 수정)
- [x] 반복 기록 관리 — 설정 탭 내 "반복 관리" 섹션 (Gluestack Card/VStack/HStack)
- [x] Gluestack 우선 적용 방침 확립: VStack/HStack/Card/Modal → NativeWind className 보완

## 실기기 버그 수정 2차 (2026-05-09)
- [x] MonthPicker 모달 열렸다가 즉시 닫히는 버그 → RN Modal + 중첩 Pressable backdrop으로 교체
- [x] FAB 날짜 버그 — 다른 달 조회 시 항상 오늘 날짜로 기록 생성됨 → currentMonth 기준 첫날 사용
- [x] 6월 리스트에 5/8 원본 날짜 노출 → buildDaySections에 monthStart/monthEnd 범위 가드 추가
- [x] 전체 데이터 초기화 후 UI 미갱신 → router.replace 제거, useLiveQuery 반응성으로 처리
