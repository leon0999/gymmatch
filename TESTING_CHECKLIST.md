# 🧪 GymMatch MVP 출시 전 테스트 체크리스트

## 📋 테스트 준비

### 1. 환경 설정 확인
```bash
# 1. Supabase 데이터베이스 마이그레이션 실행
# Supabase Dashboard > SQL Editor에서 실행:
# /supabase/migrations/20250112_social_feed_system.sql

# 2. Supabase Storage 버킷 생성
# - profile-photos (public)
# - workout-photos (public)
# - workout-videos (public)

# 3. 환경 변수 확인 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. 테스트 계정 생성
- **User A**: 테스터1 (남성, 초급, Chest/Back 선호)
- **User B**: 테스터2 (여성, 중급, Legs/Core 선호)
- **User C**: 테스터3 (남성, 고급, Arms/Shoulders 선호)

---

## 🔥 핵심 기능 테스트 (Critical Path)

### Phase 1: 회원가입 & 온보딩
**목표**: 사용자가 처음 가입해서 프로필을 완성하는 흐름

#### Test 1.1: 회원가입
```
1. / 접속
2. "Get Started" 클릭
3. 이메일/비밀번호 입력 (예: test1@example.com / password123)
4. Sign Up 클릭

✅ 예상 결과: /onboarding으로 리다이렉트
❌ 실패 시나리오:
   - 이미 존재하는 이메일
   - 비밀번호 6자 미만
   - Supabase 연결 실패
```

#### Test 1.2: 온보딩 (단계별)
```
Step 1: 기본 정보
1. 이름 입력: "테스터1"
2. 나이 입력: 28
3. 성별 선택: Male
4. Next 클릭

✅ 예상 결과: Step 2로 이동
❌ 실패 시나리오:
   - 이름 빈칸
   - 나이 18세 미만
   - 성별 미선택

Step 2: 위치 & 체육관
1. 위치 검색: "Seoul"
2. 체육관 입력: "FitLife Gym Gangnam"
3. Next 클릭

✅ 예상 결과: Step 3으로 이동

Step 3: 피트니스 정보
1. Fitness Level: Beginner 선택
2. Goals: "Build Muscle", "Get Toned" 선택
3. Workout Styles: "Weightlifting", "Cardio" 선택
4. Next 클릭

✅ 예상 결과: Step 4로 이동

Step 4: 매칭 선호도
1. Partner Gender: Female 선택
2. Age Range: 25-35 슬라이더 조정
3. Max Distance: 10km 선택
4. Complete 클릭

✅ 예상 결과: /discover로 리다이렉트
❌ 실패 시나리오:
   - profiles 테이블 insert 실패
   - RLS 정책 오류
```

---

### Phase 2: 매칭 & 매치 생성
**목표**: 사용자가 파트너를 발견하고 매칭되는 흐름

#### Test 2.1: Discover 페이지
```
1. /discover 접속
2. 첫 번째 프로필 확인
   - 이름, 나이, 사진 표시되는지
   - 매치 점수 표시되는지
   - "Why you might match" 이유 표시되는지

✅ 예상 결과: 프로필 카드 정상 표시
❌ 실패 시나리오:
   - "No matches found" (데이터 없음)
   - 프로필 이미지 깨짐
   - 매치 이유 빈칸
```

#### Test 2.2: 필터 기능
```
1. Filter 아이콘 클릭
2. Workout Parts: "Chest", "Back" 선택
3. Strength Level: "Beginner" 선택
4. Age Range: 25-30 입력
5. Apply Filters 클릭

✅ 예상 결과:
   - 필터 조건에 맞는 프로필만 표시
   - 필터 배지에 "3" 표시
❌ 실패 시나리오:
   - 필터 적용 안 됨
   - "No matches found" (너무 엄격한 필터)
```

#### Test 2.3: Like & Match 생성
```
사전 준비: User B로 User A를 Like 해둠

1. User A로 로그인
2. User B 프로필에서 ❤️ (Like) 클릭

✅ 예상 결과:
   - Match Modal 팝업 ("It's a Match!")
   - User B 사진 표시
   - "Message [Name]" 버튼 표시
