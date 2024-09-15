// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
    {
        files: ["**/*.ts"],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            // ...tseslint.configs.stylistic,
            // ...angular.configs.tsRecommended,
        ],
        processor: angular.processInlineTemplates,
        rules: {
            '@typescript-eslint/no-empty-object-type': 'warn'
        }
    },
    {
        files: ["**/*.html"],
        extends: [
            ...angular.configs.templateRecommended,
            ...angular.configs.templateAccessibility,
        ],
        rules: {
            '@angular-eslint/template/click-events-have-key-events': 'warn',
            '@angular-eslint/template/interactive-supports-focus': 'warn',
            '@angular-eslint/template/label-has-associated-control': 'warn',
            '@angular-eslint/template/alt-text': 'warn',
        },
    }
);
