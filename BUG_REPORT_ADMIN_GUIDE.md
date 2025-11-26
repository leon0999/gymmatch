# 🐛 버그 리포트 관리자 가이드

## 📊 버그 리포트 확인 방법

### 방법 1: Supabase Dashboard (추천)

1. **Supabase Dashboard 접속**
   - URL: https://supabase.com/dashboard
   - 프로젝트: GymMatch 선택

2. **Table Editor로 이동**
   - 왼쪽 메뉴 > **Table Editor** 클릭

3. **bug_reports 테이블 선택**
   - 테이블 목록에서 **bug_reports** 클릭

4. **버그 리포트 확인**
   - 최신 리포트가 맨 위에 표시됨
   - created_at 기준 정렬

---

## 📋 버그 리포트 데이터 구조

### 테이블: bug_reports

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| **id** | uuid | 고유 ID |
| **user_id** | uuid | 제보자 ID (nullable) |
| **description** | text | 버그 설명 |
| **page_url** | text | 발생 페이지 URL |
| **screenshot_url** | text | 스크린샷 URL (nullable) |
| **browser_info** | jsonb | 브라우저 정보 |
| **user_agent** | text | User Agent 문자열 |
| **status** | text | 상태 (new, in_progress, resolved, closed) |
| **priority** | text | 우선순위 (low, medium, high, critical) |
| **created_at** | timestamp | 제보 시각 |
| **updated_at** | timestamp | 업데이트 시각 |
| **resolved_at** | timestamp | 해결 시각 |

---

## 🔍 버그 리포트 조회 SQL 쿼리

### 1. 최신 버그 리포트 10개 (우선순위별)

```sql
SELECT
  id,
  description,
  page_url,
  status,
  priority,
  created_at,
  screenshot_url
FROM bug_reports
ORDER BY
  CASE priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  created_at DESC
LIMIT 10;
```

### 2. 미해결 버그만 조회

```sql
SELECT
  id,
  description,
  page_url,
  status,
  priority,
  created_at
FROM bug_reports
WHERE status IN ('new', 'in_progress')
ORDER BY
  CASE priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  created_at DESC;
```

### 3. 특정 사용자의 버그 리포트

```sql
SELECT
  id,
  description,
  page_url,
  status,
  priority,
  created_at
FROM bug_reports
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC;
```

### 4. 오늘 들어온 버그 리포트

```sql
SELECT
  id,
  description,
  page_url,
  status,
  priority,
  created_at
FROM bug_reports
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;
```

### 5. 페이지별 버그 통계

```sql
SELECT
  page_url,
  COUNT(*) as bug_count,
  COUNT(CASE WHEN status IN ('new', 'in_progress') THEN 1 END) as open_bugs,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_bugs
FROM bug_reports
GROUP BY page_url
ORDER BY bug_count DESC;
```

---

## 🖼️ 스크린샷 확인 방법

### 방법 1: Supabase Storage에서 직접 확인

1. **Storage로 이동**
   - 왼쪽 메뉴 > **Storage** 클릭

2. **bug-reports 버킷 선택**
   - bug-reports 버킷 클릭

3. **스크린샷 확인**
   - 파일 리스트에서 스크린샷 클릭
   - 미리보기 또는 다운로드

### 방법 2: screenshot_url로 직접 접근

```
https://ipeevrpczgyualyukrie.supabase.co/storage/v1/object/public/bug-reports/bug-report-1234567890.jpg
```

---

## ✏️ 버그 상태 업데이트 방법

### SQL Editor에서 직접 업데이트

```sql
-- 버그를 "진행 중"으로 변경
UPDATE bug_reports
SET status = 'in_progress',
    updated_at = now()
WHERE id = 'bug-id-here';

-- 버그를 "해결됨"으로 변경
UPDATE bug_reports
SET status = 'resolved',
    resolved_at = now(),
    updated_at = now()
WHERE id = 'bug-id-here';

-- 우선순위 변경
UPDATE bug_reports
SET priority = 'critical',
    updated_at = now()
WHERE id = 'bug-id-here';
```

### Table Editor에서 직접 수정

1. bug_reports 테이블 열기
2. 수정할 행 클릭
3. status 또는 priority 컬럼 편집
4. Enter로 저장

---

## 📧 버그 리포트 이메일 알림 설정 (선택사항)

### Supabase Edge Function으로 자동 이메일 전송

```typescript
// supabase/functions/bug-report-notification/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { record } = await req.json()

  // Send email to admin
  const emailBody = `
    New Bug Report Received!

    Description: ${record.description}
    Page: ${record.page_url}
    Priority: ${record.priority}
    Screenshot: ${record.screenshot_url || 'N/A'}

    View in Supabase: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor/bug_reports
  `

  // TODO: Send via SendGrid, Mailgun, or AWS SES

  return new Response('OK', { status: 200 })
})
```

