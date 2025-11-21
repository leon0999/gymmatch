# 🚀 Vercel 즉시 배포 가이드

## ⚡ 5분 만에 배포하기

### Step 1: GitHub 코드 푸시
```bash
cd /Users/user/Desktop/gymmatch

# Git 초기화 (처음이면)
git init
git add .
git commit -m "🚀 Initial commit - GymMatch ready for deployment"

# GitHub repo 생성 후
git remote add origin https://github.com/[username]/gymmatch.git
git branch -M main
git push -u origin main
```

### Step 2: Vercel 배포 (1분)
1. **Vercel 로그인**: https://vercel.com
2. **Import Project** 클릭
3. GitHub repo 선택: `gymmatch`
4. **Framework Preset**: Next.js (자동 감지)
5. **Environment Variables** 추가:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ipeevrpczgyualyukrie.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[Supabase Dashboard에서 복사]
   ```
6. **Deploy** 클릭!

**배포 완료!** 🎉
URL: `https://gymmatch.vercel.app`

---

## 🔧 CLI로 배포하기 (더 빠름)

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 로그인
vercel login

# 3. 배포
cd /Users/user/Desktop/gymmatch
vercel --prod

# 환경 변수 설정 (첫 배포 시 프롬프트에서 입력)
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## ✅ 배포 후 체크리스트

### 1. Supabase Triggers 실행
**Supabase SQL Editor**에서:
```sql
-- 좋아요/댓글 카운트 트리거
-- /Users/user/Desktop/gymmatch/supabase/migrations/create_count_triggers.sql

-- Follows 테이블
-- /Users/user/Desktop/gymmatch/supabase/migrations/create_follows_table.sql
```

### 2. 사이트 접속 테스트
- https://gymmatch.vercel.app
- 회원가입 → 로그인 → 피드 확인
- 좋아요/댓글 테스트
- 프로필 확인

### 3. Google Search Console 등록
1. https://search.google.com/search-console
2. **속성 추가** → `https://gymmatch.vercel.app`
3. 소유권 확인 → **sitemap.xml 제출**

### 4. Analytics 설정 (선택사항)
- Google Analytics
- Vercel Analytics (자동 활성화)

---

## 🎯 커스텀 도메인 연결 (선택사항)

### 도메인 구매
- **Namecheap**: https://www.namecheap.com
- **추천**: gymmatch.com ($10-15/년)

### Vercel에 도메인 추가
1. **Vercel Dashboard** → **Settings** → **Domains**
2. **Add Domain** → 도메인 입력
3. DNS 레코드 추가 (Vercel이 자동 안내)

**DNS 설정 예시**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**SSL 인증서**: 자동으로 Let's Encrypt 설정됨! ✅

---

## 🚨 문제 해결

### 배포 실패 시
```bash
# 빌드 로그 확인
vercel logs

# 로컬에서 프로덕션 빌드 테스트
npm run build
npm run start
```

### 환경 변수 에러
- Vercel Dashboard → Settings → Environment Variables
- **All Environments** 선택했는지 확인
- **Redeploy** 버튼 클릭

### Supabase 연결 에러
- URL이 정확한지 확인
- Anon Key가 맞는지 확인
- Supabase Project Settings → API 확인

---

## 📊 배포 후 모니터링

### Vercel Dashboard
- **Deployments**: 배포 히스토리
- **Analytics**: 방문자 통계
- **Logs**: 에러 로그

### Supabase Dashboard
- **Database**: 테이블 확인
- **Auth**: 사용자 수
- **Logs**: API 호출 로그

---

**배포 성공!** 🎉
이제 마케팅 시작하세요!

- Product Hunt: https://www.producthunt.com
- Reddit r/fitness: https://www.reddit.com/r/fitness
- Instagram: @gymmatch_official

**작성일**: 2025-11-20
**작성자**: Claude Code
