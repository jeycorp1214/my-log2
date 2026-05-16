---
name: project-ensurecolumns-safety-net
description: db/client.ts의 ensureColumns는 drizzle 마이그레이터 실패 시 후행 추가 컬럼을 ALTER로 보강하는 안전망인데 groups 테이블이 누락됨
metadata:
  type: project
---

`db/client.ts`의 `ensureColumns` 패턴은 drizzle 마이그레이터가 실패한 구버전 DB에서 나중에 추가된 컬럼을 `ALTER TABLE`로 보강하는 안전망이다. 현재 `persons`/`todos`/`memos`만 등록돼 있고 `groups`는 빠져 있다.

**Why:** 안전망의 전제는 "스키마에 후행 추가된 모든 컬럼을 빠짐없이 등록"하는 것. 하나라도 빠지면 그 컬럼을 참조하는 쿼리가 구버전 DB에서 깨진다. groups에는 sort_order/emoji/is_default가 후행 추가로 보이며, persons.tsx·list.tsx가 `orderBy(groups.sortOrder)`를 쓴다.

**How to apply:** schema.ts에 컬럼을 추가하거나 ensureColumns를 리뷰할 때, 새 컬럼이 ensure 함수에도 등록됐는지 반드시 교차 확인. 특히 `orderBy`/`where`에 쓰이는 컬럼은 누락 시 화이트스크린 직결. personAnniversaries처럼 나중에 추가된 테이블은 PRAGMA 존재 확인 후 CREATE 안전망도 검토 대상. 관련: [[project-repeattype-dual-representation]]