❌ 실패 시나리오:
   - matches 테이블 insert 실패
   - Modal 안 뜸
   - swipes 테이블 중복 키 에러
```

#### Test 2.4: Pass
```
1. 프로필에서 ✕ (Pass) 클릭

✅ 예상 결과:
   - 다음 프로필로 이동
   - swipes 테이블에 liked=false 저장
❌ 실패 시나리오:
   - 다음 프로필 안 넘어감
   - 같은 프로필 다시 나타남
```

---

### Phase 3: 사진 촬영 & 업로드 (핵심!)
**목표**: 파트너가 서로의 운동 사진을 촬영하고 업로드

#### Test 3.1: Photo Session 접근
```
1. /matches 접속
2. 매치된 파트너 선택
3. "Start Photo Session" 버튼 클릭

✅ 예상 결과: /matches/[matchId]/photo-session으로 이동
❌ 실패 시나리오:
   - 버튼이 없음
   - 404 에러
   - matchId가 null
```

#### Test 3.2: 사진 촬영 & 업로드
```
1. Photo Session 페이지에서 카메라 아이콘 클릭
2. 파일 선택 (또는 카메라 촬영)
3. 사진 선택: workout.jpg (< 10MB)
4. Workout Type: "Chest" 선택
5. Exercise Name: "Bench Press" 입력
6. Caption: "Great workout today! 💪" 입력
7. "Share" 버튼 클릭

✅ 예상 결과:
   - 업로드 중... 표시
   - "Photo uploaded successfully!" 알림
   - /feed로 리다이렉트
   - 피드에 방금 올린 사진 표시
❌ 실패 시나리오:
   - Supabase Storage 업로드 실패
   - posts 테이블 insert 실패
   - RLS 정책 위반 (본인 사진 올리려고 시도)
   - 10MB 초과 파일
```

#### Test 3.3: 보안 검증 (중요!)
```
시나리오 1: 본인 사진 업로드 시도
1. Photo Session에서 userId를 본인 ID로 변경 시도
2. 업로드 클릭

✅ 예상 결과: "Forbidden: You cannot photograph yourself" 에러
❌ 실패 시: 보안 취약점!

시나리오 2: 매치되지 않은 사람 사진 업로드 시도
1. matchId를 임의의 값으로 변경
2. 업로드 클릭

✅ 예상 결과: "Forbidden: Users must be matched partners" 에러
❌ 실패 시: 보안 취약점!
```

---

### Phase 4: 피드 & 소셜 기능
**목표**: 사용자가 피드에서 사진을 보고 좋아요/댓글 달기

#### Test 4.1: 홈 피드 확인
```
1. /feed 접속 (또는 BottomNav에서 Home 클릭)
2. 포스트 카드 확인
   - 사진/동영상 표시
   - "Photographer photographed Subject" 문구
   - Workout Type 표시
   - Likes count, Comments count
   - Timestamp

✅ 예상 결과: 모든 포스트 정상 표시
❌ 실패 시나리오:
   - "No posts yet" (데이터 없음)
   - 이미지 깨짐
   - Photographer 정보 null
```

#### Test 4.2: 좋아요 기능
```
1. 포스트 카드에서 ❤️ 아이콘 클릭

✅ 예상 결과:
   - 하트 빨간색으로 변경
   - Likes count +1
   - post_likes 테이블에 저장
   - Subject에게 알림 생성
❌ 실패 시나리오:
   - 하트 색 안 변함
   - Likes count 안 올라감
   - 중복 좋아요 가능 (버그)
```

#### Test 4.3: 좋아요 취소
```
1. 좋아요한 포스트에서 ❤️ 다시 클릭

✅ 예상 결과:
   - 하트 회색으로 변경
   - Likes count -1
   - post_likes 테이블에서 삭제
❌ 실패 시나리오:
   - Likes count 음수
   - 트리거 작동 안 함
```

#### Test 4.4: 댓글 작성
```
1. 포스트 카드에서 💬 아이콘 클릭
2. Comment Section 확장
3. "Great form! 👍" 입력
4. "Post" 버튼 클릭

✅ 예상 결과:
   - 댓글 즉시 표시
   - Comments count +1
   - post_comments 테이블에 저장
   - Subject에게 알림 생성
