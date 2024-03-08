module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "airbnb",
    "airbnb-typescript",
    "airbnb/hooks",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended", // must be the last one
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["react", "@typescript-eslint", "prettier"],
  rules: {
    "comma-dangle": ["error", "always-multiline"],
    "semi": ["error", "always"],
    "react/react-in-jsx-scope": 0,
    "react/jsx-filename-extension": [
      2,
      { extensions: [".js", ".jsx", ".ts", ".tsx"] },
    ],
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
      },
    ],
    "react/jsx-props-no-spreading": 0,
    "jsx-a11y/label-has-associated-control": [2, { assert: "either" }],
    "linebreak-style": 0,
    "no-restricted-imports": 0,
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
  },
};
