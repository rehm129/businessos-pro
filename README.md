# BusinessOS Pro

**A local-first business management system for desktop and web
workflows.**

BusinessOS Pro is designed to bring everyday business operations into
one interface. The project configuration describes POS, inventory,
multi-store support, supplier and customer management, and offline data
storage.

> **Project status:** This README is based on the repository
> configuration files currently available. Review the actual `src/` and
> `electron/` implementation before treating every listed business
> feature as fully implemented. Database persistence, synchronization,
> authentication, backups, and deployment behavior depend on the source
> code and runtime configuration.

## Table of contents

-   [Overview](#overview)
-   [Capabilities](#capabilities)
-   [Technology stack](#technology-stack)
-   [Requirements](#requirements)
-   [Get the project](#get-the-project)
-   [Install dependencies](#install-dependencies)
-   [Environment configuration](#environment-configuration)
-   [Run in development](#run-in-development)
-   [Production build](#production-build)
-   [Build the Windows app](#build-the-windows-app)
-   [Available commands](#available-commands)
-   [Testing and code checks](#testing-and-code-checks)
-   [Project structure](#project-structure)
-   [Data, privacy, and security](#data-privacy-and-security)
-   [Troubleshooting](#troubleshooting)
-   [Contributing](#contributing)
-   [License](#license)

## Overview

BusinessOS Pro aims to provide a practical workspace for business
operations, with a local-first approach. The repository is configured
for a React/Vite web interface and an Electron desktop build for
Windows.

The project also includes the Google GenAI SDK. AI features may require
a valid Gemini API key and must be verified in the application source
before use.

## Capabilities

The project metadata describes the following intended capabilities:

-   **Point of Sale (POS):** sales and checkout workflows.
-   **Inventory management:** tracking products or stock.
-   **Multi-store support:** working with more than one store or
    location.
-   **Supplier management:** maintaining supplier information.
-   **Customer management:** maintaining customer information.
-   **Offline/local storage:** the project includes `sql.js`, a
    SQLite/WebAssembly library, but the exact persistence and offline
    behavior should be confirmed in the source code.
-   **Web and desktop packaging:** Vite is configured for
    development/building, and Electron Builder is configured for Windows
    installer and portable targets.
-   **AI integration:** the project includes `@google/genai`; AI
    functionality requires valid configuration and implementation.

These bullets describe the project scope from the available metadata and
dependencies. They do not guarantee that every workflow is complete or
production-ready.

## Technology stack

  Technology         Purpose indicated by the repository
  ------------------ -------------------------------------
  React              User interface
  Vite               Development server and web build
  TypeScript         Type checking and typed source
  Tailwind CSS       Styling
  Electron           Desktop application shell
  Electron Builder   Windows packaging
  `sql.js`           SQLite/WebAssembly database library
  Google GenAI SDK   Gemini/Google AI integration
  Recharts           Charts and data visualization
  Vitest             Automated tests
  Zod                Schema validation

## Requirements

Install these before starting:

-   **Node.js:** use a version compatible with the Vite, TypeScript, and
    Electron versions in `package.json`. The Electron build scripts
    target Node 22; check current compatibility if your local Node
    version differs.
-   **npm** (included with Node.js), or **Bun** if you intend to use the
    included `bun.lock`.
-   **Git** to clone and update the repository.
-   **Windows 64-bit** for the configured Windows installer build.
-   A **Gemini API key** only if the application's AI features require
    it.

Check installed versions:

``` bash
node --version
npm --version
git --version
```

If you use Bun:

``` bash
bun --version
```

## Get the project

Replace `YOUR-USERNAME` and `YOUR-REPOSITORY` with the actual GitHub
owner and repository name.

``` bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd YOUR-REPOSITORY
```

Alternatively, on GitHub select **Code → Download ZIP**, extract the
archive, and open the extracted project folder in a terminal.

## Install dependencies

Choose one package manager for a given working copy.

### npm

``` bash
npm install
```

### Bun

``` bash
bun install
```

The repository includes `bun.lock`, so Bun is an option. Avoid switching
package managers repeatedly in the same checkout because it can create
lockfile differences.

## Environment configuration

The repository contains an `.env.example` file with these variables:

``` dotenv
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="MY_APP_URL"
```

### Set up your local environment

1.  Create a local `.env` file in the project root by copying
    `.env.example`.
2.  Replace the example Gemini value with your own key if AI
    functionality requires it.
3.  Set `APP_URL` to the actual hosted application URL if the code
    requires it. For local development, check the source code to
    determine whether it expects a value such as
    `http://localhost:3000`.
4.  Save the file and restart the development server after changing
    environment variables.

On Windows PowerShell:

``` powershell
Copy-Item .env.example .env
```

On macOS/Linux:

``` bash
cp .env.example .env
```

**Keep secrets private.** Never commit a real `.env` file, API key,
access token, or other secret to GitHub. The repository's `.gitignore`
ignores `.env*` files while allowing `.env.example`.

### Important note about AI Studio

The comments in `.env.example` say that Google AI Studio can inject
`GEMINI_API_KEY` and `APP_URL` at runtime in its hosting environment.
Those automatic values may not exist when running the project locally or
on a different hosting provider. Configure the variables according to
the environment you actually use.

Do not expose a private API key in frontend code or a public repository.
Confirm that sensitive AI requests are handled server-side before
deploying.

## Run in development

Start the Vite development server:

``` bash
npm run dev
```

Or with Bun:

``` bash
bun run dev
```

The configured Vite command uses port **3000** and binds to `0.0.0.0`.
Open this address in your browser:

**http://localhost:3000**

Stop the server with `Ctrl + C`.

> This command starts the Vite development server. It does not, by
> itself, prove that an Electron desktop window or a separate API server
> is running.

## Production build

Create the optimized web build:

``` bash
npm run build
```

Or:

``` bash
bun run build
```

Vite normally writes the generated web assets to `dist/`, as expected by
the configured Electron packaging files.

To preview the built web app locally:

``` bash
npm run preview
```

The preview command serves the built web output. It is not the same as
publishing the app to a public hosting provider.

## Build the Windows app

The `package.json` defines Electron main/preload build scripts and a
Windows x64 packaging command.

### Build the Electron app

``` bash
npm run electron:build
```

This command first builds the web assets, then bundles the Electron main
and preload TypeScript files into `dist-electron/`.

### Create Windows packages

On a compatible Windows build environment, run:

``` bash
npm run build:win
```

The configuration requests Windows x64 **NSIS installer** and
**portable** targets. The output directory is configured as `release/`,
and the configured artifact name is `BusinessOS-Pro-Setup.exe`.

Exact filenames and whether both targets are emitted can depend on
Electron Builder's output behavior and successful completion. Check the
`release/` directory after the build.

**Before distributing:** test the generated app on a clean Windows
machine, confirm database behavior and persistence, verify API-key
handling, and ensure that any required runtime assets are packaged.

## Available commands

Run these from the repository root.

  -----------------------------------------------------------------------
  Command                             Purpose
  ----------------------------------- -----------------------------------
  `npm run dev`                       Start Vite development server on
                                      port 3000

  `npm run build`                     Build the web application

  `npm run preview`                   Preview the web build locally

  `npm run test`                      Run Vitest tests once

  `npm run test:watch`                Run Vitest in watch mode

  `npm run lint`                      Run `tsc --noEmit` for TypeScript
                                      checking

  `npm run electron:build:main`       Bundle the Electron main process

  `npm run electron:build:preload`    Bundle the Electron preload script

  `npm run electron:build`            Build web assets and Electron
                                      main/preload files

  `npm run build:win`                 Build Windows x64 packages

  `npm run clean`                     Remove generated build/output
                                      directories (script uses `rm -rf`)
  -----------------------------------------------------------------------

**Windows note:** the `clean` script uses `rm -rf`, which is commonly
available in Unix-like shells but may not work in standard Windows
Command Prompt or PowerShell. Use a compatible shell or remove generated
folders manually after confirming you do not need them.

## Testing and code checks

Run the configured test suite:

``` bash
npm run test
```

Run tests continuously while developing:

``` bash
npm run test:watch
```

Run TypeScript checks:

``` bash
npm run lint
```

A passing test command only verifies tests that actually exist and are
discovered by Vitest. A passing TypeScript command does not replace
manual testing of sales, inventory, store management, data persistence,
or packaged desktop workflows.

## Project structure

The following paths are referenced by the configuration. Your repository
may contain additional files and folders.

``` text
project-root/
├── src/
│   └── main.tsx              # Vite entry point referenced by index.html
├── electron/
│   ├── main.ts               # Electron main source referenced by build script
│   └── preload.ts            # Electron preload source referenced by build script
├── dist/                     # Generated web build
├── dist-electron/            # Generated Electron bundles
├── release/                  # Windows packaging output
├── index.html                # HTML entry point and page metadata
├── package.json              # Scripts, dependencies, and packaging settings
├── bun.lock                  # Bun dependency lockfile
├── .env.example              # Environment variable template
├── .gitignore                # Files excluded from Git
└── README.md                 # Project documentation
```

The `src/` and `electron/` files shown above are referenced by the
project configuration; confirm they exist in your repository. Generated
folders such as `dist/`, `dist-electron/`, and `release/` are build
outputs and generally should not be committed.

## Data, privacy, and security

Before using this project with real business data:

-   **Back up data:** establish and test a backup/restore procedure
    based on the actual database implementation.
-   **Confirm storage behavior:** verify where database files are
    stored, how data survives app restarts, and how upgrades affect
    existing data.
-   **Protect credentials:** store API keys and secrets in server-side
    environment variables or an appropriate secrets manager.
-   **Review access controls:** verify authentication, authorization,
    user roles, and store-level permissions in the source code.
-   **Test offline mode:** determine which features work without an
    internet connection and what happens when connectivity returns.
-   **Test migrations:** confirm how schema changes are handled when
    updating the application.
-   **Avoid sensitive production data during initial testing:** use
    sample data until the workflows and backup process have been
    validated.

The presence of a local database library does not, on its own, establish
encryption, automatic backups, multi-user synchronization, or regulatory
compliance.

## Troubleshooting

### `node` or `npm` is not recognized

Install Node.js, reopen your terminal, and check `node --version` and
`npm --version`.

### Dependencies fail to install

-   Confirm that you are in the folder containing `package.json`.
-   Use a supported Node.js version.
-   Try one package manager consistently.
-   Read the first meaningful error in the terminal; do not delete
    lockfiles as the first troubleshooting step.

### Port 3000 is already in use

Stop the other process using the port, or update the Vite script in
`package.json` to use a free port. If you change the port, check any
code that assumes the current URL.

### Gemini/AI features fail

-   Check that `GEMINI_API_KEY` is set in the environment expected by
    the app.
-   Confirm that the key is valid and has access to the model/API being
    requested.
-   Check server logs and network access.
-   Never paste the key into public issue reports or screenshots.

### The web build succeeds but the desktop app does not launch

-   Check that `electron/main.ts` and `electron/preload.ts` exist.
-   Run `npm run electron:build` and inspect the first build error.
-   Confirm that the generated `dist-electron/main.cjs` and
    `dist-electron/preload.cjs` files exist.
-   Review Electron runtime paths and packaged asset paths in the source
    code.

### Windows packaging fails

-   Build on a compatible Windows x64 environment.
-   Install dependencies successfully first.
-   Check Electron Builder's complete terminal output.
-   Confirm that `dist/` and `dist-electron/` were generated before
    packaging.
-   Check that the `release/` output directory is writable.

### Tests or TypeScript checks fail

Run the command again and inspect the first reported file and line. Fix
the underlying issue rather than suppressing errors without
understanding them.

## Contributing

Contributions and bug reports are welcome.

1.  Fork the repository.
2.  Create a branch for your change.
3.  Make a focused update.
4.  Run the relevant tests and checks.
5.  Submit a pull request describing the change, the reason for it, and
    how it was tested.

For bug reports, include the steps to reproduce the problem, expected
behavior, actual behavior, and relevant error messages. Remove API keys,
personal information, and real customer data from logs and screenshots.

## License

No license was confirmed in the available repository files. Until a
`LICENSE` file is added, do not assume the project is open source or
that others have permission to reuse, modify, or redistribute it. Add
the license that matches the owner's intent.

------------------------------------------------------------------------

**BusinessOS Pro --- business operations in one workspace.**
