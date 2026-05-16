---
name: project-repeattype-dual-representation
description: logs.repeatType이 "반복 없음"을 NULL과 'none' 문자열 두 가지로 저장하는 데이터 모델 함정 — 쿼리 작성 시 항상 양쪽 고려
metadata:
  type: project
---

`logs.repeatType` 컬럼은 "반복 없음"을 **두 가지 값**으로 표현한다: `NULL`(app/logs/new.tsx의 신규 저장 경로, `undefined`→NULL)과 `'none'` 문자열(app/logs/[id].tsx의 편집 경로 및 state 초기값).

**Why:** 신규/편집 저장 경로가 정규화되지 않았고, 일부 데이터가 'none' 문자열로 DB에 남는다. local-first 앱이라 구버전 데이터 마이그레이션이 ensureColumns 안전망에만 의존.

**How to apply:** logs를 "일반 로그 vs 반복 로그"로 분기하는 쿼리/필터를 작성하거나 리뷰할 때, `isNull(repeatType)`만 검사하면 'none' 문자열 로그가 일반 목록에서도 반복 목록에서도 빠져 사용자 눈에서 사라진다. 항상 `or(isNull(repeatType), eq(repeatType,'none'))` 형태로 양쪽 처리할 것. useCalendarData는 `ne(repeatType,'none')`로 방어하지만 use-event-filter는 방어 안 함 — 두 곳의 일관성을 확인. 근본 해결은 저장 경로 정규화 + 일회성 데이터 정리. 관련: [[project-ensurecolumns-safety-net]]
