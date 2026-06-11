# Client-side PoupaMais

Frontend for PoupaMais - Modern, responsive, and intuitive interface for complete personal finance management.

## Stacks

- **Next.js 15** - React framework with App Router and Server Actions
- **React 19** - Library for building user interfaces
- **Tailwind CSS 4** - Utility-first styling framework
- **Chart.js & React-Chartjs-2** - Data visualization and interactive charts
- **Framer Motion** - Smooth animation library
- **Lucide React** - Modern and consistent icons
- **Next Themes** - Theme management (Dark/Light mode)
- **Jest & React Testing Library** - Unit and integration testing

### Interface Features

- **Interactive Dashboard** - Overview with balance charts, trends, and distribution.
- **Transaction Management** - Interfaces to add, edit, and delete expenses and income.
- **Goal Tracking** - Visualization of financial goal progress.
- **Detailed Analytics** - Asset allocation and expense-by-category charts.
- **Multi-language & Currency** - Support for regional user settings.
- **Secure Authentication** - Login, registration, and password recovery.
- **Responsiveness** - Adaptive layout for desktop, tablets, and mobile.

## Requirements

- Node.js 20+
- npm or yarn
- Backend API (Server-side PoupaMais) running locally

## Quick Start (3 Steps)

```bash
# Install Dependencies
cd client
npm i 

# Copy environment variables and update with your data if needed
cp .env.local.example .env.local

# Start application
npm run dev
```

Done! Your application is running at `http://localhost:3000`

### Interactive Charts
Robust chart implementation for financial visualization:
- **BalanceChart**: Balance evolution over time.
- **ExpenseDistribution**: Donut chart for categories.
- **MonthlyTrend**: Monthly income vs. expenses comparison.
- **GoalAllocation**: Visual progress of goals.

## Project Structure

```
client/
├── src/
│   ├── app/                   # App Router (Pages and Layouts)
│   │   ├── analise/           # Analytics page
│   │   ├── auth/              # Login
│   │   ├── cadastro/          # User registration
│   │   ├── configuracoes/     # User/app settings
│   │   ├── dashboard/         # Main dashboard
│   │   ├── metas/             # Goal management
│   │   ├── terminology/       # Language/currency contexts
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # Reusable Components
│   │   ├── ...Chart.tsx       # Chart Components (Chart.js)
│   │   ├── ...Modal.tsx       # Form Modals (Add/Edit)
│   │   ├── sidebar.tsx        # Side navigation
│   │   └── ProtectedRoute.tsx # Protected route guard
│   ├── contexts/              # React Contexts (Auth, Theme)
│   ├── services/              # Backend API Integration
│   │   ├── api.ts             # Fetch wrapper (credentials + CSRF header)
│   │   ├── auth.service.ts    # Authentication services
│   │   └── ...service.ts      # Domain services (Expenses, Goals, etc.)
│   └── types/                 # TypeScript Type Definitions
├── public/                    # Static assets (images, icons)
├── .env.local.example         # Environment variables example
├── tailwind.config.ts         # Styling configuration
└── next.config.ts             # Next.js configuration
```

## Available Scripts

```bash
# Development Server
npm run dev

# Production Build
npm run build

# Start Production
npm run start

# Linting
npm run lint

# Tests
npm run test
npm run test:watch
```

## Backend Connection

The frontend communicates with the API through the `src/services` folder.
The `src/services/api.ts` file configures a `fetch` wrapper that sends requests with `credentials: 'include'`, so the JWT (stored by the server in an `httpOnly` cookie) is attached automatically by the browser — it is never readable from JavaScript.

For CSRF protection, the server sets a readable `csrf_token` cookie alongside the auth cookie (double-submit pattern). The API wrapper reads this cookie and sends its value in the `x-csrf-token` header on every request; the server validates it on all mutating endpoints.

## Key Components

### Charts (Chart.js)
Located in `src/components`, they use `react-chartjs-2` to render responsive financial visualizations.

### Modals
Used for create and edit forms (e.g., `addDespesaModal.tsx`, `editMetaModal.tsx`), ensuring a smooth user experience without excessive navigation.

### Contexts
- **AuthContext**: Manages user authentication state and session persistence.
- **ThemeContext**: Manages Light/Dark theme toggling.
- **LanguageContext**: Manages localization (i18n) and currency formatting.