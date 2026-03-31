# OpenMRS ESM Patient Chart - AGENTS.md Context

## Repository Overview

**Project Name:** OpenMRS ESM Patient Chart  
**Repository:** `openmrs-esm-patient-chart`  
**Version:** 12.1.0  
**License:** MPL-2.0  
**Type:** Monorepo (Yarn Workspaces + Turborepo)

This is a frontend module for the OpenMRS SPA (Single Page Application) containing various microfrontends that constitute widgets in a patient dashboard.

---

## Technology Stack

### Core Technologies
- **Package Manager:** Yarn 4.10.3 (workspaces)
- **Build System:** Turborepo 2.5.2
- **Framework:** React 18.3.1
- **Language:** TypeScript 5.0+
- **UI Library:** Carbon Design System (React) 1.x
- **Routing:** React Router DOM 6.x
- **State Management:** SWR 2.2.5, RxJS 6.x
- **Form Handling:** React Hook Form 7.46.2, Zod 3.23.8
- **Styling:** Sass, Carbon Components
- **Internationalization:** i18next 25.0.0, react-i18next 16.0.0
- **Date Handling:** DayJS 1.11.10

### Build Tools
- **Bundler:** Rspack (primary), Webpack
- **Angular Integration:** Angular 19.2.20 (esm-form-entry-app only)
- **Testing:** Jest 29.7.0, Testing Library, Playwright 1.51.1
- **Linting:** ESLint 8.57.0, Prettier 3.0.3
- **Type Checking:** TypeScript

### OpenMRS Specific
- **OpenMRS CLI:** `openmrs` package (next tag)
- **Framework:** `@openmrs/esm-framework` 9.x
- **Common Lib:** `@openmrs/esm-patient-common-lib` 12.x
- **Form Engine:** `@openmrs/esm-form-engine-lib` next

---

## Monorepo Structure

### Root Directory
```
/home/arun/Desktop/projects/openmrs-esm-patient-chart/
├── packages/              # 22 microfrontend packages
├── e2e/                   # End-to-end tests (Playwright)
├── tools/                 # Shared build/test utilities
├── __mocks__/             # Jest mocks
├── .husky/               # Git hooks
├── .github/              # GitHub workflows
├── package.json          # Root package config
├── turbo.json            # Turborepo pipeline config
├── tsconfig.json         # TypeScript config
├── jest.config.js        # Jest config
├── playwright.config.ts  # E2E test config
├── yarn.lock             # Yarn lockfile
└── README.md             # Project documentation
```

### Packages (22 Total)

#### Core Application Packages

1. **@openmrs/esm-patient-chart-app** (v12.1.0)
   - **Purpose:** Main patient chart framework
   - **Role:** Provides underlying framework for all widgets, handles routing, layout, workspace, side/nav menus, visits, offline mode
   - **Dependencies:** lodash-es, uuid
   - **Key Files:** `src/index.ts`, routing config, extensions setup

2. **@openmrs/esm-patient-common-lib** (v12.1.0)
   - **Purpose:** Shared library for all patient chart widgets
   - **Role:** Reusable components (card headers, error/empty states, pagination), custom hooks (workspace, concept metadata, pagination)
   - **Dependencies:** Carbon React, lodash-es, uuid
   - **Note:** No build scripts - library only

3. **@openmrs/esm-form-engine-app** (v12.1.0)
   - **Purpose:** Wrapper for React Form Engine
   - **Role:** O3 React Form Engine integration
   - **Dependencies:** @openmrs/esm-form-engine-lib, Carbon React, lodash-es

4. **@openmrs/esm-form-entry-app** (v12.1.0)
   - **Purpose:** Angular form engine for O3
   - **Role:** Wrapper around Angular application that renders JSON schemas as HTML forms (AMPATH form engine)
   - **Special:** Uses Angular 19.2.20 with single-spa-angular integration
   - **Build:** Angular CLI (ng build, ng serve)

#### Patient Widget Packages

