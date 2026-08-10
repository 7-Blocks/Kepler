# Contributing to Kepler

We're thrilled you're here! Kepler is an AI-powered space traffic management platform, and we welcome contributions from developers of all experience levels. This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to uphold a welcoming, inclusive, and respectful environment for everyone. Be direct, be kind, and be technically honest. Disagreement on technical decisions is welcome — personal attacks are not.

## Getting Started

### Prerequisites

- **Node.js 18+** and **npm/yarn** (for frontend)
- **Python 3.10+** and **pip** (for backend)
- **Git**
- Basic familiarity with **React**, **TypeScript**, and **FastAPI**

### 1. Fork the Repository

Click the Fork button on the top-right of the [Kepler repository page](https://github.com/7-Blocks/Kepler).

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/Kepler.git
cd Kepler
```

### 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/7-Blocks/Kepler.git
```

### 4. Create a Branch

```bash
git checkout -b feat/your-feature-name
```

Branch naming convention: `kind/short-description` where `kind` is one of:
- `feat/` — new features
- `fix/` — bug fixes
- `docs/` — documentation changes
- `refactor/` — code improvements without functional changes
- `test/` — adding or updating tests
- `chore/` — maintenance tasks

## Development Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` (Vite default).

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

The backend API will be available at `http://localhost:8000`.

### Environment Variables

Create a `.env` file in the `backend/` directory with the required configuration:

```bash
# backend/.env
DATABASE_URL=sqlite:///./kepler.db
SECRET_KEY=your-secret-key
```

## Project Structure

```
Kepler/
├── frontend/             # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API client services
│   │   ├── store/        # State management
│   │   └── styles/       # CSS/styling
│   └── public/           # Static assets
├── backend/              # Python FastAPI backend
│   ├── app/              # Application entry point
│   │   ├── core/         # Config, error handling, scheduler
│   │   └── tasks/        # Background tasks
│   ├── api/              # API route definitions
│   ├── models/           # Data models / ORM
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   ├── websocket/        # WebSocket connection manager
│   ├── orbital/          # Orbital mechanics
│   ├── ai/               # AI/ML components
│   └── database/         # Database setup and migrations
├── .github/              # GitHub templates and workflows
├── .vercel/              # Vercel deployment config
└── vercel.json           # Deployment configuration
```

## How to Contribute

### Good First Issues

Look for issues tagged [`good-first-issue`](https://github.com/7-Blocks/Kepler/labels/good%20first%20issue). These are scoped to be approachable for new contributors.

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/7-Blocks/Kepler/issues).
2. If not, open a new issue using the **Bug Report** template.
3. Include:
   - A clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, versions)

### Suggesting Features

1. Open a **Feature Request** issue using the template.
2. Describe the feature, its use case, and how it benefits the platform.
3. Tag it with the `enhancement` label.

### Documentation

Improvements to README, inline comments, API docs, and setup guides are always welcome. Tag PRs with `docs`.

## Pull Request Guidelines

### Before You PR

- Ensure your branch is up to date with `main`:
  ```bash
  git fetch upstream
  git rebase upstream/main
  ```
- Run tests to confirm nothing is broken.
- Keep changes focused — one feature/fix per PR.
- Keep the diff under ~400 lines when possible. Larger changes should be discussed in an issue first.
- Please read our [Code of Conduct](CODE_OF_CONDUCT.md) to maintain a respectful and welcoming community.

### PR Checklist

- [ ] Code follows the project's coding standards
- [ ] Tests added/updated for new behavior
- [ ] Documentation updated (if applicable)
- [ ] PR description clearly explains what and why
- [ ] No new warnings or errors introduced

### PR Title Format

```
<type>: <brief description>
```

Examples:
- `feat: add satellite conjunction visualization`
- `fix: correct orbital period calculation`
- `docs: update API endpoint documentation`

### PR Description Template

```markdown
## What this PR does
[Brief description of changes]

## How to test
1. [Step 1]
2. [Step 2]

## Screenshots (if applicable)
[Link or embedded image]

## Related issues
Closes #N
```

### Review Process

1. A maintainer will review your PR within a few days.
2. Address any feedback by pushing additional commits to the same branch.
3. Once approved, a maintainer will merge your PR.

## Coding Standards

### Frontend (React + TypeScript)

- Use **TypeScript** for all new files.
- Follow React best practices: functional components, hooks, proper state management.
- Format with **Prettier** (default config).
- Use meaningful component and variable names.
- Keep components focused and modular.

### Backend (Python + FastAPI)

- Follow **PEP 8** style guidelines.
- Use descriptive function and variable names.
- Include type hints and Pydantic schemas for request/response models.
- Include docstrings for public functions and classes.
- Keep route handlers thin — business logic belongs in services.

### Git Commits

- Use imperative mood: "Add feature" not "Added feature" or "Adding feature".
- One logical change per commit.
- Reference issues in commit body when applicable: `Closes #N`.

## Testing

### Frontend Tests

```bash
cd frontend
npm test
```

### Backend Tests

```bash
cd backend
python -m pytest tests/
```

### Manual Testing

Before submitting your PR, test the full stack locally:

1. Start the backend: `cd backend && python app.py`
2. Start the frontend: `cd frontend && npm run dev`
3. Verify the feature works end-to-end.

## Issue Reporting

When opening an issue, please use the appropriate template:

| Issue Type | Template | Labels |
|------------|----------|--------|
| Bug Report | `.github/ISSUE_TEMPLATE/bug_report.yml` | `type:bug` |
| Feature Request | `.github/ISSUE_TEMPLATE/feature_request.yml` | `type:enhancement` |
| Documentation | `.github/ISSUE_TEMPLATE/documentation.yml` | `type:documentation` |
| Security | `.github/ISSUE_TEMPLATE/security.yml` | `security` |

## Community

- **Discussions**: Use [GitHub Discussions](https://github.com/7-Blocks/Kepler/discussions) for questions and ideas.
- **Mentors**: Issues tagged with `mentor:*` have a designated mentor to help you through the contribution process.

---

Thank you for contributing to Kepler! Every contribution — no matter how small — helps make space safer for everyone. 🚀
