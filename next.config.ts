import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipeevrpczgyualyukrie.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Sentry instrumentation 활성화
  experimental: {
    instrumentationHook: true,
  },
};

// Sentry 설정 옵션
const sentryWebpackPluginOptions = {
  org: "gymmatch",
  project: "gymmatch-web",

  // 소스맵 업로드 (프로덕션에서만)
  silent: !process.env.CI,

  // 자동 릴리스 생성
  autoInstrumentServerFunctions: false,

  // 빌드 시간 단축
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