5. **@openmrs/esm-patient-allergies-app** (v12.1.0)
   - **Purpose:** Allergies widget
   - **Features:** Tabular overview of patient allergies, form for recording allergies

6. **@openmrs/esm-patient-attachments-app** (v12.1.0)
   - **Purpose:** Attachments widget
   - **Features:** Gallery of patient attachments, file uploader for new attachments
   - **Dependencies:** React Grid Gallery, react-html5-camera-photo, linkify

7. **@openmrs/esm-patient-banner-app** (v12.1.0)
   - **Purpose:** Patient banner widget
   - **Features:** Patient name, avatar, gender, age, identifiers, expandable panel with address/contact/relationships, custom tags (active visit, deceased)

8. **@openmrs/esm-patient-conditions-app** (v12.1.0)
   - **Purpose:** Conditions widget
   - **Features:** Tabular overview of patient conditions, form for recording new conditions

9. **@openmrs/esm-patient-flags-app** (v12.1.0)
   - **Purpose:** Patient flags frontend module
   - **Features:** Visual components showing relevant patient info at a glance, displayed in Patient Summary below section title
   - **Design Docs:** https://zeroheight.com/23a080e38/p/851fea-patient-flags
   - **Hook:** `usePatientFlags`, Component: `PatientFlags`

10. **@openmrs/esm-patient-forms-app** (v12.1.0)
    - **Purpose:** Forms widget
    - **Features:** Tabular overview of clinical forms, configured for AMPATH form engine forms

11. **@openmrs/esm-patient-immunizations-app** (v12.1.0)
    - **Purpose:** Immunizations widget
    - **Features:**
      - Immunization Summary: Grouped table by vaccine type with expandable rows
      - Immunization History: Chronological list of all immunizations
      - Enhanced form with vaccination date, dose number, manufacturer, lot number, expiration date, next dose date, notes
      - Smart validation (future dates, birth date checks)
      - Next dose tracking (red flag = overdue/due, green flag = upcoming)
      - Edit/delete functionality with toast notifications
    - **Configuration:**
      - `immunizationConceptSet`: Concept set UUID for vaccines (default: "CIEL:984")
      - `sequenceDefinitions`: Dose/booster schedules per vaccine
    - **Backend Requirements:**
      - Global properties: `fhir2.immunizationsEncounterTypeUuid`, `fhir2.administeringEncounterRoleUuid`
      - Required CIEL concepts: 1421, 984, 1410, 1418, 1419, 1420, 165907
      - Optional: 161011 (notes), 170000 (next dose date)

12. **@openmrs/esm-patient-label-printing-app** (v12.1.0)
    - **Purpose:** Patient label printing
    - **Features:** Flexible, extensible printing mechanism for patient records, receipts, etc.

13. **@openmrs/esm-patient-lists-app** (v12.1.0)
    - **Purpose:** Patient Lists app
    - **Features:** Tabular overview of patient lists, detail view with metadata and enrolled patients
    - **Note:** Not a replacement for Patient Lists Management app on home page

14. **@openmrs/esm-patient-medications-app** (v12.1.0)
    - **Purpose:** Medications widget
    - **Features:** Tabular overview of active/past medications, modify/renew/discontinue, order basket for new medications

15. **@openmrs/esm-patient-notes-app** (v12.1.0)
    - **Purpose:** Notes widget
    - **Features:** Tabular overview of visit notes, form for recording new visit notes

16. **@openmrs/esm-patient-orders-app** (v12.1.0)
    - **Purpose:** Central orders management system
    - **Features:**
      - Order Basket: Centralized workspace for pending orders
      - Order Types: Medications, lab tests, procedures, general orders
      - Order Lifecycle: Create → Modify → Renew → Discontinue → Track results
      - Lab Results: Entry, validation, dynamic forms, print support
    - **Configuration:**
      - `orderEncounterType`: UUID for orders encounter type (default: "39da3525-afe4-45ff-8977-c53b7b359158")
      - `orderTypes`: Array with orderTypeUuid, orderableConceptSets, label, icon
      - `showPrintButton`: Boolean for print button visibility
      - `showReferenceNumberField`: Boolean for reference number field
    - **Extension Slots:** `top-of-lab-order-form-slot`, `order-item-additional-info-slot`, `order-basket-slot`
    - **Lab Concept Configuration:** Auto-generated forms from concept_numeric table (hiAbsolute, lowAbsolute, allowDecimal, answers, units)

