/**
 * Universal AI Workforce - Google Gemini Adapter
 */

import { AIProviderInterface } from './provider-interface.js';

export class GeminiAdapter extends AIProviderInterface {
  constructor(config = {}) {
    super('google', config);
    this.apiKey = process.env.GEMINI_API_KEY || config.apiKey || null;
    this.model = config.model || 'gemini-2.0-flash';
  }

  isAvailable() {
    return Boolean(this.apiKey);
  }

  async executePrompt(params = {}) {
    if (!this.isAvailable()) {
      throw new Error("Google Gemini adapter requires 'GEMINI_API_KEY' in environment.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: `${params.taskTitle}\n${params.description}` }] }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const costUsd = 0.0005; // Gemini 2.0 Flash ultra low cost

    return {
      success: true,
      provider: 'google',
      model: this.model,
      content,
      tokens: { prompt: 100, completion: 100, total: 200 },
      costUsd
    };
  }
}
