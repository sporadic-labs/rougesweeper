module.exports = {
  // Enable core eslint rules, see: http://eslint.org/docs/rules/
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  // Additional rules
  rules: {},
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  globals: {
    Phaser: true,
  },
};
