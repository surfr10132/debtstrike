import { Configuration, LettersApi } from "@lob/lob-typescript-sdk";

// Use test key for now — switch to LOB_API_KEY_LIVE when ready to go live
const lobApiKey = process.env.LOB_API_KEY_TEST || process.env.LOB_API_KEY_LIVE;

if (!lobApiKey) {
  console.warn("[Lob] No API key found — mailing features will be unavailable");
}

const config = new Configuration({
  username: lobApiKey || "",
});

export const lettersApi = new LettersApi(config);
export default lettersApi;
