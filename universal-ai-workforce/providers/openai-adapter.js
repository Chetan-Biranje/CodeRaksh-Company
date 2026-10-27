/**
 * Universal AI Workforce - OpenAI Adapter
 */

import { AIProviderInterface } from './provider-interface.js';

export class OpenAIAdapter extends AIProviderInterface {
  constructor(config = {}) {
    super('openai', config);
    this.apiKey = process.env.OPENAI_API_KEY || config.apiKey || null;
    this.model = config.model || 'gpt-4o';
  }

  isAvailable() {
    return Boolean(this.apiKey);
  }

  async executePrompt(params = {}) {
    if (!this.isAvailable()) {
      throw new Error("OpenAI adapter requires 'OPENAI_API_KEY' in environment.");
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'user', content: `${params.taskTitle}: ${params.description}` }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const promptTokens = data.usage?.prompt_tokens || 100;
    const completionTokens = data.usage?.completion_tokens || 100;
    const costUsd = (promptTokens / 1000) * 0.005 + (completionTokens / 1000) * 0.015;

    return {
      success: true,
      provider: 'openai',
      model: this.model,
      content,
      tokens: { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens },
      costUsd
    };
  }
}
