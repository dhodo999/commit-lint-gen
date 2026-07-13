import chalk from 'chalk';
import prompts from 'prompts';

export type CommitAction = 'accept' | 'edit' | 'regenerate' | 'manual' | 'cancel';

function clearScreen(): void {
    console.clear();
}

export function promptCommitAction(message: string, confidence?: string): Promise<CommitAction> {
    return new Promise((resolve) => {
        clearScreen();

        console.log('\nSuggested commit message:');
        console.log(`  ${chalk.green(message)}`);
        if (confidence) {
            console.log(chalk.dim(`\nConfidence: ${confidence}`));
        }
        console.log(
            `\n${chalk.bold('[Enter]')} accept   ${chalk.bold('[e]')} edit   ` +
            `${chalk.bold('[r]')} regenerate   ${chalk.bold('[m]')} manual mode   ` +
            `${chalk.bold('[q]')} cancel`
        );
        process.stdout.write('> ');

        const stdin = process.stdin;

        if (!stdin.isTTY) {
            console.log('(non-interactive detected, draft automatically accepted)');
            resolve('accept');
            return;
        }

        const wasRaw = stdin.isRaw;
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        const cleanup = () => {
            stdin.setRawMode(wasRaw ?? false);
            stdin.pause();
            stdin.removeListener('data', onData);
        };

        const onData = (key: string) => {
            // Ctrl+C force-exit raw mode
            if (key === '\u0003') {
                cleanup();
                process.exit(130);
            }

            if (key === '\r' || key === '\n') {
                cleanup();
                console.log();
                resolve('accept');
                return;
            }

            const lower = key.toLowerCase();
            if (lower === 'e' || lower === 'r' || lower === 'm' || lower === 'q') {
                cleanup();
                console.log(lower);
                resolve(
                    lower === 'e' ? 'edit' : lower === 'r' ? 'regenerate' : lower === 'm' ? 'manual' : 'cancel'
                );
                return;
            }
        };

        stdin.on('data', onData);
    });
}

/**
 * Edit mode: show draft as initial value that user can edit
 * in the terminal (use normal text prompt, waiting Enter button for submit).
 */
export async function editDraft(message: string): Promise<string | null> {
    clearScreen();

    const response = await prompts({
        type: 'text',
        name: 'message',
        message: 'Edit commit message',
        initial: message,
    });

    // response.message will be undefined if user cancel (Ctrl+C) in the middle of prompt
    return typeof response.message === 'string' ? response.message : null;
}

/**
 * Manual mode: ask for type, scope, description one by one.
 * Used as total fallback if user did not trust draft AI/heuristik.
 */
export async function manualEntry(): Promise<string | null> {
    clearScreen();

    const response = await prompts([
        {
            type: 'select',
            name: 'type',
            message: 'Select commit type',
            choices: [
                { title: 'feat', value: 'feat', description: 'A new feature' },
                { title: 'fix', value: 'fix', description: 'A bug fix' },
                { title: 'docs', value: 'docs', description: 'Documentation only' },
                { title: 'style', value: 'style', description: 'Formatting, no code change' },
                { title: 'refactor', value: 'refactor', description: 'Code change, not a feature or fix' },
                { title: 'test', value: 'test', description: 'Adding or updating tests' },
                { title: 'chore', value: 'chore', description: 'Tooling, build, or dependency changes' },
                { title: 'ci', value: 'ci', description: 'CI/CD configuration changes' },
                { title: 'perf', value: 'perf', description: 'Performance improvement' },
            ],
        },
        {
            type: 'text',
            name: 'scope',
            message: 'Scope (optional, press Enter to skip)',
        },
        {
            type: 'text',
            name: 'description',
            message: 'Short description',
            validate: (value: string) => (value.trim().length > 0 ? true : 'Please fill in the Description!'),
        },
    ]);

    // If user cancel (Ctrl+C) in one of the step, prompts will skip rest
    // of the fields, so type or description can be undefined
    if (!response.type || !response.description) return null;

    const scopePart = response.scope ? `(${response.scope})` : '';
    return `${response.type}${scopePart}: ${response.description}`;
}