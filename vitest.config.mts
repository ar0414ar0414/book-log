import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// next-pwa (workbox-build) が @babel/core 7 に固定しているため
// @vitejs/plugin-react (@babel/core 8 要求) は入れていない。
// そのためコンポーネントのレンダリングテストは行わず、純粋なロジックのみを対象にする。
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
  },
});
