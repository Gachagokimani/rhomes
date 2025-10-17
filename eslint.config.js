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
        require: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly"
      }
    },
    plugins: {
      import: importPlugin
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "off",
      "import/order": ["warn", { "alphabetize": { "order": "asc" } }]
    },
    settings: {},
    ignores: [
      "node_modules/",
      "dist/",
      "build/"
    ]
  },
  {
    files: ["services/database/init/**", "services/database/**/init-*.js"],
    languageOptions: {
      globals: {
        db: "writable",
        print: "readonly"
      }
    }
  }
];