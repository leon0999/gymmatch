# 🚀 GymMatch 배포 가이드 (완벽 버전)

## 📋 배포 전 체크리스트

### 1. 코드 정리
- [x] 좋아요/댓글 기능 정상 작동 ✅
- [ ] 모든 API 엔드포인트 테스트
- [ ] 콘솔 로그 제거 (프로덕션)
- [ ] 에러 핸들링 확인
- [ ] TypeScript 컴파일 에러 0개

### 2. 환경 변수 준비
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

---

## 🎯 Step 1: Vercel 배포 (추천)

### 1-1. Vercel CLI 설치
```bash
npm install -g vercel
```

### 1-2. Vercel 로그인
```bash
vercel login
```

### 1-3. 프로젝트 배포
```bash
cd /Users/user/Desktop/gymmatch
vercel
```

**질문 답변**:
- Set up and deploy "~/Desktop/gymmatch"? **Y**
- Which scope? **개인 계정 선택**
- Link to existing project? **N**
- What's your project's name? **gymmatch**
- In which directory is your code located? **./**
- Want to modify settings? **N**

### 1-4. 환경 변수 설정 (Vercel Dashboard)
1. **Vercel Dashboard** → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 추가할 변수:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
4. **All Environments** 선택
5. **Save**

### 1-5. 프로덕션 배포
```bash
vercel --prod
```

**배포 완료! 🎉**
URL: `https://gymmatch.vercel.app` (또는 커스텀 도메인)

---

## 🌐 Step 2: 도메인 연결

### 2-1. 도메인 구매 (선택사항)
- **추천**: Namecheap, GoDaddy, Cloudflare
- **예산**: $10-15/년
- **도메인 예시**: gymmatch.com, workoutmatch.app

### 2-2. Vercel에 도메인 연결
1. **Vercel Dashboard** → **Settings** → **Domains**
2. **Add Domain** 클릭
3. 도메인 입력 (예: gymmatch.com)
4. DNS 레코드 추가 (Vercel이 자동 안내)

**DNS 설정 (예시)**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**SSL 인증서**: Vercel이 자동으로 Let's Encrypt 설정 ✅

---

## 💾 Step 3: Supabase 프로덕션 설정

### 3-1. Database Triggers 실행
**Supabase SQL Editor**에서:
```sql
-- 1. Follows 테이블
-- /Users/user/Desktop/gymmatch/supabase/migrations/create_follows_table.sql

-- 2. 좋아요/댓글 카운트 트리거
-- /Users/user/Desktop/gymmatch/supabase/migrations/create_count_triggers.sql
```

### 3-2. RLS (Row Level Security) 확인
```sql
-- posts 테이블
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone"
ON posts FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = photographer_id);

-- 나머지 테이블도 동일하게 확인
```

### 3-3. Supabase URL 업데이트
Vercel 환경 변수에 Supabase URL 확인:
```
NEXT_PUBLIC_SUPABASE_URL=https://ipeevrpczgyualyukrie.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 📊 Step 4: Google에 배포 (SEO)

### 4-1. Google Search Console
1. **Google Search Console** 접속: https://search.google.com/search-console
2. **속성 추가** → **URL 접두어** 선택
3. URL 입력: `https://gymmatch.vercel.app`
4. **소유권 확인**:
   - **권장**: HTML 태그 방법
   - `<meta name="google-site-verification" content="...">`를 `app/layout.tsx`에 추가

**소유권 확인 코드 추가**:
```tsx
// app/layout.tsx
export const metadata = {
  title: 'GymMatch',
  description: '운동 메이트 매칭 플랫폼',
  verification: {
    google: 'YOUR_VERIFICATION_CODE',
  },
};
```

5. **sitemap.xml 제출**:
   - URL: `https://gymmatch.vercel.app/sitemap.xml`

### 4-2. sitemap.xml 생성
```bash
# app/sitemap.ts 생성
```

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://gymmatch.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://gymmatch.vercel.app/feed',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: 'https://gymmatch.vercel.app/matches',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];
}
```

### 4-3. robots.txt 생성
```bash
# app/robots.ts 생성
```

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: 'https://gymmatch.vercel.app/sitemap.xml',
  };
}
```

### 4-4. Google Analytics 추가
1. **Google Analytics** 접속: https://analytics.google.com
2. **관리** → **속성 만들기**
3. **측정 ID** 복사 (예: G-XXXXXXXXXX)
4. `app/layout.tsx`에 추가:

```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 📱 Step 5: Open Graph (소셜 미디어 최적화)

### 5-1. Open Graph 메타 태그 추가
```tsx
// app/layout.tsx
export const metadata = {
  title: 'GymMatch - 운동 메이트 매칭 플랫폼',
  description: '나에게 딱 맞는 운동 파트너를 찾아보세요! 위치, 레벨, 스케줄 기반 매칭',
  openGraph: {
    title: 'GymMatch - 운동 메이트 매칭',
    description: '나에게 딱 맞는 운동 파트너를 찾아보세요!',
    url: 'https://gymmatch.vercel.app',
    siteName: 'GymMatch',
    images: [
      {
        url: 'https://gymmatch.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'GymMatch',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GymMatch - 운동 메이트 매칭',
    description: '나에게 딱 맞는 운동 파트너를 찾아보세요!',
    images: ['https://gymmatch.vercel.app/og-image.jpg'],
  },
};
```

### 5-2. OG 이미지 생성
- **크기**: 1200 × 630 픽셀
- **도구**: Canva, Figma
- **위치**: `public/og-image.jpg`

---

## 🎯 Step 6: 마케팅 준비

### 6-1. 소셜 미디어 계정 생성
- [ ] **Instagram**: @gymmatch_official
- [ ] **Twitter/X**: @gymmatch
- [ ] **Facebook 페이지**: GymMatch
- [ ] **TikTok**: @gymmatch

### 6-2. 런칭 콘텐츠 준비
**첫 포스팅 예시**:
```
🎉 GymMatch 런칭!

나에게 딱 맞는 운동 파트너를 찾아보세요!

✅ 위치 기반 매칭
✅ 레벨/스케줄 맞춤
✅ 실시간 채팅
✅ 운동 사진 공유

지금 가입하고 첫 번째 매칭을 시작하세요!
👉 https://gymmatch.vercel.app

#운동메이트 #헬스장 #운동친구 #GymMatch
```

### 6-3. Product Hunt 준비
1. **Product Hunt** 가입: https://www.producthunt.com
2. **제품 등록 양식 작성**:
   - 제품명: GymMatch
   - Tagline: Find Your Perfect Workout Partner
   - 카테고리: Health & Fitness, Social Network
   - 스크린샷 5장 준비
   - 데모 영상 (선택사항)

### 6-4. SEO 키워드 타겟팅
- "운동 메이트 찾기"
- "헬스장 파트너"
- "운동 친구 매칭"
- "gym partner finder"
- "workout buddy app"

---

## 🚨 프로덕션 체크리스트

### 보안
- [ ] 환경 변수 프로덕션 설정 완료
- [ ] API Rate Limiting 설정
- [ ] CORS 설정 확인
- [ ] RLS 정책 활성화

### 성능
- [ ] 이미지 최적화 (Next.js Image)
- [ ] 캐싱 전략 확인
- [ ] Lighthouse 점수 90+ 확인
- [ ] Core Web Vitals 측정

### 모니터링
- [ ] Vercel Analytics 활성화
- [ ] Google Analytics 설치
- [ ] Sentry 에러 모니터링 (선택사항)
- [ ] Supabase Logs 확인

### 법적 준비
- [ ] 이용약관 작성
- [ ] 개인정보처리방침 작성
- [ ] 쿠키 정책 작성

---

## 📈 런칭 후 할 일

### 첫 주
- [ ] Product Hunt 등록
- [ ] Reddit r/fitness 포스팅
- [ ] Instagram 매일 포스팅
- [ ] 초기 사용자 피드백 수집

### 첫 달
- [ ] Google Ads 캠페인 (예산: $100-300)
- [ ] Instagram 광고 (예산: $100-300)
- [ ] 인플루언서 협업 (헬스 유튜버)
- [ ] 사용자 리뷰 수집 및 개선

### 지속적
- [ ] 주간 분석 리포트 (Google Analytics)
- [ ] A/B 테스트 (랜딩 페이지)
- [ ] 사용자 인터뷰
- [ ] 기능 업데이트 (피드백 기반)

---

## 🎯 예산 가이드 (첫 3개월)

| 항목 | 비용 (월) |
|------|----------|
| Vercel Hobby | $0 (무료) |
| Supabase Free Tier | $0 |
| 도메인 (.com) | $1.25 |
| Google Ads | $100-300 |
| Instagram Ads | $100-300 |
| **총합** | **$200-600** |

**무료로 시작 가능**: Vercel + Supabase 무료 티어로 충분!

---

## 🚀 빠른 배포 명령어 (요약)

```bash
# 1. Vercel 배포
cd /Users/user/Desktop/gymmatch
vercel login
vercel --prod

# 2. 환경 변수 설정 (Vercel Dashboard)
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Database Triggers 실행 (Supabase SQL Editor)
# - create_follows_table.sql
# - create_count_triggers.sql

# 4. sitemap.xml 생성
# app/sitemap.ts 작성

# 5. Google Search Console 등록
# https://search.google.com/search-console

# 완료! 🎉
```

---

**작성일**: 2025-11-20
**버전**: 1.0
**작성자**: Claude Code + 박재현

**문의**: 문제 발생 시 이 가이드 참고하여 재배포하세요!
