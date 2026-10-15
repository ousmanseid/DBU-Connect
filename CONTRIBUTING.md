# Contributing to DBU Connect

Thank you for contributing to **DBU Connect**. This document provides guidelines and conventions for contributing to the repository.

---

## 1. Development Principles
- **Working Software First:** Every contribution should represent verified, working software with accompanying tests.
- **Security by Design:** Enforce server-side authorization on every endpoint. Never trust client-supplied input without server-side validation.
- **Truthful Commit History:** Maintain an honest, linear Git history with descriptive commit messages following the Conventional Commits specification.

---

## 2. Commit Message Conventions
Use the conventional commit format:
```
<type>(<scope>): <subject>
```
Common types:
- `feat`: A new feature for users
- `fix`: A bug fix
- `docs`: Documentation updates
- `refactor`: Code refactoring without changing behavior
- `test`: Adding or updating automated tests
- `chore`: Tooling, configuration, or dependency updates

Examples:
- `feat(auth): implement student registration and roster claim`
- `feat(posts): add post ownership authorization`
- `test(marketplace): cover listing save and duplicate prevention`
- `docs: add production deployment runbook`

---

## 3. Local Development Workflow
1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/ousmanseid/DBU-Connect.git
   cd DBU-Connect
   npm install
   ```
2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
3. Initialize the database and generate client:
   ```bash
   npx prisma db push
   ```
4. Seed synthetic demonstration data:
   ```bash
   npm run db:seed
   ```
5. Run the automated test suite:
   ```bash
   npm test
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

---

## 4. Submitting Pull Requests
1. Branch from `develop`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Ensure all tests pass (`npm test`) and the project builds cleanly (`npm run build`).
3. Commit with conventional commit messages.
4. Push and open a pull request into `develop` with testing evidence.
