# Code Review Prompt Template

Use this template when performing code reviews for QUANTA.

## Review Request

**Files to Review**: [List file paths]

**Type of Change**: [Feature/Bug Fix/Refactoring/Other]

**Description**: [What does this code do?]

## Review Checklist

### Security ⚠️
- [ ] No hardcoded secrets or API keys
- [ ] User input is validated
- [ ] User isolation (userId) enforced
- [ ] No injection vulnerabilities (XSS, SQL)
- [ ] Authentication checks present
- [ ] Sensitive data not logged

### Code Quality ✅
- [ ] TypeScript strict mode compliant
- [ ] No `any` types used
- [ ] Proper error handling
- [ ] No unused variables/imports
- [ ] Follows naming conventions
- [ ] Single responsibility per function
- [ ] DRY principle followed

### Performance 🚀
- [ ] useMemo for expensive calculations
- [ ] useCallback for event handlers
- [ ] No unnecessary re-renders
- [ ] Efficient algorithms (no nested loops)
- [ ] Proper cleanup in useEffect

### Patterns 🏗️
- [ ] Uses storageService (not direct Firebase)
- [ ] Uses aiGateway for AI client
- [ ] Custom hooks for reusable logic
- [ ] Services for business logic
- [ ] Pure functions in utils/

### Testing 🧪
- [ ] Tests added for new features
- [ ] Edge cases covered
- [ ] Error states tested
- [ ] Loading states tested

### Accessibility ♿
- [ ] Semantic HTML used
- [ ] ARIA labels on icons
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Color contrast adequate

## Review Format

### Critical Issues ❌
[List any security vulnerabilities or breaking changes]

### High Priority ⚠️
[List major issues that should be fixed]

### Medium Priority 📝
[List improvements that would enhance quality]

### Low Priority 💡
[List nice-to-have improvements]

### Positive Feedback ✨
[Highlight what was done well]

## Recommendations

[Provide specific, actionable recommendations]

## Verdict

- [ ] ✅ **APPROVED** - Ready to merge
- [ ] 🔄 **CHANGES REQUESTED** - Address issues and re-review
- [ ] ❌ **BLOCKED** - Critical issues must be fixed
