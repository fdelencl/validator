import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // show console output even when tests pass
    disableConsoleIntercept: true,
  },
});

