// eslint.config.js (ESLint v9 - Flat config)
const globals = require('globals');
const js = require('@eslint/js');
const prettier = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
  // Ignorer les dossiers/fichiers
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
  },

  // Règles de base
  js.configs.recommended,

  // Ton projet (Node + ESM parsing pour accepter import/export)
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module', // <-- important pour import/export
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettier.rules,
      'prettier/prettier': 'error',

      'no-unused-vars': 'warn',
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
    },
  },
];
