#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { simpleGit } from 'simple-git';
import { loadConfig } from './config/loader.js';
import { runInteractiveGenerate } from './generator/index.js';
import { validateCommitMessage } from './linter/validate.js';
import { installGitHook, uninstallGitHook } from './hooks/install.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8')) as {
  version: string;
};

const program = new Command();
const config = loadConfig();
const git = simpleGit();

program
  .name('clg')
  .description('Generate and lint commit messages')
  .version(pkg.version);

program
  .command('generate')
  .description('Generate a commit message from staged changes')
  .argument('[CommitMsgFile]', 'Commit message file path (Automatically filled by git hook)')
  .option('-y, --yes', 'Auto-commit without interactive prompt')
  .option('-H, --heuristic', 'Use heuristic generation instead of AI')
  .action(async (commitMsgFile?: string, options?: { yes?: boolean; heuristic?: boolean }) => {
    try {
      await runInteractiveGenerate(git, config, commitMsgFile, options?.yes, options?.heuristic);
    } catch (error) {
      console.error('Error generating commit message:', error);
      process.exit(1);
    }
  });

program
  .command('lint')
  .description('Validate a commit message against conventional commit rules')
  .argument('<message>', 'Commit message to validate')
  .action((message: string) => {
    const result = validateCommitMessage(message, config);

    if (result.valid) {
      console.log('✓ Valid commit message');
      process.exit(0);
    } else {
      console.error('✗ Invalid commit message:\n');
      for (const error of result.errors) {
        console.error(`  [${error.rule}] ${error.message}`);
      }
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Install git hook in the current repository')
  .action(() => {
    try {
      installGitHook(process.cwd());
    } catch (error) {
      console.error('Error installing git hook:', error);
      process.exit(1);
    }
  });

program
  .command('uninstall')
  .description('Remove git hook from the current repository')
  .action(() => {
    try {
      uninstallGitHook(process.cwd());
    } catch (error) {
      console.error('Error uninstalling git hook:', error);
      process.exit(1);
    }
  });

program.parse();