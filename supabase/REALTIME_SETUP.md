# Supabase Realtime Setup for GymMatch

## Step 1: Enable Realtime for messages table

### 1. Supabase Dashboard 접속
1. https://supabase.com/dashboard 로그인
2. GymMatch 프로젝트 선택
3. 좌측 메뉴에서 **Database** → **Replication** 클릭

### 2. messages 테이블 Realtime 활성화
1. "Replication" 페이지에서 `messages` 테이블 찾기
2. `messages` 행의 오른쪽에 있는 토글 스위치 클릭
3. "Enable replication for this table?" → **Enable** 버튼 클릭
4. 상태가 "Enabled"로 변경되는지 확인

## Step 2: 테스트 방법

### 1. 두 개의 브라우저 창 열기
```
창 1: http://localhost:3000 (alex 계정 로그인)
창 2: Chrome 시크릿 모드 (mike 계정 로그인)
```

### 2. 테스트 시나리오
1. 창 1 (alex): `/matches` → mike 클릭 → 채팅 페이지 진입
2. 창 2 (mike): `/matches` → alex 클릭 → 채팅 페이지 진입
3. 창 1 (alex): "Hey Mike!" 메시지 전송
4. ✅ 창 2 (mike): 자동으로 "Hey Mike!" 메시지 표시됨 (새로고침 없이!)
5. 창 2 (mike): "Hi Alex!" 메시지 전송
6. ✅ 창 1 (alex): 자동으로 "Hi Alex!" 메시지 표시됨

### 3. 개발자 도구 확인
- F12 → Console 탭
- 다음 로그 확인:
  ```
  Subscribed to realtime messages for match: [match_id]
  New message received: { new: { ... } }
  ```

## Step 3: 문제 해결

### 에러: Realtime 연결 실패
**증상**: 메시지가 실시간으로 업데이트되지 않음

**확인사항**:
1. Database → Replication에서 `messages` 테이블이 Enabled 상태인지 확인
2. Console에 "Subscribed to realtime messages" 로그가 있는지 확인
3. 네트워크 탭에서 WebSocket 연결 확인

**해결**:
```typescript
// src/lib/supabase.ts에서 realtime 옵션 확인
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

### 에러: 중복 메시지
**증상**: 자신이 보낸 메시지가 2번 나타남

**원인**: Realtime subscription + 수동 reload

**해결**: ✅ 이미 수정됨 (handleSendMessage에서 loadMessages() 제거)

### 에러: 메시지 순서 뒤바뀜
**증상**: 메시지가 시간 순서대로 표시되지 않음

**원인**: Realtime으로 받은 메시지의 created_at이 클라이언트 타임존과 다름

**해결**: 메시지를 정렬하여 추가
```typescript
setMessages((prev) => {
  const updated = [...prev, newMsg];
  return updated.sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
});
```

## Step 4: 성능 최적화

### 연결 상태 표시
```typescript
const [isConnected, setIsConnected] = useState(false);

channel
  .on('system', {}, (payload) => {
    if (payload.status === 'ok') {
      setIsConnected(true);
    }
  })
```

### 재연결 로직
```typescript
channel
  .on('system', { event: 'error' }, () => {
    console.error('Realtime connection error');
    setIsConnected(false);
  })
  .on('system', { event: 'reconnect' }, () => {
    console.log('Realtime reconnected');
    setIsConnected(true);
  })
```

## 완료 체크리스트

- [ ] Supabase Replication에서 messages 테이블 활성화
- [ ] 두 개의 브라우저로 실시간 메시지 전송 테스트
- [ ] Console에서 subscription 로그 확인
- [ ] 메시지가 새로고침 없이 자동으로 표시되는지 확인
- [ ] 자신이 보낸 메시지도 정상적으로 표시되는지 확인

---

**작성일**: 2025-01-10
**작성자**: Claude + 박재현
