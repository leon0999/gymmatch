# 🚀 GymMatch 빠른 테스트 가이드

## ⚡️ 5분 만에 핵심 기능 테스트하기

### 준비 단계 (1분)

```bash
# 1. 개발 서버 실행 (이미 실행 중이면 Skip)
npm run dev

# 2. 브라우저 열기
# http://localhost:3000
```

### 단계별 테스트 (4분)

#### ✅ Step 1: 회원가입 (30초)
```
1. http://localhost:3000 접속
2. Get Started 클릭
3. test1@example.com / password123 입력
4. Sign Up 클릭

기대: /onboarding으로 이동
```

#### ✅ Step 2: 온보딩 완료 (1분)
```
Step 1:
- 이름: 테스터1
- 나이: 28
- 성별: Male
→ Next

Step 2:
- 위치: Seoul
- 체육관: FitLife Gym
→ Next

Step 3:
- Level: Beginner
- Goals: Build Muscle, Get Toned 선택
- Styles: Weightlifting, Cardio 선택
→ Next

Step 4:
- Partner: Female
- Age: 25-35
- Distance: 10km
→ Complete

기대: /discover로 이동
```

#### ✅ Step 3: 두 번째 계정 생성 (1분)
```
1. 새 시크릿 창 열기 (Cmd+Shift+N)
2. http://localhost:3000 접속
3. test2@example.com / password123 가입
4. 온보딩:
   - 이름: 테스터2
   - 나이: 26
   - 성별: Female
   - Level: Intermediate
   - Goals: Get Toned
   - Partner: Male
   - Age: 25-35
```

#### ✅ Step 4: 매칭 테스트 (30초)
```
계정 A (test1):
1. Discover에서 "테스터2" 프로필 찾기
2. ❤️ Like 클릭

계정 B (test2):
1. Discover에서 "테스터1" 프로필 찾기
2. ❤️ Like 클릭

기대: "It's a Match!" Modal 팝업
```

#### ✅ Step 5: 사진 업로드 테스트 (1분) ⭐️ 핵심!
```
계정 A (test1):
1. /matches 이동
2. "테스터2" 클릭
3. "Start Photo Session" 클릭
4. 사진 선택 (테스트 이미지)
5. Workout Type: Chest 선택
6. Share 클릭

기대:
- "Photo uploaded successfully!" 알림
- /feed로 이동
- 피드에 사진 표시
```

#### ✅ Step 6: 소셜 기능 테스트 (30초)
```
계정 B (test2):
1. /feed 접속
2. 방금 올라온 사진 확인
3. ❤️ Like 클릭
4. 💬 Comment 클릭
5. "Great workout! 💪" 입력
6. Post 클릭

기대:
- Likes count +1
- Comments count +1
- 댓글 즉시 표시
```

#### ✅ Step 7: 알림 확인 (30초)
```
계정 A (test1):
1. BottomNav에서 Notifications 확인
2. 빨간 배지 "2" 표시 확인
3. Notifications 클릭
4. 알림 2개 확인:
   - "테스터2 liked your workout photo"
   - "테스터2 commented: Great workout! 💪"

기대:
- 알림 정상 표시
- 배지 "0"으로 변경
```

---

## 🔍 빠른 버그 체크

### 즉시 확인해야 할 3가지

#### 1. 사진 업로드 가능한지?
```bash
# Supabase Dashboard에서 확인
# Storage > workout-photos 버킷 존재하는지
# Policy: public read 설정되어 있는지

만약 403 에러:
→ Supabase Dashboard > Storage > Create bucket
→ Name: workout-photos
→ Public: true
```

#### 2. 본인 사진 업로드 차단되는지?
```javascript
// Browser Console에서 테스트
fetch('/api/posts/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'YOUR_USER_ID',        // 본인 ID
    photographerId: 'YOUR_USER_ID', // 본인 ID (똑같이)
    matchId: 'ANY_MATCH_ID',
    mediaType: 'photo',
    mediaUrl: 'test.jpg'
  })
})

기대: "Forbidden: You cannot photograph yourself" 에러
실패 시: 보안 취약점! 즉시 수정 필요
```

#### 3. 알림 배지 작동하는지?
```
1. 계정 A에서 로그인
2. 계정 B가 계정 A의 사진에 좋아요
3. 계정 A 새로고침
4. BottomNav > Notifications 아이콘 확인

기대: 빨간 배지 "1" 표시
실패 시: /api/notifications/unread-count 확인
```

---

## 🐛 자주 발생하는 에러 & 해결법