17. **@openmrs/esm-patient-programs-app** (v12.1.0)
    - **Purpose:** Programs widget
    - **Features:** Tabular overview of patient enrollments, form for enrolling in new programs

18. **@openmrs/esm-patient-tests-app** (v12.1.0)
    - **Purpose:** Test results and ordering
    - **Features:**
      - Tabular and chart-based overviews of test results
      - Lab filter view with ConvSet hierarchy configuration
    - **Lab Filter Configuration:**
      - Uses Labs, LabSets, and ConvSets (Convenience Sets) in Concept Dictionary
      - Create concepts with type = ConvSet for hierarchy
      - Add set members to establish parent-child relationships
      - Update config-schema.ts with ConvSet UUIDs
    - **Concept Requirements:** Concepts must have "Type: Test" or "Type: LabSet"

19. **@openmrs/esm-patient-vitals-app** (v12.1.0)
    - **Purpose:** Vitals widget
    - **Features:**
      - Tabular and chart-based overviews of vitals
      - Form for recording vitals and biometrics
      - Vitals header with most recent vitals summary
    - **Dependencies:** Carbon Charts React

#### Proof-of-Concept Packages

20. **@openmrs/esm-generic-patient-widgets-app** (v12.1.0)
    - **Purpose:** Generic widget proof-of-concept
    - **Features:** Configurable widget displaying any obs in tabular or chart view
    - **Port:** Runs on 8081 by default

---

## Development Workflow

### Installation
```bash
yarn install
```

### Starting Development
```bash
# Start specific microfrontend
yarn start --sources 'packages/esm-patient-<package-name>-app'

# Start multiple microfrontends simultaneously
yarn start --sources 'packages/esm-patient-biometrics-app' --sources 'packages/esm-patient-vitals-app'

# Alternative: Run from individual package
cd packages/<package-name>
yarn serve
```

### Development Server
- Uses `openmrs` CLI tool (next tag)
- Runs `esm-patient-chart` plus specified microfrontends
- Individual packages can use `yarn serve` with import map overrides

### Package Scripts (per package)
```bash
yarn start         # openmrs develop
yarn serve         # rspack serve (development)
yarn build         # rspack production build
yarn analyze       # Analyze bundle size
yarn lint          # ESLint with auto-fix
yarn test          # Jest tests
yarn test:watch    # Jest watch mode
yarn coverage      # Test with coverage
yarn typescript    # Type check
yarn extract-translations  # i18next parser
```

### Turbo Commands (Monorepo-wide)
```bash
# Verify all packages
yarn verify  # Runs lint, typescript, test

# Build all packages
yarn turbo run build

# Test all packages
yarn turbo run test
yarn turbo run test:watch
yarn turbo run coverage

# Test specific package
yarn turbo run test --filter=@openmrs/esm-patient-conditions-app

# Test specific file
yarn turbo run test -- visit-notes-form

# Interactive watch mode
yarn turbo run test:watch --ui tui -- visit-notes-form

# Bypass cache
yarn turbo run test --force

# Extract translations
yarn turbo run extract-translations

# Release (version packages)
yarn release
```

### Publishing
```bash
# Publish to latest
yarn ci:publish

# Publish to next
yarn ci:prepublish

# Publish to patch
yarn ci:prepublish-patch
```

### Troubleshooting
```bash
# Upgrade core libraries
yarn up openmrs@next @openmrs/esm-framework@next

# Reset version specifiers
git checkout package.json

# Recreate lockfile
yarn
```

---

## Testing