---

## 📊 버그 리포트 대시보드 (추천)

### 방법 1: Supabase SQL Editor에서 실시간 대시보드

```sql
-- 버그 리포트 요약 대시보드
SELECT
  '전체 버그' as category,
  COUNT(*) as count,
  '-' as percentage
FROM bug_reports

UNION ALL

SELECT
  '미해결 버그',
  COUNT(*),
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bug_reports), 1) || '%'
FROM bug_reports
WHERE status IN ('new', 'in_progress')

UNION ALL

SELECT
  '오늘 들어온 버그',
  COUNT(*),
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bug_reports), 1) || '%'
FROM bug_reports
WHERE created_at >= CURRENT_DATE

UNION ALL

SELECT
  'Critical 우선순위',
  COUNT(*),
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bug_reports), 1) || '%'
FROM bug_reports
WHERE priority = 'critical' AND status IN ('new', 'in_progress')

UNION ALL

SELECT
  '해결된 버그',
  COUNT(*),
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bug_reports), 1) || '%'
FROM bug_reports
WHERE status = 'resolved';
```

### 방법 2: Metabase, Retool 등 BI 도구 연동

---

## 🚨 우선순위 가이드

### Critical (즉시 수정)
- 앱 크래시
- 로그인 불가
- 결제 실패
- 데이터 손실

### High (24시간 이내)
- 핵심 기능 작동 불가
- 매칭 실패
- 메시지 전송 불가

### Medium (1주일 이내)
- UI 버그
- 성능 저하
- 일부 기능 오작동

### Low (시간 날 때)
- 텍스트 오타
- 디자인 개선
- 편의성 개선

---

## 🛠️ 버그 수정 워크플로우

1. **버그 확인**
   - Supabase에서 버그 리포트 확인
   - 스크린샷 및 브라우저 정보 분석

2. **우선순위 설정**
   - Critical/High/Medium/Low 분류
   - SQL 또는 Table Editor로 priority 업데이트

3. **상태 변경: in_progress**
   ```sql
   UPDATE bug_reports
   SET status = 'in_progress', updated_at = now()
   WHERE id = 'bug-id';
   ```

4. **버그 수정**
   - 코드 수정
   - 로컬 테스트
   - GitHub 커밋

5. **배포**
   - Vercel 자동 배포
   - 프로덕션 확인

6. **상태 변경: resolved**
   ```sql
   UPDATE bug_reports
   SET status = 'resolved', resolved_at = now(), updated_at = now()
   WHERE id = 'bug-id';
   ```

7. **사용자에게 피드백** (선택사항)
   - 감사 이메일
   - 앱 내 알림

---

## 📈 버그 리포트 분석

### 가장 많이 발생하는 페이지

```sql
SELECT
  page_url,
  COUNT(*) as bug_count
FROM bug_reports
GROUP BY page_url
ORDER BY bug_count DESC
LIMIT 10;
```

### 시간대별 버그 발생 추이

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as bug_count
FROM bug_reports
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

### 브라우저별 버그 통계

```sql
SELECT
  browser_info->>'userAgent' as browser,
  COUNT(*) as bug_count
FROM bug_reports
GROUP BY browser_info->>'userAgent'
ORDER BY bug_count DESC;
```

---

## 🎯 베타 테스트 기간 중 모니터링

### 실시간 모니터링 체크리스트

**매 시간**:
- [ ] 새로운 버그 리포트 확인
- [ ] Critical/High 우선순위 버그 즉시 수정

**하루 2번 (오전/오후)**:
- [ ] 버그 리포트 대시보드 확인
- [ ] 페이지별 버그 통계 분석
- [ ] 공통 패턴 파악

**매일**:
- [ ] 모든 버그 리포트 검토
- [ ] Medium 우선순위 버그 수정 계획
- [ ] 베타 테스터에게 진행 상황 공유

---

## 💡 팁

### 빠른 버그 확인 쿼리 (북마크 추천)

```sql
-- 오늘의 미해결 버그 (우선순위순)
SELECT id, description, page_url, status, priority, created_at
FROM bug_reports
WHERE created_at >= CURRENT_DATE
  AND status IN ('new', 'in_progress')
ORDER BY
  CASE priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  created_at DESC;
```

### 스크린샷 다운로드 스크립트

```bash
#!/bin/bash
# download-bug-screenshots.sh

# Supabase Storage에서 모든 스크린샷 다운로드
wget -r -np -nd -A "bug-report-*.jpg" \
  https://ipeevrpczgyualyukrie.supabase.co/storage/v1/object/public/bug-reports/
```

---

**작성일**: 2025-11-26
**작성자**: GymMatch Team
**상태**: 버그 리포트 시스템 가동 중 🐛
