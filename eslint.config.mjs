import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      eqeqeq: ["error", "always"],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // OCR-10: the app must never derive dates or amounts from file names. The filename oracle
    // lives in test-support/ and is only for tests.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/test-support", "**/test-support/**"],
              message: "test-support is for tests only; app code must not read file names (OCR-10).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/modules/dashboard/model/useDashboardPageModel.ts"],
    rules: {
      "@next/next/no-side-effects-in-dependencies": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "eslint.config.mjs",
    ],
  },
];

export default eslintConfig;
