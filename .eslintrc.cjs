module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-console': 'warn',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'off',
  },
  ignorePatterns: ['dist', 'node_modules', '*.config.*', '*.cjs'],
};
