/**
 * Universal AI Workforce - Deterministic Mock Provider
 * High-performance test adapter for offline testing, CI/CD, and 1,000+ agent load tests without API costs.
 */

import { AIProviderInterface } from './provider-interface.js';

export class MockProvider extends AIProviderInterface {
  constructor(config = {}) {
    super('mock', config);
    this.latencyMs = config.latencyMs || 5;
    this.simulateErrors = Boolean(config.simulateErrors);
    this.errorCountRemaining = config.errorCount || 0;
    this.rateLimitMode = Boolean(config.rateLimitMode);
    this.callCount = 0;
  }

  isAvailable() {
    return true;
  }

  async executePrompt(params = {}) {
    this.callCount++;

    // Simulated Rate Limit
    if (this.rateLimitMode && this.callCount % 3 === 0) {
      const err = new Error('429 Too Many Requests: Rate limit exceeded on provider.');
      err.code = 'RATE_LIMIT_EXCEEDED';
      err.status = 429;
      throw err;
    }

    // Simulated Provider Error
    if (this.simulateErrors || this.errorCountRemaining > 0) {
      if (this.errorCountRemaining > 0) this.errorCountRemaining--;
      const err = new Error('503 Service Unavailable: Simulated downstream model timeout.');
      err.code = 'MODEL_TIMEOUT';
      err.status = 503;
      throw err;
    }

    if (this.latencyMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.latencyMs));
    }

    const title = params.taskTitle || 'Task';
    const capabilities = (params.capabilities || []).join(', ');
    const agentId = params.agentId || 'agent';

    const content = `[MockProvider Response] Successfully executed "${title}" by agent "${agentId}". Output generated using capabilities: [${capabilities}]. All requirements verified.`;
    const promptTokens = 120;
    const completionTokens = 85;
    const costUsd = this.calculateCost(promptTokens, completionTokens);

    return {
      success: true,
      provider: 'mock',
      model: 'deterministic-mock-v1',
      content,
      tokens: { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens },
      costUsd
    };
  }

  calculateCost(promptTokens, completionTokens) {
    // $0.003 per 1k input, $0.015 per 1k output
    return (promptTokens / 1000) * 0.003 + (completionTokens / 1000) * 0.015;
  }
}