### Unit Tests
- **Framework:** Jest 29.7.0
- **Test Runner:** @swc/jest for transforms
- **Environment:** jsdom
- **Coverage:** 80% threshold (statements, branches, functions, lines)
- **Setup:** `tools/setup-tests.ts`
- **Mocking:** `@openmrs/esm-framework/mock`, custom mocks in `__mocks__/`
- **Exclusions:** `esm-form-entry-app` (Angular), `e2e/` directory

### End-to-End Tests
- **Framework:** Playwright 1.51.1
- **Location:** `e2e/specs/*.spec.ts`
- **Setup:**
  ```bash
  npx playwright install
  cp example.env .env
  ```

- **Environment:**
  - Default: http://localhost:8080/openmrs
  - Remote: Update E2E_BASE_URL in .env
  - Default location UUID: 44c3efb0-2583-4c80-a79e-1f756a03c0a1 (Outpatient Clinic)
  - Admin credentials: admin / Admin123

- **Running Tests:**
  ```bash
  yarn test-e2e                    # All tests (headless)
  yarn test-e2e --headed           # Show browser
  yarn test-e2e --ui               # Playwright UI mode
  yarn test-e2e --headed --ui      # Both
  yarn test-e2e <test-name>        # Specific test
  ```

- **E2E Directory Structure:**
  ```
  e2e/
  ├── commands/        # Custom commands
  ├── core/           # Core setup
  ├── fixtures/       # Test fixtures
  ├── pages/          # Page objects
  ├── specs/          # Test specs (*.spec.ts)
  └── support/        # Support files
  ```

### Test Configuration
- **Timeout:** 30s (Jest), 3min (E2E)
- **Parallel:** Fully parallel outside CI
- **Retry:** 0 retries
- **Video/Trace:** Retained on failure
- **Reporter:** HTML (local), JUnit + HTML (CI)

---

## Configuration

### TypeScript
- **Target:** ESNext
- **Module:** ESNext
- **Module Resolution:** Node
- **Libs:** DOM, ES2015+, ES2022
- **Paths:**
  - `@openmrs/*` → `./node_modules/@openmrs/*`
  - `__mocks__` → `./__mocks__`
  - `tools` → `./tools`
- **Settings:** `noEmit: true`, `skipLibCheck: true`, `esModuleInterop: true`

### ESLint
- **Config:** Root `.eslintrc`
- **Plugins:** import, jest-dom, playwright, react-hooks, testing-library
- **Lint-staged hooks:**
  - `packages/**/src/**/*.{ts,tsx}` → ESLint auto-fix
  - `*.{css,scss,ts,tsx}` → Prettier write

