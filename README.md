# commitlg

A CLI tool that lints and generates commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) standard — straight from your staged `git diff`, so you don't have to think about the format every time you commit.

Developers often write lazy commit messages ("fix bug", "update", "wip") because getting the format right takes time and effort. `commitlg` reads your staged changes and:

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

**Option 1: Use with npx (always latest, no install needed)**

```bash
npx commitlg@latest generate
```

**Option 2: Install globally**

```bash
# Using npm
npm install -g commitlg

# Using pnpm
pnpm install -g commitlg

# Then use directly
clg generate
```

**Option 3: Local development**

```bash
git clone https://github.com/dhodo999/commit-lint-gen.git
cd commit-lint-gen
pnpm install
pnpm build
pnpm link --global .
```

### Configuration

**The tool works out of the box without any configuration** — it uses heuristic mode (pattern-based analysis) to generate commit messages.

**To enable AI-powered generation**, you need to provide your own API key. We recommend using [Groq](https://groq.com/) as it offers a free tier with fast inference.

**Quick Setup (Recommended):**

Run the interactive configuration wizard:

```bash
npx commitlg@latest config
```

This will guide you through:
- Choosing your AI provider (Groq/OpenAI)
- Entering your API key
- Selecting a model

The wizard creates a `.commitlintgenrc.json` file in your project.

**Manual Configuration:**

**Method 1: Project-level config file** (recommended for team projects)

Create `.commitlintgenrc.json` in your project root:

```json
{
  "apiKey": "your_groq_api_key_here",
  "aiProvider": "groq",
  "baseURL": "https://api.groq.com/openai/v1",
  "model": "qwen/qwen3.6-27b"
}
```

**Method 2: Environment variable** (for personal/local use)

```bash
# Linux/Mac
export GROQ_API_KEY=your_api_key_here

# Windows (PowerShell)
$env:GROQ_API_KEY="your_api_key_here"

# Or create a .env file
echo "GROQ_API_KEY=your_api_key_here" > .env
```

**Using other AI providers:**

The tool supports any OpenAI-compatible API. To use a different provider, adjust your config:

```json
{
  "apiKey": "your_api_key",
  "aiProvider": "openai",
  "baseURL": "https://api.openai.com/v1",
  "model": "gpt-4"
}
```

**Without API key:** The tool falls back to heuristic mode, which analyzes file patterns to generate commit messages.


### Usage

**Recommended Workflow:**

1. **One-time setup** - Install the validation hook:

```bash
cd /path/to/your-project
clg init
```

This installs a `commit-msg` hook that validates all commit messages against conventional commits format.

2. **Generate commits interactively** - Run `clg generate` to create AI-powered commit messages:

```bash
git add .
clg generate
```

The tool generates a draft commit message with an interactive prompt:

- **[Enter]** - Accept and commit immediately (no editor)
- **[e]** - Edit the message
- **[r]** - Regenerate with a new suggestion
- **[m]** - Manual mode (pick type/scope/description yourself)
- **[q]** - Cancel

3. **Or write manually** - The hook validates any commit:

```bash
git commit -m "feat(api): add user authentication"
```

If the message doesn't follow conventional commits format, the commit will be rejected with specific error messages.

#### CLI Commands

```bash
# Generate commit message interactively (AI with fallback to heuristic)
clg generate

# Auto-commit without interactive prompt
clg generate -y
clg generate --yes

# Force heuristic mode (skip AI even if API key exists)
clg generate -H
clg generate --heuristic

# Combine flags
clg generate -y -H              # Auto-commit with heuristic only

# Validate a commit message
clg lint "feat(api): add user authentication"

# Analyze recent commit history for conventional commit compliance
clg audit                       # Analyze last 20 commits (default)
clg audit -n 50                 # Analyze last 50 commits
clg audit --number 10           # Analyze last 10 commits

# Interactive configuration setup
clg config                      # Guided setup for AI provider and API key

# Install git hook
clg init

# Remove git hook from current repository
clg uninstall

# Show version
clg --version
clg -V

# Show help
clg --help
clg -h

# Show help for specific command
clg generate --help
clg lint --help
```

#### Interactive Mode Keys

When running `clg generate`, you'll see these options:

- **[Enter]** - Accept the suggested message and commit
- **[e]** - Edit the message in your editor
- **[r]** - Regenerate a new suggestion
- **[m]** - Manual mode (pick type/scope/description step-by-step)
- **[q]** - Cancel and exit without committing

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
# If installed globally
npm uninstall -g commitlg
# or
pnpm uninstall -g commitlg

# If linked from local dev
pnpm unlink --global commitlg
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

### Testing

The project includes comprehensive test coverage with 37 tests across:

- **Config loader** - Environment variables, default values, file loading
- **Linter rules** - Commit parsing, type/scope/length/description validation
- **Linter validation** - Full message validation, error collection
- **AI generator** - AI commit generation, error handling
- **Heuristic generator** - Pattern detection, type/scope inference

Run tests with:

```bash
pnpm test        # run all tests
pnpm test --watch  # run tests in watch mode
```

## Contributing

This project is open source and welcomes contributions — whether it's adding new lint rules, support for other AI providers, or fixing bugs. Feel free to open an issue or pull request.

## License

MIT