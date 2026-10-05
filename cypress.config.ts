import { defineConfig } from "cypress";
import { ClearNextPagesDirPlugin } from "./cypress/support/clearNextPagesDir";

// The browser Supabase client is created when the upload model is imported and only needs some
// URL and key to exist. The component tests never reach Supabase: the two browser calls the flow
// makes are stubbed with cy.intercept (see cypress/support/stubDashboardApi.ts).
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "component-test-placeholder-key";

export default defineConfig({
  video: false,
  screenshotOnRunFailure: false,
  component: {
    // Cypress supports Next 16 component testing from 15.7.0, with webpack (not Turbopack).
    devServer: {
      framework: "next",
      bundler: "webpack",
      // See cypress/support/clearNextPagesDir.ts for why this is needed.
      webpackConfig: { plugins: [new ClearNextPagesDirPlugin()] },
    },
    specPattern: "cypress/component/**/*.cy.tsx",
    supportFile: false,
    // The real OCR worker and its language data load in the browser, which takes a while.
    defaultCommandTimeout: 10000,
  },
});
