# Cashbook Frontend

The responsive user interface for the Cashbook application, built with React, Vite, and Tailwind CSS.

## Features

- **Component-Driven Architecture**: Built with modern React and Radix UI primitives.
- **Fast Build Times**: Powered by Vite and TypeScript.
- **State Management**: Managed with Zustand for efficient and predictable state updates.
- **Data Grids**: High-performance tables provided by TanStack Table.
- **Styling**: Utility-first CSS with Tailwind and standard design system integration.

## Project Structure

- `src/`: Core logic, components, and pages for the application.
- `public/`: Static assets such as images and fonts.
- `index.html`: Main entry point for the single-page application.
- `vite.config.ts`: Configuration for Vite development and build processes.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)

### Running the Frontend

From the root project:

```bash
npm run dev:frontend
```

Or from the `frontend` directory:

```bash
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

Note: The frontend expects the backend API at `http://localhost:5050`. Ensure the backend is running if data interaction is required.

## Build for Production

To create a static production bundle of the frontend:

```bash
npm run build
```

The output will be generated in the `dist/` directory (note: this is often used by the Electron distribution scripts).

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
