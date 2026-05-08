# Phase 1 체크리스트 ✅ DONE

## DB 기반 작업
- [x] drizzle.config.ts 생성
- [x] db/schema.ts — groups, persons, logs, logPersons
- [x] db/client.ts — SQLite + drizzle 초기화
- [x] db/seed.ts — 기본 그룹 3개
- [x] npx drizzle-kit generate — 마이그레이션 파일 생성
- [x] utils/date.ts — dayjs 유틸

## 앱 구조
- [x] app/_layout.tsx — migrations + QueryClient + seed 호출
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
- [x] components/logs/LogCard.tsx — 카드 컴포넌트
- [x] 반복 규칙 UI (none/daily/weekly/monthly/yearly)
- [x] logPersons N:M 연결 UI

## 캘린더 뷰
- [x] components/calendar/CalendarGrid.tsx — 월별 달력 직접 구현
- [x] 날짜 탭 시 해당 날짜 로그 목록

---

# Phase 2 체크리스트 — 모바일 UX 최적화 + 반복 기능 완성

## P0 — 버그 수정 (즉시)
- [x] 월 전환 시 selectedDate 자동 리셋 → 해당 월 1일로 변경
- [x] 반복 기능: Virtual Occurrences 렌더링 로직 구현 (캘린더에 반복 dot 표시)

## P1 — 모바일 UX 핵심
- [x] FAB (Floating Action Button) — 우측 하단, 기록 추가
- [x] 스와이프로 월 이동 (GestureDetector + Gesture.Pan)
- [x] 오늘로 돌아가기 버튼 (Today button)
- [x] 그룹 선택 → 자동 pre-select 첫 번째 그룹, 필수 검증 제거

## P2 — UX 고도화
- [ ] 년/월 타이틀 클릭 시 MonthPicker 모달
- [ ] 반복 기록 관리 — 설정 탭 내 "반복 관리" 섹션 (별도 탭 대신)
- [ ] LogCard에 반복 뱃지 표시 (repeatType != null 시)
