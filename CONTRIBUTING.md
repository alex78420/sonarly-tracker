# Contributing to Sonarly Tracker

Thank you for your interest in contributing to Sonarly!

## How to Contribute

### Reporting Bugs

- Use GitHub Issues to report bugs
- Include a clear description and reproduction steps
- Add browser/OS information

### Suggesting Features

- Open a GitHub Issue with the \enhancement\ label
- Explain the use case and benefits

### Pull Requests

1. Fork the repository
2. Create a feature branch: \git checkout -b feature/my-feature\
3. Make your changes
4. Run tests: \
pm test\
5. Commit with clear message: \git commit -m "Add feature X"\
6. Push: \git push origin feature/my-feature\
7. Open a Pull Request

## Development Setup

\\\ash
# Clone the repo
git clone https://github.com/alex78420/sonarly-tracker.git
cd sonarly-tracker

# Install dependencies
cd packages/session-replay
npm install

# Run tests
npm test

# Build
npm run build
\\\

## Code Style

- Use TypeScript
- Follow existing code style
- Run linter: \
pm run lint\
- Format code: \
pm run format\

## Testing

- Write tests for new features
- Ensure all tests pass: \
pm test\
- Maintain or improve coverage

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
