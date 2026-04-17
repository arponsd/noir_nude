// reason: @/lib/env validates process.env at import time. Unit tests don't need real
// credentials (they mock at the service boundary), so we short-circuit the validation
// via SKIP_ENV_VALIDATION before any test module imports env-dependent code.
process.env.SKIP_ENV_VALIDATION ??= "1";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";

import "@testing-library/jest-dom/vitest";
