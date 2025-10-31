# Installation

MFestack Query is a collection of packages designed to work together.

## Package Overview

| Package | Description |
|---------|-------------|
| `@mfestack/core` | Framework-agnostic core engine |
| `@mfestack/react` | React hooks and components |
| `@mfestack/vue` | Vue composables and components |
| `@mfestack/angular` | Angular services and directives |
| `@mfestack/svelte` | Svelte stores and components |
| `@mfestack/solid` | Solid primitives and components |
| `@mfestack/devtools-core` | DevTools engine (framework-agnostic) |
| `@mfestack/react-devtools` | React DevTools UI |

## Installation Methods

### npm

```bash
npm install @mfestack/core @mfestack/react
```

### pnpm

```bash
pnpm add @mfestack/core @mfestack/react
```

### yarn

```bash
yarn add @mfestack/core @mfestack/react
```

## Framework-Specific Installation

### React

```bash
npm install @mfestack/core @mfestack/react
```

### Vue

```bash
npm install @mfestack/core @mfestack/vue
```

### Angular

```bash
npm install @mfestack/core @mfestack/angular
```

## TypeScript

MFestack Query is built with TypeScript and includes type definitions out of the box. No additional `@types` packages are required.

## Peer Dependencies

### React

- `react`: `^18 || ^19`

### Vue

- `vue`: `^3.0.0`

## Optional Dependencies

Some features require additional packages:

- **DevTools**: `@mfestack/react-devtools` (for React DevTools UI)
- **Persistence**: Built-in plugins, no extra dependencies
- **Broadcast**: Built-in plugins, no extra dependencies

