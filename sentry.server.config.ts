import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 성능 모니터링
  tracesSampleRate: 1.0,

  // 환경 설정
  environment: process.env.NODE_ENV,

  // 디버그 모드
  debug: false,

  // 서버 에러 필터링
  beforeSend(event, hint) {
    // 개발 환경에서는 Sentry로 보내지 않음
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Server (dev):', hint.originalException || hint.syntheticException);
      return null;
    }
    return event;
  },

  // 무시할 에러
  ignoreErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
  ],
});
