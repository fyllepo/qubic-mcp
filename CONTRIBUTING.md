# Contributing to qubic-mcp

Thank you for your interest in contributing! This project is open to everyone and we appreciate all forms of help.

## Ways to Contribute

- **Report bugs** — Open an issue using the bug report template
- **Suggest features** — Open an issue using the feature request template
- **Submit code** — Fix a bug, add a feature, or improve existing code
- **Improve docs** — Fix typos, add examples, clarify explanations
- **Review PRs** — Help review open pull requests

## Development Setup

```bash
# Clone the repo
git clone https://github.com/fyllepo/qubic-mcp.git
cd qubic-mcp

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Test with MCP Inspector
npm run inspect
```

## Code Style

- Code is formatted with **Prettier** and linted with **ESLint** — both are enforced in CI.
- Run `npm run lint:fix && npm run format` before committing.
- TypeScript strict mode is enabled. No `any` types.

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add get_qx_orderbook tool
fix: handle empty balance response correctly
docs: update Quick Start section
test: add tests for get_balance tool
chore: update dependencies
```

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes with tests
3. Ensure `npm run build && npm run lint && npm test` all pass
4. Open a PR with a clear description of what and why
5. Respond to review feedback

## Security

If you find a security vulnerability, **do not open a public issue**. See [SECURITY.md](SECURITY.md) for responsible disclosure instructions.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.
