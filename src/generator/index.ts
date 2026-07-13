import { writeFileSync } from 'node:fs';
import type { SimpleGit } from 'simple-git';
import { generateHeuristicCommit } from './heuristic.js';
import { generateAICommit } from './ai.js';
import { promptCommitAction, editDraft, manualEntry } from './interactive.js';
import type { Config } from '../config/defaultConfig.js';

function formatMessage(type: string, scope: string | undefined, description: string): string {
    return scope ? `${type}(${scope}): ${description}` : `${type}: ${description}`;
}

async function generateCommit(git: SimpleGit, config: Config, useAI: boolean, forceHeuristic?: boolean) {
    if (!forceHeuristic && useAI && config.apiKey) {
        try {
            const result = await generateAICommit(git, config);
            return { ...result, confidence: 'high' as const };
        } catch (error) {
            console.log(`AI generation failed: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    return await generateHeuristicCommit(git);
}

/**
 * Main loop: generate draft -> preview -> wait user action -> repeat
 * until user press accept (write into commitMsgFile) or cancel (exit non-zero).
 *
 * commitMsgFile is filled if called by git hook prepare-commit-msg
 * (git gives file path through first argument). If called manually
 * through `clg generate` without hook, commitMsgFile undefined -> end result
 * only printed to stdout, not written to any file.
 */
export async function runInteractiveGenerate(git: SimpleGit, config: Config, commitMsgFile?: string, autoYes?: boolean, forceHeuristic?: boolean): Promise<void> {
    const useAI = !!config.apiKey;
    const initial = await generateCommit(git, config, useAI, forceHeuristic);
    let draft = formatMessage(initial.type, initial.scope, initial.description);
    let confidence: string | undefined = initial.confidence;

    // Auto-commit mode: commit immediately without interactive prompt
    if (autoYes) {
        await git.commit(draft);
        console.log(`Committed: ${draft}`);
        console.log(`\nDon't forget to push your commits!`);
        return;
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const action = await promptCommitAction(draft, confidence);

        if (action === 'accept') {
            if (commitMsgFile) {
                writeFileSync(commitMsgFile, draft + '\n');
            } else {
                // Interactive mode: commit with the generated message
                await git.commit(draft);
                console.log(`\nCommitted: ${draft}`);
                console.log(`\nDon't forget to push your commits!`);
            }
            return;
        }

        if (action === 'edit') {
            const edited = await editDraft(draft);
            if (edited !== null) {
                draft = edited;
                confidence = undefined;
            }
            continue;
        }

        if (action === 'regenerate') {
            const result = await generateCommit(git, config, useAI, forceHeuristic);
            draft = formatMessage(result.type, result.scope, result.description);
            confidence = result.confidence;
            continue;
        }

        if (action === 'manual') {
            const manual = await manualEntry();
            if (manual !== null) {
                draft = manual;
                confidence = undefined;
            }
            continue;
        }

        if (action === 'cancel') {
            console.log('Cancelled, did not continue commit.');
            process.exit(1);
        }
    }
}