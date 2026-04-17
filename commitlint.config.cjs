/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'perf',
        'test',
        'docs',
        'chore',
        'build',
        'ci',
        'style',
        'revert',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        // frontend
        'frontend', 'frontend/pdp', 'frontend/cart', 'frontend/checkout',
        'frontend/auth', 'frontend/account', 'frontend/admin', 'frontend/home',
        'frontend/search', 'frontend/layout', 'frontend/ui', 'frontend/emails',
        // backend
        'backend', 'backend/cart', 'backend/checkout', 'backend/orders',
        'backend/products', 'backend/reviews', 'backend/wishlist',
        'backend/addresses', 'backend/coupons', 'backend/admin', 'backend/uploads',
        'backend/user', 'backend/newsletter',
        // database
        'database', 'database/user', 'database/product', 'database/order',
        'database/cart', 'database/review', 'database/coupon', 'database/seed',
        'database/migrate',
        // security
        'security', 'security/auth', 'security/csrf', 'security/ratelimit',
        'security/middleware', 'security/headers',
        // devops
        'devops', 'devops/ci', 'devops/cd', 'devops/env', 'devops/deploy',
        'devops/monitoring', 'devops/deps',
        // qa
        'qa', 'qa/unit', 'qa/integration', 'qa/e2e', 'qa/fixtures',
        // cross
        'docs', 'contracts', 'types', 'repo',
      ],
    ],
    'scope-empty': [2, 'never'],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'subject-max-length': [2, 'always', 72],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
    'footer-max-line-length': [2, 'always', 100],
  },
};
