import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    rules: {
      // Several effects intentionally sync React state from external systems (localStorage,
      // wallet adapters, tx receipts). Keep the rule visible as a warning rather than an error.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  { ignores: [".next/**", "node_modules/**", "contracts/**", "public/**", "next-env.d.ts"] },
];

export default config;
