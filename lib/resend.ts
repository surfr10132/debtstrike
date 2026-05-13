import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

// Resend constructor throws if API key is empty string — use a dummy key
// at build time to avoid breaking the build. Actual sends will fail gracefully.
export const resend = new Resend(resendApiKey || "re_placeholder_no_key");

export const isEmailConfigured = !!resendApiKey;
