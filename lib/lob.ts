import { Configuration, LettersApi } from "@lob/lob-typescript-sdk";

// Production (Vercel prod) uses the live key; everything else uses the test key.
const isProd = process.env.VERCEL_ENV === "production";
const lobApiKey = isProd
  ? process.env.LOB_API_KEY_LIVE
  : process.env.LOB_API_KEY_TEST || process.env.LOB_API_KEY_LIVE;

if (!lobApiKey) {
  console.warn("[Lob] No API key found — mailing features will be unavailable");
}

const config = new Configuration({
  username: lobApiKey || "",
});

export const lettersApi = new LettersApi(config);
export default lettersApi;