### Error 1: "Could not load profile"
```
원인: profiles 테이블에 데이터 없음

해결:
1. Supabase Dashboard > Table Editor > profiles 확인
2. 온보딩 다시 진행
3. RLS 정책 확인 (authenticated users can insert own profile)
```

### Error 2: "403 Forbidden" (사진 업로드)
```
원인: Supabase Storage 권한 설정 오류

해결:
1. Supabase Dashboard > Storage
2. workout-photos 버킷 클릭
3. Policies 탭
4. "Enable access to all authenticated users" 클릭
또는
5. Custom policy 추가:
   - Policy name: "Authenticated users can upload"
   - Target roles: authenticated
   - Operation: INSERT
   - Policy definition: true
```

### Error 3: "No matches found"
```
원인: 필터 조건이 너무 엄격하거나 데이터 부족

해결:
1. Discover 페이지에서 Filter 클릭
2. Reset 클릭
3. 또는 더 많은 테스트 계정 생성
```

### Error 4: 알림 배지 안 뜸
```
원인: /api/notifications/unread-count API 에러

해결:
1. Browser Console 확인
2. Network 탭에서 API 응답 확인
3. Supabase Dashboard > notifications 테이블 확인
```

### Error 5: "It's a Match!" Modal 안 뜸
```
원인: matches 테이블 insert 실패

해결:
1. Supabase Dashboard > matches 테이블 확인
2. 양쪽 사용자가 서로 Like 했는지 확인
3. RLS 정책 확인
```

---

## 📊 테스트 결과 체크리스트

### 최소한 이것만 확인하면 출시 가능

- [ ] 회원가입 → 온보딩 완료
- [ ] 2개 계정으로 매칭 성공
- [ ] 사진 업로드 성공
- [ ] 피드에서 사진 보임
- [ ] 좋아요 작동
- [ ] 댓글 작동
- [ ] 알림 배지 작동
- [ ] 본인 사진 업로드 차단됨 (보안!)

### 모두 체크되면 🎉 출시 준비 완료!

---

## 🚨 긴급 상황 대응

### 만약 모든 게 안 된다면?

#### 1단계: 개발 서버 재시작
```bash
# Ctrl+C로 서버 종료
npm run dev
```

#### 2단계: 데이터베이스 마이그레이션 확인
```bash
# Supabase Dashboard > SQL Editor
# /supabase/migrations/20250112_social_feed_system.sql 실행

# 또는 Supabase CLI
supabase db push
```

#### 3단계: 환경 변수 확인
```bash
# .env.local 파일 확인
cat .env.local

# 필수 변수:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

#### 4단계: 브라우저 캐시 삭제
```
1. Chrome DevTools (F12)
2. Application 탭
3. Clear storage
4. Clear site data
5. 새로고침
```

#### 5단계: 나에게 연락
```
에러 메시지와 함께:
- Browser Console 스크린샷
- Network 탭 스크린샷
- 재현 방법
```

---

## 📱 모바일 테스트 (선택사항)

### iPhone/Android 실기기에서 테스트

```bash
# 1. 로컬 네트워크에서 접속 가능하게 설정
# package.json의 dev script 수정:
"dev": "next dev -H 0.0.0.0"

# 2. 내 컴퓨터 IP 확인
# Mac: ifconfig | grep inet
# 예: 192.168.0.100

# 3. 모바일 브라우저에서 접속
# http://192.168.0.100:3000
```

### 모바일에서 확인할 것
```
- [ ] 화면 잘림 없음
- [ ] 버튼 터치 가능
- [ ] 사진 업로드 가능
- [ ] BottomNav 제스처 바 위에 표시
- [ ] 세로/가로 모두 정상
```

---

## 🎯 다음 단계

### 테스트 완료 후
```
1. TESTING_CHECKLIST.md에 결과 기록
2. 발견된 버그 수정
3. 다시 테스트
4. 모든 체크 완료되면 → 출시!
```

### 출시 전 최종 확인
```
- [ ] 프로덕션 환경 변수 설정
- [ ] Supabase 프로덕션 DB 마이그레이션
- [ ] Vercel 배포 설정
- [ ] 도메인 연결
- [ ] SSL 인증서 확인
```

---

**테스트 시작 전에 이 가이드를 출력하거나 옆에 띄워두고 하나씩 체크하세요!**

**문제 발생 시 당황하지 말고 "자주 발생하는 에러 & 해결법" 섹션을 참고하세요.**

**Happy Testing! 🚀**
