import { cosmiconfigSync } from 'cosmiconfig';
import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { defaultConfig, type Config } from './defaultConfig.js';

loadDotenv({ debug: false });

function getWslWindowsHome(): string | null {
    try {
        const winProfile = execSync('cmd.exe /c echo %USERPROFILE%', { stdio: ['ignore', 'pipe', 'ignore'] })
            .toString()
            .trim();
        if (!winProfile || winProfile === '%USERPROFILE%') return null;
        return execSync(`wslpath -u "${winProfile}"`, { stdio: ['ignore', 'pipe', 'ignore'] })
            .toString()
            .trim();
    } catch {
        return null;
    }
}

export function loadConfig(): Config {
    const explorer = cosmiconfigSync('commitlintgen');
    const globalConfig = join(homedir(), '.commitlintgenrc.json');
    const wslWinHome = getWslWindowsHome();
    const wslWinConfig = wslWinHome ? join(wslWinHome, '.commitlintgenrc.json') : null;
    const result =
        explorer.search() ??
        (existsSync(globalConfig) ? explorer.load(globalConfig) : null) ??
        (wslWinConfig && existsSync(wslWinConfig) ? explorer.load(wslWinConfig) : null);

    const fileConfig = result?.config ?? {};

    const merged: Config = {
        ...defaultConfig,
        ...fileConfig,
        apiKey: process.env.GROQ_API_KEY ?? process.env.apiKey ?? fileConfig.apiKey ?? defaultConfig.apiKey,
    };

    return merged;
}