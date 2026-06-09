# PoupaMais

PoupaMais is a complete personal finance management system, built to help users track expenses, income, set financial goals, and visualize their financial health through interactive dashboards.

## Detailed Documentation

For in-depth information on specific parts of the application, check the dedicated documentation:

- **[Frontend Documentation (Client)](client/README.md)**: Details on Next.js 15, UI components, charts, and styling.
- **[Backend Documentation (Server)](server/README.md)**: Details on NestJS API, database schema, authentication, and endpoints.

---

## Technologies Used

### Frontend (Client)
- **Frameworks:** Next.js 15, React 19
- **Styling:** Tailwind CSS 4, Framer Motion
- **Visualization:** Chart.js, React-Chartjs-2
- **Tooling:** TypeScript, Jest, Lucide React

### Backend (Server)
- **Frameworks:** NestJS (Node.js)
- **Database:** PostgreSQL
- **Infrastructure:** Docker & Docker Compose
- **Security:** Passport, JWT, Bcrypt, Throttler
- **Validation:** class-validator, class-transformer

---

## Project Structure

```
PoupaMais/
├── client/                 # Next.js Frontend Application
│   ├── src/app/            # App Router Pages
│   ├── src/components/     # UI and Chart Components
│   └── ...
├── server/                 # NestJS Backend API
│   ├── src/                # API Modules (Auth, Users, Transactions)
│   ├── data.sql            # Database Schema & Triggers
│   └── ...
├── Makefile                # Automation scripts
└── README.md               # This file
```

---

## Quick Start & Makefile Commands

This project includes a **Makefile** for streamlined development, installation, and database management. You can use **Docker** or **Podman** (use `<command>-pod` for Podman commands).

### Development Flow

| Command        | Description                                                                                  |
| :------------- | :----------------------------------------------------------------------------------------- |
| `make init`    | Install client/server dependencies, spin up the database, and run in dev mode.              |
| `make dev`     | Start Client and Server in development mode (requires running database).                    |
| `make prod`    | Build and run Client and Server in production.                                              |

### Installation & Maintenance

| Command           | Description                                                    |
| :---------------- | :----------------------------------------------------------  |
| `make install`    | Install npm dependencies for `client` and `server`.            |
| `make clean`      | Remove build artifacts and stop Docker containers.             |

### Database Management

| Command              | Description                                          |
| :------------------- | :--------------------------------------------------|
| `make db`            | Start the PostgreSQL container.                     |
| `make db-purge`      | Remove the database container and volume.           |

## Requirements

- **Node.js**: v20+
- **Container Runtime**: Docker or Podman
- **Package Manager**: npm or yarn