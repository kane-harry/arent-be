module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: ['standard'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  globals: {
    NAMESPACE_USER_V1: true,
    NAMESPACE_USER_LOGS_V1: true
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 0,
    'no-console': 1,
    'no-undef': 1,
    'no-use-before-define': 1,
    'no-duplicate-imports': 2,
    camelcase: 0,
    'no-else-return': 2,
    'no-empty-function': 1,
    'no-lonely-if': 1,
    semi: [1, 'never'],
    '@typescript-eslint/no-unused-vars': 1,
    'no-unreachable': 1,
    quotes: [2, 'single', { avoidEscape: true }],
    'no-trailing-spaces': 1,
    'no-multiple-empty-lines': 1,
    'space-before-function-paren': 0
  }
}
