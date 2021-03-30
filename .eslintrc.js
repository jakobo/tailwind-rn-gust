module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "universe/native",
  ],
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: "module",
  },
  plugins: ["react", "import"],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    quotes: [2, "double", { avoidEscape: true, allowTemplateLiterals: true }],
    "no-unused-vars": [
      2,
      {
        ignoreRestSiblings: true,
      },
    ],
    "react/prop-types": 0,
    "react/display-name": 0,
    "react/react-in-jsx-scope": 2,
  },
};
