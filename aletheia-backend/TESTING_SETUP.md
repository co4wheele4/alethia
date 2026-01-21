# Testing Setup & Recommendations

**Last Updated**: January 14, 2026

## ✅ Implemented Safeguards

### 1. **Testing Guidelines** (`test/TESTING_GUIDELINES.md`)
- Clear documentation on when e2e tests are required
- Test structure templates
- Code review checklist

### 2. **Pull Request Template** (optional)
- Included in this repo at `.github/pull_request_template.md`
- Use it for consistent reviewer/test checklists

### 3. **CI/CD Pipeline** (optional)
- Included in this repo under `.github/workflows/`
- Provides automated lint/test enforcement on PRs

### 4. **E2E Test Checker Script** (`scripts/check-e2e-tests.js`)
- Can be run manually: `npm run check:e2e`
- Can be integrated into pre-commit hooks
- Checks if new resolvers have corresponding e2e tests

## 📋 Usage

### Manual Check
```bash
# Check if changed files have e2e tests
npm run check:e2e

# Or check specific files
node scripts/check-e2e-tests.js src/graphql/resolvers/user.resolver.ts
```

### Git Hook Setup (Optional)

#### Option 1: Using Husky (Recommended)
```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run check:e2e"
```

#### Option 2: Using lint-staged
```bash
npm install --save-dev lint-staged
```

Add to `package.json`:
```json
{
  "lint-staged": {
    "*.resolver.ts": [
      "npm run check:e2e"
    ]
  }
}
```

#### Option 3: Manual Git Hook
Create `.git/hooks/pre-commit`:
```bash
#!/bin/sh
npm run check:e2e
if [ $? -ne 0 ]; then
  echo "❌ E2E test check failed. Please add e2e tests."
  exit 1
fi
```

## 🎯 Best Practices

### For Developers
1. **Before Committing**: Run `npm run check:e2e` to verify tests exist
2. **When Adding Resolvers**: Add e2e tests under `test/e2e/resolvers/` (or `test/e2e/cross-cutting/` for shared behavior)
3. **PR Checklist**: Use the PR template - it will remind you about tests
4. **Code Review**: Check that e2e tests cover new endpoints/resolvers

### For Code Reviewers
1. **Check PR Template**: Verify all checkboxes are completed
2. **Review Test Coverage**: Ensure new features have e2e tests
3. **Test Quality**: Verify tests cover happy paths and error cases
4. **CI Status**: Ensure all CI checks pass

### For CI/CD
1. **Automated Checks**: CI pipeline runs automatically on PRs
2. **E2E Coverage Warning**: CI will warn (not block) if tests are missing
3. **Test Results**: All test results are visible in PR status

## 🔧 Customization

### Adjusting CI Behavior
If you add CI workflows later, consider:
- Making e2e test checks required for resolver changes
- Adding coverage thresholds
- Adding additional test quality gates

### Adjusting Check Script
Edit `scripts/check-e2e-tests.js`:
- Change which files trigger the check
- Modify how tests are detected
- Add more sophisticated test validation

## 📊 Monitoring

### Test Coverage
- **Unit Tests**: Tracked in `coverage/` (enforced at 100%)
- **E2E Tests**: Tracked in `coverage-e2e/` (for reference)
- **CI Integration**: Optional (not configured in this repo)

### Test Health
- Monitor CI pipeline failures
- Track test execution time
- Review test coverage trends

## 🚀 Next Steps

1. **Review Guidelines**: Read `test/TESTING_GUIDELINES.md`
2. **Set Up Git Hooks** (Optional): Choose one of the options above
3. **Run Initial Check**: `npm run check:e2e` to see current status
4. **Update PR Template**: Customize `.github/pull_request_template.md` if needed
   - Note: a PR template is included

## 📝 Notes

- **E2E Coverage Limitation**: E2E coverage tracking has known limitations with HTTP requests in Jest
- **Focus on Quality**: Prioritize meaningful test coverage over coverage metrics
- **Balance**: Unit tests for logic, E2E tests for integration flows