❌ 실패 시나리오:
   - 댓글 안 나타남
   - 빈 댓글 전송 가능
   - Comments count 안 올라감
```

#### Test 4.5: 댓글 삭제
```
1. 내가 작성한 댓글에서 🗑️ 아이콘 클릭
2. 확인 팝업에서 "Delete" 클릭

✅ 예상 결과:
   - 댓글 즉시 삭제
   - Comments count -1
❌ 실패 시나리오:
   - 다른 사람 댓글 삭제 가능 (버그)
   - Comments count 안 내려감
```

---

### Phase 5: 프로필 & Grid
**목표**: 사용자가 자신의 프로필과 사진 그리드를 확인

#### Test 5.1: 프로필 페이지
```
1. BottomNav에서 Profile 클릭
2. 프로필 정보 확인
   - 이름, 나이, 위치, 체육관
   - Bio
   - Fitness Level, Goals, Workout Styles
   - Match Preferences

✅ 예상 결과: 모든 정보 정상 표시
```

#### Test 5.2: 프로필 Grid
```
1. 프로필 페이지 하단 "Workout Photos" 섹션 확인
2. 3x3 Grid 형태로 사진 표시되는지 확인
3. 사진 클릭 → Modal 팝업
4. Modal에서 사진 확대, 정보 확인

✅ 예상 결과:
   - Grid 정상 표시
   - Hover 시 likes/comments count 표시
   - Modal 정상 작동
❌ 실패 시나리오:
   - Grid 깨짐
   - Modal 안 뜸
   - 이미지 로딩 실패
```

#### Test 5.3: 프로필 편집
```
1. "Edit Profile" 버튼 클릭
2. 이름 수정: "테스터1 Updated"
3. Bio 추가: "Fitness enthusiast 💪"
4. Goals 추가: "Improve Endurance"
5. "Save Changes" 클릭

✅ 예상 결과:
   - "Profile updated successfully!" 알림
   - 변경사항 즉시 반영
❌ 실패 시나리오:
   - profiles 테이블 update 실패
   - RLS 정책 위반
```

---

### Phase 6: 알림 시스템
**목표**: 사용자가 알림을 받고 확인

#### Test 6.1: 알림 배지
```
1. User B가 User A의 사진에 좋아요 클릭
2. User A 계정으로 전환
3. BottomNav의 Notifications 아이콘 확인

✅ 예상 결과:
   - 빨간색 배지에 "1" 표시
   - 30초마다 자동 갱신
❌ 실패 시나리오:
   - 배지 안 뜸
   - 개수 안 맞음
```

#### Test 6.2: 알림 페이지
```
1. Notifications 아이콘 클릭
2. /notifications 접속
3. 알림 목록 확인
   - "User B liked your workout photo"
   - "User C commented: Great job!"
   - "You matched with User D!"

✅ 예상 결과:
   - 모든 알림 시간순 정렬
   - 안읽은 알림 파란색 배경
   - 상대 시간 표시 (1m ago, 2h ago)
❌ 실패 시나리오:
   - 알림 안 뜸
   - 시간 표시 이상함
```

#### Test 6.3: 알림 읽음 처리
```
1. /notifications 접속

✅ 예상 결과:
   - 페이지 진입 시 자동으로 모든 알림 읽음 처리
   - 배지 "0"으로 변경
   - 파란색 배경 사라짐
❌ 실패 시나리오:
   - 배지 그대로 남음
   - 알림 계속 안읽음 상태
```

---

## 🔍 Edge Cases & 에러 시나리오

### Edge Case 1: 빈 상태 (Empty States)
```
테스트 시나리오:
1. 새 계정 생성
2. /feed 접속 → "No posts yet" 메시지 확인
3. /notifications 접속 → "No notifications yet" 확인
4. /matches 접속 → "No matches yet" 확인
5. Profile > Workout Photos → "No workout photos yet" 확인

✅ 모든 빈 상태에서 적절한 메시지와 안내 표시
```

### Edge Case 2: 네트워크 오류
```
테스트 시나리오:
1. 개발자 도구 > Network > Offline 체크
2. 좋아요 클릭
3. 댓글 작성

