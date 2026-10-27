/**
 * Universal AI Workforce - Anthropic Claude Adapter
 */

import { AIProviderInterface } from './provider-interface.js';

export class ClaudeAdapter extends AIProviderInterface {
  constructor(config = {}) {
    super('anthropic', config);
    this.apiKey = process.env.ANTHROPIC_API_KEY || config.apiKey || null;
    this.model = config.model || 'claude-3-7-sonnet-20250219';
  }

  isAvailable() {
    return Boolean(this.apiKey);
  }

  async executePrompt(params = {}) {
    if (!this.isAvailable()) {
      throw new Error("Anthropic Claude adapter requires 'ANTHROPIC_API_KEY' in environment.");
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: params.maxTokens || 2048,
        messages: [
          { role: 'user', content: `${params.taskTitle}: ${params.description}` }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    const inputTokens = data.usage?.input_tokens || 100;
    const outputTokens = data.usage?.output_tokens || 100;
    const costUsd = this.calculateCost(inputTokens, outputTokens);

    return {
      success: true,
      provider: 'anthropic',
      model: this.model,
      content,
      tokens: { prompt: inputTokens, completion: outputTokens, total: inputTokens + outputTokens },
      costUsd
    };
  }

  calculateCost(promptTokens, completionTokens) {
    return (promptTokens / 1000) * 0.003 + (completionTokens / 1000) * 0.015;
  }
}
