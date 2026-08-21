import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 다른 세션이 만든 git worktree 체크아웃. 이 리포의 소스가 아니고 자체
    // node_modules 까지 들고 있어서, 여기를 훑으면 lint 가 남의 작업물 때문에
    // 실패한다(커밋 훅이 `npm run lint` 라 커밋이 막힌다).
    ".claude/worktrees/**",
  ]),
  {
    // 앱 소스가 아니라 standalone Node 스크립트. package.json 에 "type": "module"
    // 이 없어 .js 는 CommonJS이므로 require() 가 정상 — TS 전용 룰 제외.
    files: ["design-system/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