✅ 예상 결과: "Failed to like post" 등 에러 메시지 표시
❌ 실패 시: 앱이 멈추거나 빈 화면
```

### Edge Case 3: 대용량 파일 업로드
```
테스트 시나리오:
1. Photo Session에서 11MB 사진 선택
2. 업로드 시도

✅ 예상 결과: "File too large. Max size: 10MB" 알림
❌ 실패 시: 업로드 시도 후 에러
```

### Edge Case 4: 이미 Like한 포스트
```
테스트 시나리오:
1. 포스트 좋아요 클릭
2. API 직접 호출하여 또 좋아요 시도

✅ 예상 결과: "Already liked" 에러 (중복 방지)
❌ 실패 시: likes_count 중복 증가
```

---

## 📱 모바일 반응형 테스트

### 모바일 브라우저 테스트
```
테스트 기기: iPhone/Android 실제 기기

1. 세로 모드 (Portrait)
   - 모든 페이지 정상 표시
   - 버튼 터치 가능
   - 텍스트 읽기 쉬움

2. 가로 모드 (Landscape)
   - 레이아웃 깨지지 않음
   - 컨텐츠 잘림 없음

3. Safe Area
   - iPhone 노치 영역 피함
   - BottomNav가 제스처 바 위에 표시
```

### 터치 제스처 테스트
```
1. Swipe: Discover 페이지에서 좌우 스와이프 (미구현이면 Pass)
2. Long Press: 포스트 길게 눌러서 메뉴 (미구현이면 Pass)
3. Pull to Refresh: 피드에서 아래로 당겨서 새로고침 (미구현이면 Pass)
```

---

## 🔒 보안 테스트

### 1. RLS (Row Level Security) 검증
```
테스트 방법:
1. Supabase Dashboard > Table Editor
2. posts 테이블 직접 insert 시도:
   - user_id: User A
   - photographer_id: User A (본인)

✅ 예상 결과: RLS 정책 위반으로 insert 실패
❌ 실패 시: 본인이 본인 사진 업로드 가능 (보안 취약점!)
```

### 2. API 권한 테스트
```
테스트 방법:
1. 로그아웃 상태에서 curl 또는 Postman으로 API 직접 호출
2. DELETE /api/posts/[postId] (다른 사람의 포스트)

✅ 예상 결과: 401 Unauthorized 또는 403 Forbidden
❌ 실패 시: 인증 없이 데이터 조작 가능 (심각한 보안 취약점!)
```

### 3. XSS (Cross-Site Scripting) 방지
```
테스트 방법:
1. 댓글에 <script>alert('XSS')</script> 입력
2. 제출 후 댓글 표시 확인

✅ 예상 결과: 스크립트가 텍스트로 표시 (실행 안 됨)
❌ 실패 시: alert 창 뜸 (XSS 취약점!)
```

---

## 🚀 성능 테스트

### 1. 페이지 로딩 속도
```
테스트 도구: Chrome DevTools > Lighthouse

목표:
- Performance: > 80
- First Contentful Paint: < 2s
- Time to Interactive: < 3s

확인 페이지:
- / (홈)
- /feed (피드)
- /discover (디스커버)
```

### 2. 이미지 최적화
```
테스트:
1. Network 탭 확인
2. 이미지 파일 크기 확인

✅ 기준:
   - 썸네일: < 100KB
   - 원본 이미지: < 1MB
❌ 실패 시: 이미지 압축 필요
```

### 3. API 응답 시간
```
테스트:
1. Network 탭에서 API 호출 시간 확인

✅ 기준:
   - GET /api/feed: < 500ms
   - POST /api/posts/upload: < 2s
   - GET /api/notifications: < 300ms
