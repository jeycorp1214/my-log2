# 연락처 가져오기 기능 계획 (v2)

## 개요

`expo-contacts`로 기기 연락처를 읽어 persons 테이블에 초기 데이터 일괄 적재.
이름/생일/전화/이메일/메모/기념일 가져옴. 이미지 제외.

---

## 필드 매핑

| expo-contacts 필드                     | 목적지                 | 비고                              |
| -------------------------------------- | ---------------------- | --------------------------------- |
| `displayName` / `firstName + lastName` | `persons.name`         | 기존 컬럼                         |
| `birthday`                             | `persons.birth_date`   | 기존 컬럼, YYYY-MM-DD 변환        |
| `phoneNumbers[0].number`               | `persons.phone`        | **신규 컬럼** (마이그레이션 필요) |
| `emails[0].email`                      | `persons.email`        | **신규 컬럼** (마이그레이션 필요) |
| `note`                                 | `persons.memo`         | 기존 컬럼                         |
| `dates[]` (기념일 등)                  | `person_anniversaries` | 기존 테이블, isRepeat: true       |

> 전화번호/이메일 여러 개인 경우 첫 번째 항목만 가져옴.

### dates 라벨 처리

expo-contacts `dates` 항목의 label 값 → anniversary title 매핑.

| label 값        | 저장할 title                                   |
| --------------- | ---------------------------------------------- |
| `"anniversary"` | `"기념일"`                                     |
| `"birthday"`    | `"생일"` (birthday 필드와 별개로 있을 수 있음) |
| 기타 / 커스텀   | 원본 label 그대로                              |

연도 없는 날짜 (year === undefined) → 현재 연도로 채움, isRepeat: true.

---

## 스키마 변경 (마이그레이션)

`db/schema.ts` — persons 테이블에 컬럼 2개 추가.

```ts
phone: text("phone"),
email: text("email"),
```

Drizzle 마이그레이션 파일 신규 생성 필요 (`drizzle/` 폴더, 기존 번호 이어서).
`DatabaseProvider.tsx`에서 마이그레이션 배열에 추가.

---

## 구현 계획

### 0단계 — 스키마 마이그레이션

- `db/schema.ts` persons에 `phone`, `email` 추가
- `drizzle/` 신규 마이그레이션 SQL 생성
- `DatabaseProvider.tsx` 마이그레이션 배열 등록

### 1단계 — 훅

**신규: `hooks/use-contacts-import.ts`**

```ts
// 권한 요청
Contacts.requestPermissionsAsync()

// 연락처 조회 (필요한 필드만)
Contacts.getContactsAsync({
  fields: [
    Contacts.Fields.Name,
    Contacts.Fields.Birthday,
    Contacts.Fields.PhoneNumbers,
    Contacts.Fields.Emails,
    Contacts.Fields.Note,
    Contacts.Fields.Dates,
  ],
})

// 삽입 함수
async function importContacts(selected: Contact[], groupId: number) {
  for (const c of selected) {
    const [person] = await db.insert(persons).values({ ... }).returning();

    const anniversaries = buildAnniversaries(c, person.id);
    if (anniversaries.length > 0) {
      await db.insert(personAnniversaries).values(anniversaries);
    }
  }
}
```

### 2단계 — 선택 모달

**신규: `app/contacts-import.tsx`** (Stack 모달)

- FlatList: 기기 연락처 이름 가나다 정렬
- 상단 검색바 (실시간 필터)
- 체크박스 다중 선택
- 하단 고정: 그룹 선택 Picker + "N명 가져오기" 버튼

### 3단계 — 진입점

`app/(tabs)/persons.tsx` 헤더 우측에 아이콘 버튼 추가.
탭 → `router.push("/contacts-import")`.

`app/_layout.tsx` Stack에 `contacts-import` 경로 등록.

---

## 중복 처리

체크 없이 전부 삽입. 유저가 앱 내에서 직접 정리.

---

## 파일 목록

| 파일                               | 신규/수정                     |
| ---------------------------------- | ----------------------------- |
| `db/schema.ts`                     | 수정 — phone, email 컬럼 추가 |
| `drizzle/XXXX_add_phone_email.sql` | 신규 — 마이그레이션           |
| `DatabaseProvider.tsx`             | 수정 — 마이그레이션 등록      |
| `hooks/use-contacts-import.ts`     | 신규                          |
| `app/contacts-import.tsx`          | 신규                          |
| `app/_layout.tsx`                  | 수정 — 라우트 등록            |
| `app/(tabs)/persons.tsx`           | 수정 — 헤더 버튼              |

---

## 체크리스트

- [ ] `db/schema.ts` — phone, email 컬럼 추가
- [ ] 마이그레이션 SQL 생성 & DatabaseProvider 등록
- [ ] `hooks/use-contacts-import.ts` — 권한, 조회, importContacts, buildAnniversaries
- [ ] `app/contacts-import.tsx` — 선택 모달 UI
- [ ] `app/_layout.tsx` — 라우트 등록
- [ ] `app/(tabs)/persons.tsx` — 헤더 진입 버튼
- [ ] 권한 거부 시 안내 처리
- [ ] 완료 토스트 ("N명 추가됨")
- [ ] 실기기 테스트 (iOS/Android 권한 흐름 각각)
