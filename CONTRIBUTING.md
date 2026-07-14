# Contributing to commitlg

Thanks for your interest in contributing to commitlg! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 22 or newer
- pnpm (`npm install -g pnpm`)
- Git

### Getting Started

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/commit-lint-gen.git
cd commit-lint-gen
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Link the CLI locally**

```bash
pnpm build
pnpm link --global .
```

Now you can use `clg` commands from anywhere to test your changes.

### Development Workflow

```bash
# Run the CLI directly from source (no build needed)
pnpm dev

# Build the project
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Lint code
pnpm lint
```

## Project Structure

```
commit-lint-gen/
├── src/
│   ├── cli.ts              # CLI entry point and command definitions
│   ├── audit/              # Commit history analysis
│   ├── config/             # Configuration loading and setup
│   ├── generator/          # AI and heuristic commit message generation
│   ├── hooks/              # Git hook installation
│   └── linter/             # Commit message validation rules
├── dist/                   # Build output
└── tests/                  # Test files
```

## Making Changes

### Before You Start

1. Check existing issues or create one to discuss your proposed changes
2. For new features, consider opening a discussion first
3. Make sure you understand the Conventional Commits specification

### Code Style

- Use TypeScript for all new code
- Follow the existing code style (enforced by ESLint)
- Keep functions focused and testable
- Add tests for new functionality
- Write clear commit messages following Conventional Commits

### Testing

All contributions should include tests. The project uses Vitest for testing.

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

Test coverage includes:
- Config loading and validation
- Linter rules and validation
- AI and heuristic generators
- CLI command behavior

### Commit Messages

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. Use the tool itself to generate commit messages:

```bash
git add .
clg generate
```

Format: `type(scope): description`

Common types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `chore`: Maintenance tasks

### Pull Request Process

1. **Create a feature branch**

```bash
git checkout -b feat/your-feature-name
```

2. **Make your changes**
   - Write code
   - Add tests
   - Update documentation if needed

3. **Test your changes**

```bash
pnpm lint
pnpm test
pnpm build
```

4. **Commit your changes**

```bash
git add .
clg generate  # Use the tool to generate commit messages
```

5. **Push to your fork**

```bash
git push -u origin feat/your-feature-name
```

6. **Open a Pull Request**
   - Use the PR template
   - Provide a clear description of changes
   - Link related issues
   - Ensure CI checks pass

### PR Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation for user-facing changes
- Add tests for new functionality
- Ensure all tests pass
- Follow the existing code style
- Respond to review feedback promptly

## Areas for Contribution

### Good First Issues

Look for issues labeled `good first issue` for beginner-friendly tasks:
- Documentation improvements
- Adding test coverage
- Small bug fixes

### Feature Ideas

- New lint rules for commit validation
- Support for additional AI providers
- Enhanced heuristic patterns
- CLI improvements and new commands
- Better error messages and user feedback

### Known Needs

- More comprehensive test coverage
- Performance optimizations
- Better documentation and examples
- CI/CD improvements

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues and PRs before creating new ones
- Ask questions in issue discussions

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers and help them learn
- Focus on what's best for the project
- Accept constructive criticism gracefully

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
