import { describe, it, expect, vi } from 'vitest';
import { generateAICommit, truncateDiff } from '../../src/generator/ai.js';
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
      checkIsRepo: vi.fn().mockResolvedValue(true),
      diff: vi.fn().mockResolvedValue('diff content'),
    } as unknown as SimpleGit;

    const result = await generateAICommit(mockGit, mockConfig);

    expect(result.type).toBe('feat');
    expect(result.scope).toBe('api');
    expect(result.description).toBe('add user authentication');
  });

  it('should throw error when no staged changes', async () => {
    const mockGit = {
      checkIsRepo: vi.fn().mockResolvedValue(true),
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
    const configWithoutKey = { ...mockConfig };
    delete configWithoutKey.apiKey;

    const mockGit = {
      diff: vi.fn().mockResolvedValue('diff content'),
    } as unknown as SimpleGit;

    await expect(generateAI(mockGit, configWithoutKey)).rejects.toThrow('API key is required');
  });
});

describe('truncateDiff', () => {
  it('should return the original diff if it is within budget', () => {
    const diff = 'diff --git a/file1 b/file1\nsome changes';
    expect(truncateDiff(diff, 100)).toBe(diff);
  });

  it('should truncate on file boundaries and append summary if budget is exceeded', () => {
    const file1 = 'diff --git a/file1 b/file1\ncontent 1'; // length 34
    const file2 = 'diff --git a/file2 b/file2\ncontent 2'; // length 34
    const file3 = 'diff --git a/file3 b/file3\ncontent 3'; // length 34
    const diff = file1 + file2 + file3; // length 102
    
    // For budget = 80:
    // candidate with file1 + file2 + '\n\n... 1 more files changed, not shown' (length 37)
    // = 34 + 34 + 37 = 105 > 80.
    // candidate with file1 + '\n\n... 2 more files changed, not shown' (length 38)
    // = 34 + 38 = 72 <= 80.
    // So only file1 fits.
    const result = truncateDiff(diff, 80);
    expect(result).toBe(file1 + '\n\n... 2 more files changed, not shown');
  });

  it('should slice the first file if even it does not fit the budget', () => {
    const file1 = 'diff --git a/file1 b/file1\nvery long content'; // length 42
    const file2 = 'diff --git a/file2 b/file2\ncontent 2';
    const diff = file1 + file2;

    // Budget = 30
    // Suffix for 1 remaining file is `\n\n... 1 more files changed, not shown` (length 37)
    // Since total length budget (30) < suffix length (37), availableBudget = 30 - 37 = -7 -> 0.
    // So it should slice to 0 and append suffix.
    expect(truncateDiff(diff, 30)).toBe('\n\n... 1 more files changed, not shown');

    // Budget = 40
    // Suffix length = 37. availableBudget = 40 - 37 = 3.
    // Expected result: file1.slice(0, 3) + suffix.
    expect(truncateDiff(diff, 40)).toBe(file1.slice(0, 3) + '\n\n... 1 more files changed, not shown');
  });

  it('should slice the single file if it is the only file and exceeds the budget', () => {
    const file1 = 'diff --git a/file1 b/file1\nvery long content'; // length 42
    
    // Budget = 30, only 1 file, no suffix needed because it is the last file
    expect(truncateDiff(file1, 30)).toBe(file1.slice(0, 30));
  });
});

