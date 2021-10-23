module.exports = {
  // Enable core eslint rules, see: http://eslint.org/docs/rules/
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  // Additional rules
  rules: {
    "no-var": 1,
    "brace-style": ["warn", "1tbs"],
    "no-unused-vars": ["error", { args: "none" }],
    indent: ["warn", 2, { SwitchCase: 1 }],
    "max-len": ["warn", 100, { ignoreUrls: true, ignoreTemplateLiterals: true }],
    "no-console": "off",
    "react/prop-types": "off",
    "react/no-unknown-property": "off"
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true
  },
  globals: {
    Phaser: true
  }
};
