# GitHub Copilot Instructions for Force Majeure

## Primary Reference

**All development guidelines, architectural patterns, design system rules, and coding standards are documented in [CLAUDE.md](../CLAUDE.md) at the project root.**

Please refer to CLAUDE.md for:
- Project architecture and structure
- Component naming conventions (Fm* prefix)
- Design system constants and styling rules
- Layout system requirements
- Import conventions
- TypeScript and React patterns
- Code organization and modularization guidelines
- Feature flag usage
- Permission and role management
- All other development standards

## Quick Reference

- **Design System**: Use constants from `/src/shared/constants/designSystem.ts` and utilities from `/src/shared/utils/styleUtils.ts`
- **Layouts**: All pages must use a layout component (typically `Layout` from `@/components/layout/Layout`)
- **Colors**: Only use FM design system colors (fm-gold, fm-crimson, fm-navy, fm-danger)
- **Spacing**: Use 5px increment scale (5, 10, 20, 40, 60)
- **Corners**: Default to sharp edges (`rounded-none`), avoid rounded corners
- **Components**: Prefix with `Fm` (specific) or `FmCommon` (reusable)

For complete details and examples, always check [CLAUDE.md](../CLAUDE.md).
