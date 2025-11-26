import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 성능 모니터링 샘플링 비율 (0.0 ~ 1.0)
  tracesSampleRate: 1.0,

  // 환경 설정
  environment: process.env.NODE_ENV,

  // 디버그 모드 (개발 환경에서만)
  debug: false,

  // 에러 필터링
  beforeSend(event, hint) {
    // 개발 환경에서는 Sentry로 보내지 않음
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry (dev):', hint.originalException || hint.syntheticException);
      return null;
    }
    return event;
  },

  // 무시할 에러 패턴
  ignoreErrors: [
    // 브라우저 확장 프로그램 에러
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    // 네트워크 에러 (일시적)
    'Network request failed',
    'Failed to fetch',
  ],

  // 사용자 컨텍스트 추가
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Session Replay 샘플링
  replaysSessionSampleRate: 0.1, // 10% 세션 녹화
  replaysOnErrorSampleRate: 1.0, // 에러 발생 시 100% 녹화
});
