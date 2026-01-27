# Hayden's Claude Code Onboarding

Welcome! Here's how to be effective with Claude Code on this codebase without causing chaos.

---

## The Golden Rules

### 1. Always Work on a Branch
```bash
git checkout -b hayden/feature-name
```
Never commit directly to `main`. Claude can help you create PRs when ready.

### 2. Point Claude to the Right Context
Claude already reads `CLAUDE.md` automatically, but you can help by:
- Opening relevant files in VS Code before asking questions
- Being specific: "Update the event card in `FmEventCard.tsx`" not "update the card"
- If Claude asks for clarification, answer it - ambiguity causes mistakes

### 3. Let Claude Search First
For open-ended questions ("where does X happen?"), let Claude use its Explore agents. Don't guess file paths - Claude will find them.

---

## Key Files You Should Know

| File | What It Is |
|------|------------|
| `CLAUDE.md` | Claude's instruction manual for this repo |
| `docs/INDEX.md` | Master doc index - find anything here |
| `src/shared/constants/designSystem.ts` | Colors, spacing, typography rules |
| `src/shared/auth/permissions.ts` | Roles and permission constants |

---

## Codebase Gotchas

1. **Sharp corners only** - No `rounded-lg`. Use `rounded-none`.
2. **Gold is for hover** - Buttons are frosted glass by default, solid gold on hover only.
3. **All text through i18n** - Use `t('key')`, never hardcode strings. Update all 3 locale files (en/es/zh).
4. **No `any` types** - TypeScript strict mode. Fix types, don't cast.
5. **Use existing components** - Check `src/components/common/` before creating new ones. Everything is prefixed `Fm*`.

---

## Workflow Tips

### Starting a Task
```
"Hey Claude, I need to [task]. Can you explore the codebase first to understand how similar features work?"
```

### Before You Commit
Ask Claude to run:
```bash
npm run type-check
npm run build
```

### Creating a PR
Just ask: "Create a PR for this branch" - Claude handles the `gh` commands.

---

## When Things Go Wrong

- **Build fails?** Ask Claude to fix the type errors.
- **Tests fail?** Claude can run and fix them.
- **Not sure what Claude did?** Run `git diff` or ask Claude to explain.
- **Claude seems confused?** Be more specific or point it to the exact file.

---

## Quick Reference

```bash
npm run dev          # Start dev server (localhost:8080)
npm run build        # Production build
npm run type-check   # Check TypeScript
npm run lint         # Lint everything
```

---

That's it. When in doubt, ask Claude to check `docs/INDEX.md` for documentation on any topic. Happy coding!
