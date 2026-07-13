# commit-lint-gen

A CLI tool that lints and generates commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) standard — straight from your staged `git diff`, so you don't have to think about the format every time you commit.

Developers often write lazy commit messages ("fix bug", "update", "wip") because getting the format right takes time and effort. `commit-lint-gen` reads your staged changes and:

- **Validates** commit message format before the commit is accepted (linter)
- **Generates** a draft commit message based on diff analysis (generator), either through simple heuristics or AI

The result: a consistent, readable commit history that's ready to power automatic changelogs or semantic versioning.

## Key Features

- **Automatic linting** — validates commit messages against Conventional Commits via a git hook, rejecting the commit if the format is wrong
- **AI-assisted generation** — reads `git diff --staged` and produces a `type(scope): description` draft automatically
- **Heuristic fallback** — still generates a draft without an API key, based on changed file patterns
- **Flexible AI providers** — works with any OpenAI-compatible provider (Groq, OpenAI, local Ollama, etc.), just change the config
- **Zero-dependency git hook** — installs native hooks without extra packages like husky
- **Interactive mode** — accept, edit, or regenerate the draft before finalizing the commit
- **Simple configuration** — set your provider, model, and lint rules in a single `.commitlintgenrc.json` file

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js v22+ |
| Language | TypeScript |
| Package manager | pnpm |
| CLI framework | [Commander.js](https://github.com/tj/commander.js) |
| Git integration | [simple-git](https://github.com/steveukx/git-js) |
| Build tool | [Rslib](https://rslib.rs/) |
| AI client | [`openai` SDK](https://github.com/openai/openai-node) (OpenAI-compatible, default: [Groq](https://groq.com/) + Qwen3.6-27B) |
| Testing | [Vitest](https://vitest.dev/) |
| Linting/formatting | ESLint + Prettier |

## Getting Started

### Prerequisites

- Node.js version 20 or newer
- pnpm (`npm install -g pnpm`)
- Git

### Installation

```bash
git clone https://github.com/dhodo999/commit-lint-gen.git
cd commit-lint-gen
pnpm install
```

### Configuration

Copy `.env.example` to `.env` and fill in your AI provider's API key (optional — the tool still works without it via heuristic mode):

```bash
cp .env.example .env
```

```
GROQ_API_KEY=your_api_key_here
```

Adjust the provider and model in `.commitlintgenrc.json` as needed:

```json
{
  "aiProvider": "groq",
  "baseURL": "https://api.groq.com/openai/v1",
  "model": "qwen/qwen3.6-27b"
}
```

### Build & Link Locally

```bash
pnpm build
pnpm link --global .
```

### Usage

Install the git hook in the repo you want to use it with:

```bash
cd /path/to/your-project
clg init
```

From there, just commit as usual:

```bash
git add .
git commit
```

The tool will automatically generate a draft commit message. Press **Enter** to accept and commit, or use the interactive options:

- **[Enter]** - Accept and commit
- **[e]** - Edit the message
- **[r]** - Regenerate with a new suggestion
- **[m]** - Manual mode (pick type/scope/description yourself)
- **[q]** - Cancel

#### CLI Commands

```bash
# Generate commit message interactively (AI with fallback to heuristic)
clg generate

# Auto-commit without interactive prompt
clg generate -y

# Force heuristic mode (skip AI even if API key exists)
clg generate -H

# Validate a commit message
clg lint "feat(api): add user authentication"

# Install git hook
clg init

# Remove git hook
clg uninstall
```

## Uninstalling

**1. Remove git hooks from any repositories:**

```bash
cd /path/to/your-project
clg uninstall
```

**2. Unlink the global CLI:**

```bash
cd /path/to/commit-lint-gen
pnpm uninstall
```

Or from anywhere:

```bash
pnpm unlink --global commit-lint-gen
```

**3. Verify:**

```bash
clg --version  # Should show "command not found"
```

## Development

```bash
pnpm dev       # run the CLI directly from source (no build needed)
pnpm build     # build to dist/
pnpm test      # run tests
pnpm lint      # check code style
```

## Contributing

This project is open source and welcomes contributions — whether it's adding new lint rules, support for other AI providers, or fixing bugs. Feel free to open an issue or pull request.

## License

MIT