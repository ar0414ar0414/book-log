import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// いまは純粋なロジックのみを対象にしている。
// コンポーネントのレンダリングテストを足す場合は
// @vitejs/plugin-react-swc + jsdom + @testing-library/react を追加する。
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
