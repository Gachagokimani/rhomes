import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        process: "readonly",
        __dirname: "readonly",
        module: "readonly",
        require: "readonly"
      }
    },
    plugins: {
      import: importPlugin
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "import/order": ["warn", { "alphabetize": { "order": "asc" } }]
    },
    settings: {},
    ignores: [
      "node_modules/",
      "dist/",
      "build/"
    ]
  }
];