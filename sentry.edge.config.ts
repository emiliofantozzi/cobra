import * as Sentry from "@sentry/nextjs";

import { env } from "@/lib/config/env";

Sentry.init({
  dsn: env.SENTRY_DSN ?? undefined,
  environment: env.SENTRY_ENVIRONMENT,
  tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
  debug: env.NODE_ENV === "development",
  _experiments: {
    enableLogs: true,
  },
});

