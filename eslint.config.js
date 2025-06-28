import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import { fixupPluginRules } from "@eslint/compat";

export default tseslint.config(
  // 1. 全局忽略配置
  {
    ignores: ["dist/", "node_modules/", "*.config.js"],
  },

  // 2. ESLint 官方推荐规则
  js.configs.recommended,

  // 3. TypeScript 相关配置
  ...tseslint.configs.recommended,

  // 4. React 相关配置
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    plugins: {
      // 使用 fixupPluginRules 确保兼容性
      react: fixupPluginRules(pluginReact),
      "react-hooks": pluginReactHooks,
      "react-refresh": pluginReactRefresh,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // React 推荐规则
      ...pluginReact.configs.recommended.rules,
      
      // React Hooks 规则
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      
      // React Refresh 规则（仅在开发环境）
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      
      // React 19 相关调整
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/prop-types": "off", // 使用 TypeScript，不需要 prop-types
      
      // TypeScript 相关调整
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { 
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
    },
    settings: {
      react: {
        version: "detect", // 自动检测 React 版本
      },
    },
  }
);