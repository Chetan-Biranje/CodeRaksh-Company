/**
 * Universal AI Workforce - Provider Neutral Interface
 * Standard abstraction for LLM backends (Claude, Gemini, OpenAI, Mock).
 */

export class AIProviderInterface {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
  }

  async executePrompt(params = {}) {
    throw new Error(`executePrompt() must be implemented by provider adapter [${this.name}]`);
  }

  isAvailable() {
    return false;
  }

  calculateCost(promptTokens, completionTokens) {
    return 0.0;
  }
}
