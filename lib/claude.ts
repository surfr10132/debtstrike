import Anthropic from "@anthropic-ai/sdk";

// Let the SDK read ANTHROPIC_API_KEY from process.env automatically
const anthropic = new Anthropic();

export default anthropic;
