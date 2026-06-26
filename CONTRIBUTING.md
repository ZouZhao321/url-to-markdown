# Contributing

Thank you for your interest in contributing to url-to-markdown!

## Prerequisites

- Node.js >= 22.0.0
- pnpm (latest)

## Getting Started

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run tests to verify setup:
   ```bash
   pnpm test
   ```

## Development Workflow

```bash
pnpm dev       # Watch mode for development
pnpm test      # Run tests
pnpm build     # Build the project
pnpm lint      # Run ESLint
pnpm format    # Format code with Prettier
```

## Code Standards

- **Linting:** ESLint with TypeScript rules
- **Formatting:** Prettier (auto-fixed via pre-commit hook)
- **Pre-commit:** Husky + lint-staged automatically format and lint staged `.ts` files

## Git Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description
```

- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`
- Branch naming: `type/description` (e.g., `feat/dark-mode`)

## Pull Request Process

1. Create a branch from `main`: `git checkout -b feat/your-feature`
2. Make your changes
3. Ensure all checks pass: `pnpm lint && pnpm build && pnpm test`
4. Commit with a conventional commit message
5. Push and open a Pull Request

## Reporting Issues

- Use the **Bug Report** template for bugs
- Use the **Feature Request** template for new features
- Include reproduction steps and environment details

## License

By contributing, you agree that your contributions will be licensed under the [GNU Lesser General Public License v2.1](LICENSE).