```

---

## ✅ 최종 체크리스트

### 출시 전 필수 확인사항

#### 데이터베이스
- [ ] Supabase 마이그레이션 실행 완료
- [ ] RLS 정책 활성화 확인
- [ ] Storage 버킷 생성 (profile-photos, workout-photos, workout-videos)
- [ ] Storage 버킷 public 설정 확인

#### 기능 테스트
- [ ] 회원가입 → 온보딩 → 프로필 생성 (전체 플로우)
- [ ] 매칭: Like → Match Modal → 매치 생성
- [ ] 사진 업로드: 파트너만 업로드 가능
- [ ] 피드: 좋아요, 댓글 작성/삭제
- [ ] 알림: 배지, 알림 목록, 읽음 처리
- [ ] 프로필 Grid: 사진 표시, Modal
- [ ] 필터: 운동 부위, 실력 레벨, 나이

#### 보안
- [ ] 본인 사진 업로드 불가 확인
- [ ] 매치되지 않은 사람 사진 업로드 불가 확인
- [ ] API 인증 확인 (로그아웃 상태에서 호출 차단)
- [ ] XSS 방지 확인

#### UX
- [ ] 모든 빈 상태 메시지 표시 확인
- [ ] 에러 메시지 적절히 표시
- [ ] 로딩 상태 표시
- [ ] 모바일 반응형 확인

#### 성능
- [ ] Lighthouse Score > 80
- [ ] 이미지 로딩 속도 확인
- [ ] API 응답 시간 확인

---

## 🐛 버그 발견 시 대응

### 버그 우선순위

**P0 (Critical - 즉시 수정)**:
- 회원가입 불가
- 로그인 불가
- 사진 업로드 불가
- 보안 취약점

**P1 (High - 출시 전 수정)**:
- 매칭 안 됨
- 좋아요/댓글 안 됨
- 알림 안 뜸
- 페이지 크래시

**P2 (Medium - 출시 후 수정 가능)**:
- UI 버그 (정렬 깨짐 등)
- 텍스트 오타
- 성능 이슈 (느린 로딩)

**P3 (Low - 나중에 수정)**:
- 부가 기능 버그
- 디자인 개선사항

### 버그 리포트 양식
```markdown
## 버그 제목
[간단한 요약]

## 재현 방법
1. ...
2. ...
3. ...

## 예상 결과
[어떻게 작동해야 하는지]

## 실제 결과
[실제로 어떻게 작동하는지]

## 스크린샷
[있으면 첨부]

## 환경
- 브라우저: Chrome 120
- 디바이스: iPhone 15
- 계정: test1@example.com
```

---

## 📝 테스트 로그 양식

### 테스트 실행 기록
```markdown
# 테스트 실행 날짜: 2025-01-13

## Phase 1: 회원가입 & 온보딩
- [x] Test 1.1: 회원가입 - ✅ Pass
- [x] Test 1.2: 온보딩 Step 1-4 - ✅ Pass

## Phase 2: 매칭
- [x] Test 2.1: Discover 페이지 - ✅ Pass
- [x] Test 2.2: 필터 기능 - ⚠️ Warning (필터 개수 배지 안 뜸)
- [x] Test 2.3: Like & Match - ✅ Pass

## Phase 3: 사진 업로드
- [x] Test 3.1: Photo Session 접근 - ✅ Pass
- [x] Test 3.2: 사진 업로드 - ❌ Fail (Supabase Storage 403 에러)
- [ ] Test 3.3: 보안 검증 - Pending

## 발견된 버그:
1. [P1] 사진 업로드 시 403 에러 - Storage 버킷 권한 설정 필요
2. [P2] 필터 배지 안 뜸 - DiscoverFilters 컴포넌트 확인 필요
```

---

## 🎯 출시 준비 완료 기준

### 모든 항목 체크 시 출시 가능

- [ ] 모든 P0, P1 버그 수정 완료
- [ ] 핵심 기능 (Phase 1-6) 모두 정상 작동
- [ ] 보안 테스트 통과
- [ ] 3명 이상의 테스터가 전체 플로우 완주
- [ ] Lighthouse Performance Score > 80
- [ ] 모바일 실기기 테스트 완료

### 출시 후 모니터링
```
첫 주:
- 매일 에러 로그 확인 (Supabase Dashboard)
- 사용자 피드백 수집
- 크래시 리포트 확인

첫 달:
- 주요 지표 모니터링 (DAU, Retention, Match Rate)
- 사용자 행동 분석 (어디서 이탈하는지)
- A/B 테스트 준비
```

---

**작성일**: 2025-01-13
**버전**: MVP v1.0
**작성자**: Claude Code
