# Supabase Setup Instructions

## Step 1: messages 테이블 생성

### 1. Supabase Dashboard 접속
1. https://supabase.com/dashboard 로그인
2. GymMatch 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭

### 2. SQL 실행
1. "New query" 버튼 클릭
2. `/supabase/migrations/20250110_create_messages.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기
4. **Run** 버튼 클릭 (Cmd + Enter)

### 3. 결과 확인
성공 시 표시되는 메시지:
```
Success. No rows returned
```

에러가 있으면 메시지 복사해서 Claude에게 전달

### 4. 테이블 확인
1. 좌측 메뉴에서 **Table Editor** 클릭
2. `messages` 테이블 확인
3. 컬럼 확인:
   - id (uuid, primary key)
   - match_id (uuid, foreign key)
   - sender_id (uuid, foreign key)
   - message (text)
   - created_at (timestamptz)
   - read_at (timestamptz, nullable)

---

## Step 2: RLS 정책 확인

### 1. RLS 활성화 확인
1. Table Editor → `messages` 테이블 클릭
2. 우측 상단 "..." 메뉴 → "Edit table"
3. "Enable Row Level Security" 체크 확인

### 2. 정책 확인
1. 좌측 메뉴에서 **Authentication** → **Policies** 클릭
2. `messages` 테이블 선택
3. 3개 정책 확인:
   - ✅ "Users can read messages in their matches" (SELECT)
   - ✅ "Users can send messages in their matches" (INSERT)
   - ✅ "Users can update read status" (UPDATE)

---

## Step 3: 테스트 데이터 삽입 (선택사항)

### 1. 기존 매칭 ID 확인
```sql
-- 현재 매칭 리스트 확인
SELECT
  m.id as match_id,
  p1.name as user1_name,
  p2.name as user2_name
FROM matches m
JOIN profiles p1 ON p1.user_id = m.user1_id
JOIN profiles p2 ON p2.user_id = m.user2_id;
```

### 2. 테스트 메시지 삽입
```sql
-- user1이 user2에게 메시지 보내기
INSERT INTO messages (match_id, sender_id, message)
VALUES (
  '[match_id]',  -- 위에서 확인한 match_id
  '[user1_id]',  -- user1의 user_id
  'Hey! Want to hit the gym tomorrow?'
);

-- user2가 user1에게 답장
INSERT INTO messages (match_id, sender_id, message)
VALUES (
  '[match_id]',
  '[user2_id]',  -- user2의 user_id
  'Sure! What time works for you?'
);
```

### 3. 메시지 조회 테스트
```sql
-- 특정 매칭의 모든 메시지 조회
SELECT
  m.id,
  m.message,
  m.created_at,
  p.name as sender_name
FROM messages m
JOIN profiles p ON p.user_id = m.sender_id
WHERE m.match_id = '[match_id]'
ORDER BY m.created_at ASC;
```

---

## Step 4: 함수 테스트

### 읽지 않은 메시지 카운트 확인
```sql
-- 특정 사용자의 읽지 않은 메시지 수
SELECT get_unread_message_count('[user_id]'::uuid);
```

---

## 문제 해결

### 에러: relation "messages" does not exist
**원인**: 테이블 생성 실패

**해결**:
1. SQL Editor에서 SQL 다시 실행
2. 에러 메시지 확인 후 Claude에게 전달

### 에러: permission denied for table messages
**원인**: RLS 정책 문제

**해결**:
1. Authentication → Policies 확인
2. 정책이 없으면 SQL 다시 실행

### 에러: insert or update on table "messages" violates foreign key constraint
**원인**: match_id 또는 sender_id가 존재하지 않음

**해결**:
1. match_id가 matches 테이블에 존재하는지 확인
2. sender_id가 profiles 테이블에 존재하는지 확인

---

## 다음 단계

✅ Step 1 완료 후:
- [ ] 테이블 생성 성공
- [ ] RLS 정책 3개 확인
- [ ] 테스트 메시지 삽입/조회 성공

→ **Step 2: Matches 리스트 페이지 구현**으로 이동

---

**작성일**: 2025-01-10
**작성자**: Claude + 박재현
