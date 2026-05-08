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

## P3 — UX 개선 (2026-05-09)
- [x] 기록 추가/상세 상단 날짜 입력 영역 — DatePickerModal 컴포넌트 + CalendarGrid 재활용
- [x] 기록 상세 수정 모드에서도 날짜 변경 가능 (logDate DB 업데이트 포함)
- [x] 설정 탭 리스트형 리팩토링 — 그룹 관리/반복 관리 각각 별도 페이지로 분리
- [x] app/settings/groups.tsx — 그룹 목록 + FAB(→ /groups/new)
- [x] app/settings/repeats.tsx — 반복 로그 목록 + FAB(→ /logs/new) + 해제 기능
- [x] _layout.tsx에 settings/groups, settings/repeats Stack.Screen 등록
- [x] 인물 타임라인 — persons/[id].tsx에 이미 구현됨 (personLogs + "함께한 기록" 섹션)

---

# Phase 3 체크리스트 — 반복 완성

## 반복 기능 완성
- [x] logs/new.tsx: repeatUntil 날짜 선택 UI ("영구" / "종료일 지정" 토글 + DatePickerModal)
- [x] logs/[id].tsx: repeatUntil 수정 UI (수정 모드 동일 패턴)
- [ ] settings/repeats.tsx: 반복 로그에 종료일 표시 개선

## 반복 단일/전체 수정
- [x] index.tsx: repeat occurrence 탭 시 occurrenceDate param 포함 push (LogItem 타입 도입)
- [x] logs/[id].tsx: occurrenceDate param 수신 → isOccurrenceView 감지 + "🔄 반복 기록" 배너
- [x] "수정" 탭 → Alert ("이 날만 별도 기록" / "반복 전체 수정") 분기
- [x] copy mode: occurrenceDate 기준 새 단일 로그 INSERT + router.back

---

# Phase 4 체크리스트 — 표준 캘린더 기능

## 이벤트 시간 (선택)
- [ ] logs/new.tsx: 온종일(기본) / 시간 지정 토글 + HH:MM 입력 — logDate에 시:분 포함하여 저장
- [ ] logs/[id].tsx: 수정 모드 동일 패턴 + 뷰 모드에서 시간 표시
- [ ] LogCard: 시간 지정된 기록은 HH:MM 표시
- [ ] CalendarGrid: 시간 있는 기록은 dot 색상 구분 (선택)

## 검색
- [ ] app/search.tsx 신규 생성 — 제목/메모/인물명 full-text 검색
- [ ] (tabs)/_layout.tsx: 검색 탭 추가 또는 캘린더 헤더 돋보기 아이콘
- [ ] _layout.tsx: search Stack.Screen 등록

## 알림/리마인더
- [ ] migration 0003: logs 테이블에 reminder_type text 컬럼 추가 (null/"1h"/"1day"/"1week")
- [ ] logs/new.tsx + logs/[id].tsx: 리마인더 선택 UI
- [ ] app/_layout.tsx: expo-notifications 권한 요청 + 채널 설정
- [ ] utils/notification.ts: scheduleLogReminder / cancelLogReminder 유틸
- [ ] 기록 저장/수정 시 알림 스케줄링, 삭제 시 취소

## 생일 알림
- [ ] persons/new.tsx + persons/[id].tsx: 생일 알림 활성화 토글 (birthDate 있을 때)
- [ ] utils/notification.ts: scheduleBirthdayReminder 유틸
- [ ] 생일 있는 인물 저장 시 매년 알림 예약
- [ ] 캘린더: 생일 날짜에 🎂 마커 표시
