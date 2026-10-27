/**
 * Universal AI Workforce - Providers Package
 * Provider-neutral interface and factory for Anthropic, Google Gemini, OpenAI, and Mock backends.
 */

import { AIProviderInterface } from './provider-interface.js';
import { ClaudeAdapter } from './claude-adapter.js';
import { GeminiAdapter } from './gemini-adapter.js';
import { OpenAIAdapter } from './openai-adapter.js';
import { MockProvider } from './mock-provider.js';

export {
  AIProviderInterface,
  ClaudeAdapter,
  GeminiAdapter,
  OpenAIAdapter,
  MockProvider
};

export function createProvider(type, config = {}) {
  switch (type.toLowerCase()) {
    case 'anthropic':
    case 'claude':
      return new ClaudeAdapter(config);
    case 'google':
    case 'gemini':
      return new GeminiAdapter(config);
    case 'openai':
    case 'chatgpt':
      return new OpenAIAdapter(config);
    case 'mock':
    default:
      return new MockProvider(config);
  }
}
