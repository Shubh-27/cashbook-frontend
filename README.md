# CashBook Frontend

[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-5.0-orange.svg)](https://github.com/pmndrs/zustand)
[![TanStack Table](https://img.shields.io/badge/TanStack_Table-v8-FF4154.svg)](https://tanstack.com/table)

The modern, responsive user interface for CashBook, built with **React 19**, **TypeScript**, **Vite 6**, and **Tailwind CSS v4**.

---

## Table of Contents

- [Overview](#overview)
- [Key Features & Modules](#key-features--modules)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [API Integration](#api-integration)
- [Production Build](#production-build)
- [License](#license)

---

## Overview

The CashBook frontend is a Single-Page Application (SPA) designed specifically for a seamless desktop experience. It connects to the local ASP.NET Core backend at `http://localhost:5050` to render financial dashboards, transaction grids, and database management tools.

---

## Key Features & Modules

- **📊 Dashboard View**:
  - Real-time financial metrics: Total Income, Total Expenses, and Net Balance.
  - Interactive monthly summary breakdowns and account distribution cards.
  - Quick-action shortcuts for recording new transactions.
- **💳 Accounts Management**:
  - Comprehensive overview of all bank, cash, savings, and credit accounts.
  - Create, edit, and archive accounts with live balance updates.
- **📝 Transaction Ledger**:
  - Powered by **TanStack Table v8** for ultra-fast rendering of large datasets.
  - Multi-column sorting, pagination, and date range filtering.
  - Full-text search and account/category filters.
  - Excel import and export integration.
- **⚡ Description Autocomplete**:
  - Manage saved descriptions for frictionless transaction entry.
  - Search endpoint integration for instantaneous suggestions.
- **⚙️ Settings & Database Utilities**:
  - Create on-demand database backups and restore from backup files.
  - Seed sample demo data.
  - Check for application updates via Electron IPC.

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 6](https://vitejs.dev/) with `@vitejs/plugin-react` and `@tailwindcss/vite`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + `clsx` + `tailwind-merge` (`cn` utility)
- **Data Grids**: [TanStack Table v8](https://tanstack.com/table) (`@tanstack/react-table`)
- **State Management**: [Zustand 5](https://github.com/pmndrs/zustand)
- **UI Components & Primitives**: [Radix UI](https://www.radix-ui.com/) (Dialog, Popover, Command)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Date Utilities**: [date-fns](https://date-fns.org/)

---

## Project Structure

```text
frontend/
├── src/
│   ├── components/           # Reusable UI components (buttons, modals, stat cards, inputs)
│   ├── config/               # Application configuration & constants
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Shared utilities (e.g., cn utility for Tailwind classes)
│   ├── pages/                # Main application views
│   │   ├── accounts/         # Account list and management
│   │   ├── dashboard/        # Financial analytics and overview dashboard
│   │   ├── descriptions/     # Description suggestions management
│   │   ├── settings/         # Database backup/restore & app settings
│   │   └── transactions/     # TanStack table transaction ledger
│   ├── services/             # HTTP API client services (Accounts, Transactions, Database)
│   ├── store/                # Zustand global state stores
│   ├── types/                # TypeScript type definitions and API DTO models
│   ├── utils/                # Number, currency, and date formatting helpers
│   ├── App.tsx               # Root component & route definitions
│   ├── index.css             # Tailwind CSS tokens & global design system
│   └── main.tsx              # React DOM entry point
├── public/                   # Static assets (logo, favicons)
├── index.html                # HTML template
├── package.json              # Frontend dependencies and scripts
├── tsconfig.json             # TypeScript compiler configuration
└── vite.config.ts            # Vite build configuration
```

---

## Prerequisites

- **[Node.js](https://nodejs.org/)**: `v20.x` or higher
- **npm**: `v10.x` or higher

---

## Getting Started

### Installation

Install dependencies within the `frontend/` directory:

```bash
npm install
```

### Running Locally

To start the Vite development server:

```bash
npm run dev
```

The frontend will be accessible at:
```
http://localhost:5173
```

> **Note**: Ensure the backend API is running at `http://localhost:5050` so that API calls can resolve properly.

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| **Development** | `npm run dev` | Starts Vite dev server with hot module replacement (HMR) |
| **Build** | `npm run build` | Compiles TypeScript and creates optimized production bundle in `dist/` |
| **Type Check** | `npm run typecheck` | Runs `tsc -b` to validate TypeScript types without emitting files |
| **Lint** | `npm run lint` | Runs ESLint to check for code quality and style issues |
| **Preview** | `npm run preview` | Locally previews the production build |

---

## API Integration

The frontend communicates with the ASP.NET Core backend via HTTP requests. The base URL defaults to:

```
http://localhost:5050/api/v1
```

All API services in `src/services/` handle standardized responses, error mapping, and automatic data transformation for the Zustand state stores.

---

## Production Build

When building the full desktop application, the build scripts (`build.ps1` / `build.sh`) compile the frontend into static assets and output them to the Electron shell distribution folder (`electron/ui/`):

```bash
npm run build
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
