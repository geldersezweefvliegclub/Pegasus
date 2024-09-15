module.exports = [
  {
    files: ["*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["tsconfig.json", "e2e/tsconfig.json"],
        createDefaultProgram: true
      }
    },
    plugins: {
      "@angular-eslint": require("@angular-eslint/eslint-plugin"),
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin")
    },
    rules: {
      "@angular-eslint/component-selector": [
        "error",
        {
          "prefix": "app",
          "style": "kebab-case",
          "type": "element"
        }
      ],
      "@angular-eslint/directive-selector": [
        "error",
        {
          "prefix": "app",
          "style": "camelCase",
          "type": "attribute"
        }
      ]
    }
  },
  {
    files: ["*.html"],
    plugins: {
      "@angular-eslint/template": require("@angular-eslint/eslint-plugin-template")
    },
    rules: {}
  }
];