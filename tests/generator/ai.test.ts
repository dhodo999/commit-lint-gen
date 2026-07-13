import { describe, it, expect, vi } from 'vitest';
import { generateAICommit } from '../../src/generator/ai.js';
import type { SimpleGit } from 'simple-git';
import type { Config } from '../../src/config/defaultConfig.js';

vi.mock('../../src/generator/provider.js', () => ({
  createAIProvider: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  type: 'feat',
                  scope: 'api',
                  description: 'add user authentication',
                }),
              },
            },
          ],
        }),
      },
    },
  })),
}));

const mockConfig: Config = {
  aiProvider: 'groq',
  baseURL: 'https://api.groq.com/openai/v1',
  model: 'qwen/qwen3.6-27b',
  apiKey: 'test-key',
};

describe('generateAICommit', () => {
  it('should generate commit from AI', async () => {
    const mockGit = {
      diff: vi.fn().mockResolvedValue('diff content'),
    } as unknown as SimpleGit;

    const result = await generateAICommit(mockGit, mockConfig);

    expect(result.type).toBe('feat');
    expect(result.scope).toBe('api');
    expect(result.description).toBe('add user authentication');
  });

  it('should throw error when no staged changes', async () => {
    const mockGit = {
      diff: vi.fn().mockResolvedValue(''),
    } as unknown as SimpleGit;

    await expect(generateAICommit(mockGit, mockConfig)).rejects.toThrow('No staged changes found');
  });

  it('should throw error when no API key', async () => {
    // Clear the mock to use the real provider that checks for API key
    vi.clearAllMocks();
    vi.resetModules();

    // Re-mock to throw on missing API key
    vi.doMock('../../src/generator/provider.js', () => ({
      createAIProvider: vi.fn(() => {
        throw new Error('API key is required for AI generation. Set GROQ_API_KEY in your environment or add apiKey to your config.');
      }),
    }));

    const { generateAICommit: generateAI } = await import('../../src/generator/ai.js');
    const { apiKey: _unused, ...configWithoutKey } = mockConfig;

    const mockGit = {
      diff: vi.fn().mockResolvedValue('diff content'),
    } as unknown as SimpleGit;

    await expect(generateAI(mockGit, configWithoutKey as Config)).rejects.toThrow('API key is required');
  });
});
