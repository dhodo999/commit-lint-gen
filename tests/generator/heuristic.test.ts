import { describe, it, expect, vi } from 'vitest';
import { generateHeuristicCommit } from '../../src/generator/heuristic.js';
import type { SimpleGit } from 'simple-git';

describe('heuristic generator', () => {
  it('should generate feat type for new files', async () => {
    const mockGit = {
      checkIsRepo: vi.fn().mockResolvedValue(true),
      diff: vi.fn().mockResolvedValue(`10	0	src/components/Button.tsx
5	0	src/components/Input.tsx`),
    } as unknown as SimpleGit;

    const result = await generateHeuristicCommit(mockGit);

    expect(result.type).toBe('feat');
    expect(result.scope).toBe('components');
    expect(result.description).toContain('components');
  });

  it('should generate test type for test files', async () => {
    const mockGit = {
      checkIsRepo: vi.fn().mockResolvedValue(true),
      diff: vi.fn().mockResolvedValue(`15	0	src/utils/parser.test.ts
8	0	src/utils/validator.test.ts`),
    } as unknown as SimpleGit;

    const result = await generateHeuristicCommit(mockGit);

    expect(result.type).toBe('test');
    expect(result.description).toContain('test');
  });

  it('should generate docs type for documentation files', async () => {
    const mockGit = {
      checkIsRepo: vi.fn().mockResolvedValue(true),
      diff: vi.fn().mockResolvedValue(`20	5	README.md
10	2	docs/guide.md`),
    } as unknown as SimpleGit;

    const result = await generateHeuristicCommit(mockGit);

    expect(result.type).toBe('docs');
    expect(result.description).toBe('update documentation');
  });

  it('should generate chore type for package.json changes', async () => {
    const mockGit = {
      checkIsRepo: vi.fn().mockResolvedValue(true),
      diff: vi.fn().mockResolvedValue(`3	2	package.json
100	50	pnpm-lock.yaml`),
    } as unknown as SimpleGit;

    const result = await generateHeuristicCommit(mockGit);

    expect(result.type).toBe('chore');
    expect(result.description).toBe('update dependencies');
  });

  it('should handle empty diff', async () => {
    const mockGit = {
      checkIsRepo: vi.fn().mockResolvedValue(true),
      diff: vi.fn().mockResolvedValue(''),
    } as unknown as SimpleGit;

    const result = await generateHeuristicCommit(mockGit);

    expect(result.type).toBe('chore');
    expect(result.description).toBe('update files');
    expect(result.confidence).toBe('low');
  });

  it('should infer refactor for deletions', async () => {
    const mockGit = {
      checkIsRepo: vi.fn().mockResolvedValue(true),
      diff: vi.fn().mockResolvedValue(`0	50	src/old/legacy.ts
0	30	src/old/deprecated.ts`),
    } as unknown as SimpleGit;

    const result = await generateHeuristicCommit(mockGit);

    expect(result.type).toBe('refactor');
    expect(result.description).toContain('remove');
  });

  it('should have high confidence for single file changes', async () => {
    const mockGit = {
      checkIsRepo: vi.fn().mockResolvedValue(true),
      diff: vi.fn().mockResolvedValue(`10	5	src/utils/helper.ts`),
    } as unknown as SimpleGit;

    const result = await generateHeuristicCommit(mockGit);

    expect(result.confidence).toBe('high');
  });
});
