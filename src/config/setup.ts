import prompts from 'prompts';
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';

export async function interactiveSetup(): Promise<void> {
    console.log(chalk.bold('\nConfiguration Setup\n'));
    console.log('This will help you set up AI-powered commit message generation.\n');

    const response = await prompts([
        {
            type: 'select',
            name: 'provider',
            message: 'Choose your AI provider',
            choices: [
                { title: 'Groq (Recommended - Free tier available)', value: 'groq' },
                { title: 'OpenAI', value: 'openai' },
                { title: 'Skip AI setup (use heuristic mode only)', value: 'skip' }
            ],
            initial: 0
        },
        {
            type: (prev) => prev === 'skip' ? null : 'password',
            name: 'apiKey',
            message: 'Enter your API key',
            validate: (value: string) => value.trim().length > 0 ? true : 'API key cannot be empty'
        },
        {
            type: (prev, values) => values.provider === 'groq' ? 'select' : null,
            name: 'model',
            message: 'Choose a model',
            choices: [
                { title: 'qwen/qwen3.6-27b (Fast, recommended)', value: 'qwen/qwen3.6-27b' },
                { title: 'openai/gpt-oss-120b', value: 'openai/gpt-oss-120b' },
                { title: 'qwen/qwen3-32b', value: 'qwen/qwen3-32b' }
            ],
            initial: 0
        },
        {
            type: (prev, values) => values.provider === 'openai' ? 'select' : null,
            name: 'model',
            message: 'Choose a model',
            choices: [
                { title: 'gpt-4o-mini (Recommended)', value: 'gpt-4o-mini' },
                { title: 'gpt-4o', value: 'gpt-4o' },
                { title: 'gpt-4-turbo', value: 'gpt-4-turbo' }
            ],
            initial: 0
        }
    ]);

    if (!response.provider || response.provider === 'skip') {
        console.log(chalk.yellow('\n⚠ Skipping AI setup. The tool will use heuristic mode only.'));
        return;
    }

    const baseURLs: Record<string, string> = {
        groq: 'https://api.groq.com/openai/v1',
        openai: 'https://api.openai.com/v1'
    };

    const config = {
        apiKey: response.apiKey,
        aiProvider: response.provider,
        baseURL: baseURLs[response.provider],
        model: response.model
    };

    const configPath = join(process.cwd(), '.commitlintgenrc.json');

    if (existsSync(configPath)) {
        const overwrite = await prompts({
            type: 'confirm',
            name: 'value',
            message: 'Config file already exists. Overwrite?',
            initial: false
        });

        if (!overwrite.value) {
            console.log(chalk.yellow('\nSetup cancelled.'));
            return;
        }
    }

    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    // Add .commitlintgenrc.json to .gitignore if not already present
    const gitignorePath = join(process.cwd(), '.gitignore');
    const gitignoreEntry = '.commitlintgenrc.json';

    try {
        let gitignoreContent = '';
        if (existsSync(gitignorePath)) {
            gitignoreContent = require('node:fs').readFileSync(gitignorePath, 'utf-8');
        }

        if (!gitignoreContent.includes(gitignoreEntry)) {
            const newContent = gitignoreContent.trim()
                ? `${gitignoreContent.trim()}\n\n# commitlg - ignore config file with API keys\n${gitignoreEntry}\n`
                : `# commitlg - ignore config file with API keys\n${gitignoreEntry}\n`;
            writeFileSync(gitignorePath, newContent);
            console.log(chalk.green('✓ Added .commitlintgenrc.json to .gitignore'));
        }
    } catch (error) {
        console.log(chalk.yellow('⚠ Could not update .gitignore. Please add .commitlintgenrc.json manually.'));
    }

    console.log(chalk.green('\n✓ Configuration saved to .commitlintgenrc.json'));
    console.log(chalk.dim('\nYou can now use AI-powered commit generation with:'));
    console.log(chalk.cyan('  clg generate\n'));

    if (response.provider === 'groq') {
        console.log(chalk.dim('Get your free Groq API key at: https://console.groq.com/'));
    }
}
