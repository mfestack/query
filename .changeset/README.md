# Changesets

This directory contains changesets for this repository. 

## What are changesets?

Changesets are files that describe changes to packages. They are used to:
- Track what changes were made
- Automatically update version numbers
- Generate changelogs

## How to use

1. Create a new changeset: `pnpm changeset`
2. Follow the prompts to describe your changes
3. Commit the changeset file
4. When ready to release, run `pnpm changeset:version` to update versions
5. Run `pnpm changeset:publish` to publish packages

## Changeset types

- **major**: Breaking changes
- **minor**: New features
- **patch**: Bug fixes and small improvements