### Turborepo Pipeline
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsconfig.json", "webpack.config.js", "rspack.config.js", "translations/**"],
      "outputs": ["dist/**"]
    },
    "test": {
      "inputs": ["src/**", "__mocks__/**", "mock.ts", "vitest.config.ts", "setup-tests.ts"]
    },
    "lint": {
      "inputs": ["src/**/*.{ts,tsx}", "$TURBO_ROOT$/.eslintrc"]
    },
    "typescript": {
      "dependsOn": ["^typescript"],
      "inputs": ["src/**", "tsconfig.json"]
    },
    "coverage": {
      "inputs": ["src/**", "__mocks__/**", "vitest.config.ts", "setup-tests.ts"],
      "outputs": ["coverage/**"]
    },
    "extract-translations": {
      "inputs": ["src/**/*.component.tsx", "src/**/*.extension.tsx", "src/**/*.modal.tsx", "src/**/*.workspace.tsx", "src/**/*.hook.tsx", "src/**/*.resource.ts", "src/index.ts"]
    }
  }
}
```

### Jest Configuration
- **Transform:** @swc/jest
- **Transform Ignore:** `/node_modules/(?!@openmrs|rxjs|.+\\.pnp\\.[^\\/]+$)`
- **Module Directories:** `node_modules`, `__mocks__`, `tools`
- **Module Name Mapper:**
  - CSS → `identity-obj-proxy`
  - `@openmrs/esm-framework` → `@openmrs/esm-framework/mock`
  - `@carbon/charts-react` → Custom mock
  - `react-i18next` → Custom mock
  - `lodash-es` → `lodash`
  - `uuid` → `uuid/dist/index.js`
- **Coverage From:** `**/src/**/*.component.tsx` (excludes tests, node_modules, vendor)

### Playwright Configuration
- **Test Directory:** `./e2e/specs`
- **Timeout:** 3 minutes
- **Expect Timeout:** 40 seconds
- **Base URL:** `${E2E_BASE_URL}/spa/`
- **Storage State:** `e2e/storageState.json`
- **Projects:** Desktop Chrome (channel: chromium)
- **Global Setup:** `e2e/core/global-setup`

---

## Architecture Patterns

### Layout Structure
1. **Navigation Menu:** Left side, links to dashboards
2. **Patient Header:** Patient banner, notifications
3. **Chart Review:** Main area, active dashboard
4. **Dashboard:** Collection of widgets
5. **Workspace:** Data entry (full screen on mobile, sidebar on desktop)
6. **Side Menu:** Features without dedicated pages (notifications, etc.)

### Widget Pattern
Each widget follows a standard pattern:
- **Summary View:** Tabular or chart-based overview
- **Form/Workspace:** For creating/editing records
- **Dashboard Link:** Adds navigation item to patient chart
- **Dashboard Slot:** Automatically placed on dashboard

### Extension System
- Microfrontends register extensions via `extensions.json`
- Extension slots define placement locations
- Configuration-driven widget placement

### Data Fetching
- **SWR:** Primary data fetching library
- **React Query Pattern:** Custom hooks for resources
- **Error Handling:** React Error Boundary, Carbon components

### State Management
- **Local State:** React hooks (useState, useEffect)
- **Shared State:** SWR, RxJS observables
- **Workspace State:** Custom hooks from common-lib

---

## Key Dependencies by Package

### Carbon Design System
All React packages use `@carbon/react` 1.83.0

### Shared Libraries
- **lodash-es:** Utility functions (most packages)
- **dayjs:** Date handling (most packages)
- **uuid:** Unique identifiers (chart-app, common-lib)
- **fuzzy:** Fuzzy search (forms-app, tests-app)

### Special Packages
- **@carbon/charts-react:** Charts (vitals-app, tests-app, generic-widgets-app)
- **@hookform/resolvers:** Form validation (immunizations-app)
- **react-hook-form:** Form handling (immunizations-app)
- **zod:** Schema validation (immunizations-app, root)
- **react-barcode:** Barcode generation (root)
- **react-to-print:** Print functionality (root)

### Angular Package (esm-form-entry-app)
Full Angular 19 stack with:
- @angular/core, common, forms, router, material
- @angular-extensions/elements
- @ngx-translate/core
- single-spa-angular
- @openmrs/ngx-formentry, ngx-file-uploader

---

## Backend Integration

### OpenMRS Modules
- **FHIR2 Module:** Required for immunizations, modern APIs
- **AMPATH Form Engine:** JSON forms for form entry

### Global Properties
- `fhir2.immunizationsEncounterTypeUuid`
- `fhir2.administeringEncounterRoleUuid`

### Concept Mappings (CIEL)
Required concepts include:
- **Immunizations:** 1421 (grouping), 984 (vaccine), 1410 (date), 1418 (dose), 1419 (manufacturer), 1420 (lot), 165907 (expiration)
- **Optional:** 161011 (notes), 170000 (next dose)

### REST APIs
- Patient data via OpenMRS REST/FHIR APIs
- Concept metadata from concept dictionary
- Forms from AMPATH form engine

---

## Internationalization (i18n)

### Setup
- **Library:** i18next 25.0.0, react-i18next 16.0.0
- **Parser:** i18next-parser 9.3.0
- **Config:** `tools/i18next-parser.config.js`

### Extraction
```bash
yarn turbo run extract-translations
```

### Files
Extracted from:
- `src/**/*.component.tsx`
- `src/**/*.extension.tsx`
- `src/**/*.modal.tsx`
- `src/**/*.workspace.tsx`
- `src/**/*.hook.tsx`
- `src/**/*.resource.ts`
- `src/index.ts`

### Translation Files
Located in `translations/` directory per package

---

## Deployment

### Distribution
See [Creating a Distribution](https://openmrs.atlassian.net/wiki/x/xoIBCQ)

### Version Tags
- **latest:** Stable releases (`ci:publish`)
- **next:** Development releases (`ci:prepublish`)
- **patch:** Patch releases (`ci:prepublish-patch`)

### Publishing Workflow
```bash
# Publish all packages topologically
yarn ci:publish  # excludes patient-chart-app (aggregator)
```

---

## External Documentation

- **Developer Docs:** https://openmrs.atlassian.net/wiki/x/IABBHg
- **E2E Testing Guide:** https://openmrs.atlassian.net/wiki/x/K4L-C
- **AMPATH Forms Docs:** https://ampath-forms.vercel.app
- **Design System:** https://zeroheight.com/23a080e38/p/880723--introduction
- **Patient Flags Design:** https://zeroheight.com/23a080e38/p/851fea-patient-flags
- **Implementer Docs:** https://wiki.openmrs.org/pages/viewpage.action?pageId=224527013
- **Add a left navigation panel** https://openmrs.atlassian.net/wiki/spaces/docs/pages/150962840/Add+a+Left+Navigation+Panel

---

## Git & CI/CD

### Git Hooks (Husky)
- **pre-commit:** Lint-staged (ESLint + Prettier)
- **Install:** `yarn postinstall` → `husky install`

### CI Workflow
- **Name:** OpenMRS CI
- **File:** `.github/workflows/ci.yml`
- **Tasks:** Build, lint, test, typecheck

### Bamboo
- **Dockerfile:** `e2e/support/bamboo/playwright.Dockerfile`
- **Playwright Version:** Must match `package.json`

---

## Common Tasks

### Adding a New Widget
1. Create new package in `packages/`
2. Configure `package.json` with scripts and dependencies
3. Implement widget extensions
4. Add to `extensions.json`
5. Register in patient chart app

### Configuring a Widget
1. Update `config-schema.ts`
2. Set global properties in OpenMRS
3. Add concept mappings
4. Configure via System Administration module

### Running Tests for Specific Package
```bash
yarn turbo run test --filter=@openmrs/esm-patient-<package-name>-app
```

### Debugging Build Issues
```bash
# Analyze bundle size
yarn analyze

# Check TypeScript
yarn turbo run typescript

# Force rebuild
rm -rf node_modules/.cache
yarn turbo run build --force
```

### Updating Dependencies
```bash
# Upgrade to latest
yarn up <package-name>@latest

# Upgrade all
yarn up

# Reset to version specifiers
git checkout package.json
yarn
```

---

## Package Naming Convention
- **Format:** `@openmrs/esm-<type>-<name>-<app|lib>`
- **Types:** `patient-`, `form-`, `generic-`
- **Suffixes:** `-app` (microfrontend), `-lib` (library)

## Versioning
All packages are versioned in lockstep at 12.1.0

---

## Important Notes

1. **esm-form-entry-app** uses Angular, not React - requires special build setup
2. **esm-patient-common-lib** is a library, no build scripts
3. **Patient banner** lives in `esm-patient-banner-app`
4. **Workspace** is managed by `esm-patient-chart-app`
5. **Turbo cache** can cause stale test results - use `--force` flag
6. **Yarn workspaces** require topological dependency resolution
7. **Import map overrides** needed for multi-package development
8. **Browserslist** extends `browserslist-config-openmrs`
9. **All packages** publish to public npm with MPL-2.0 license
10. **Playwright version** in Dockerfile must match package.json
