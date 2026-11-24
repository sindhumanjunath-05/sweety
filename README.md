# 🩸 Sweety – Blood Glucose Tracker

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

A web application designed for diabetic patient self-care where a user records up to 4 blood glucose readings a day and views daily, month-to-date, and previous monthly clinical reports and trend visualizations.

Built with a **Node.js + Express** REST API, a **PostgreSQL** relational database, and a **React + Tailwind CSS** frontend.

---

## 📑 Table of Contents

- [Features](#-features)
  - [Required Core Features](#required-core-features)
  - [Completed Bonus Features](#completed-bonus-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started & Installation](#-getting-started--installation)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Database Setup](#3-database-setup)
  - [4. Install Dependencies](#4-install-dependencies)
  - [5. Run Migrations & Seed Sample Data](#5-run-migrations--seed-sample-data)
  - [6. Running the Application](#6-running-the-application)
- [Docker Deployment](#-docker-deployment)
- [Running Tests](#-running-tests)
- [API Documentation](#-api-documentation)
- [Validation Rules Summary](#-validation-rules-summary)
- [Demo Credentials](#-demo-credentials)
- [Notes & Assumptions](#-notes--assumptions)

---

## 🌟 Features

### Required Core Features

1. **Sign Up & Log In (Authentication & Security)**
   - User registration with name, email, and password.
   - Passwords securely hashed with `bcryptjs` (salt rounds: 10); plain-text passwords are never stored.
   - JWT-based authentication (`Bearer` token) with 7-day expiration.
   - **Strict data isolation**: After logging in, users can only view, create, edit, or delete their own glucose readings.

2. **Add, View, Edit and Delete Readings**
   - Each reading records:
     - `date`: Reading date (YYYY-MM-DD).
     - `slot`: Time slot (`Morning (fasting)`, `After breakfast`, `After lunch`, `After dinner`).
     - `value`: Blood glucose value in mg/dl (whole number between 40 and 600).
   - Strict validation enforcement on both frontend and backend matching exact specification rules.
   - Reading list table with status badges (`< 70 mg/dl` Low, `70 – 140 mg/dl` Optimal, `> 140 mg/dl` Elevated).

3. **Clinical Reports & Analytics**
   - **Daily Report**: Selected date (e.g., 15 Oct 2026). Computes highest, lowest, average (rounded to 1 decimal place), count of readings, and lists each reading with its specific slot.
   - **Month-to-Date Report**: 1st of the month to the selected date (e.g., 1 Oct – 15 Oct 2026). Computes highest, lowest, average (1 decimal), and count.
   - **Monthly Report**: The whole previous month (e.g., 1 Sep – 30 Sep 2026 when 15 Oct 2026 is selected). Computes highest, lowest, average (1 decimal), and count.
   - **Friendly Empty States**: Graceful UI when zero readings exist for a chosen date or period.

### Completed Bonus Features

- 📈 **Interactive Charts (Recharts)**: Visualizes blood glucose fluctuations over time with clinical reference lines (70 – 140 mg/dl).
- 📄 **Pagination on GET /readings**: Server-side pagination support (`?page=1&limit=20`) returning total count, page, and totalPages.
- 🐳 **Docker & Docker Compose**: Full `docker-compose.yml` orchestrating PostgreSQL 17, Express API, and Nginx-backed React frontend.
- 🧪 **Automated Test Suite**:
  - **Backend**: Jest + Supertest covering Auth, Readings CRUD, validation edge cases, and Reports calculation (28 passing tests).
  - **Frontend**: Vitest + React Testing Library testing form rendering, client-side validation messages, and submission (7 passing tests).
- 🌱 **Comprehensive Demo Seed Script**: Generates 160+ realistic readings spanning current and previous months, plus an isolated second user to verify data security.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Recharts |
| **Backend** | Node.js (v20+ / v22), Express.js, JWT (`jsonwebtoken`), `bcryptjs`, CORS, Dotenv |
| **Database** | PostgreSQL 17 (pg pool driver with parameterized SQL queries) |
| **Testing** | Jest, Supertest (API), Vitest, React Testing Library (UI) |
| **DevOps** | Docker, Docker Compose, Nginx (Alpine) |

---

## 📋 Prerequisites

- **Node.js**: v20 or higher (`node -v`)
- **npm**: v10 or higher (`npm -v`)
- **PostgreSQL**: v14+ or Docker installed

---

## 🚀 Getting Started & Installation

### 1. Clone Repository

```bash
git clone https://github.com/sindhumanjunath-05/sweety.git
cd sweety
```

### 2. Environment Configuration

Copy `.env.example` in both server and client folders:

```bash
# Server configuration
cp server/.env.example server/.env

# Client configuration
cp client/.env.example client/.env
```

**`server/.env` contents:**
```env
PORT=5000
NODE_ENV=development

# Database configuration (adjust port/credentials if needed)
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sweety_db

JWT_SECRET=sweety_jwt_super_secret_dev_key_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Database Setup

Ensure PostgreSQL is running and create the database `sweety_db`:

```sql
CREATE DATABASE sweety_db;
```

*(If using standard psql command line: `psql -U postgres -c "CREATE DATABASE sweety_db;"`)*

### 4. Install Dependencies

Install dependencies for both backend and frontend:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

### 5. Run Migrations & Seed Sample Data

Run the database schema migration and seed script to populate demo users and sample readings:

```bash
# Run migration (creates users and readings tables with constraints & indexes)
npm --prefix server run migrate

# Run seed script (creates demo user + 160+ sample readings across months)
npm --prefix server run seed
```

### 6. Running the Application

Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 (React Frontend):**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

Now open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🐳 Docker Deployment

To run the entire stack (PostgreSQL, Express backend, and React client) using Docker Compose:

```bash
# Build and run containers
docker-compose up --build

# Once healthy:
# Frontend is accessible at http://localhost:3000
# Backend API is accessible at http://localhost:5000
```

To run the database seed inside Docker:
```bash
docker exec -it sweety-server node src/scripts/seed.js
```

---

## 🧪 Running Tests

Both backend and frontend have comprehensive automated test suites:

```bash
# Run all backend tests (Jest + Supertest)
npm --prefix server test

# Run all frontend tests (Vitest + React Testing Library)
npm --prefix client test
```

### Test Coverage Highlights:
- **Backend (28 tests)**:
  - User registration validation, password hashing, duplicate email handling, JWT authentication.
  - Value is required (`"Please enter a glucose value."`).
  - Whole number range 40–600 (`"Value must be between 40 and 600 mg/dl."`).
  - Future date rejection (`"Date cannot be in the future."`).
  - Duplicate slot per day rejection (`"You already have an After lunch reading for this date."`).
  - Max 4 readings per day limit (`"You can add only 4 readings per day."`).
  - User isolation: User B cannot view, edit, or delete User A's readings.
  - Daily, Month-to-date, and Previous month statistics (highest, lowest, average rounded to 1 decimal, count).
- **Frontend (7 tests)**:
  - Form field rendering and default values.
  - Exact error message banner rendering on validation failures.
  - Successful API submission and modal close handling.

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new patient account | No |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token | No |
| `GET` | `/api/auth/me` | Retrieve profile of authenticated user | Yes (`Bearer <token>`) |

### Readings Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/readings` | Get readings (supports `?page=1&limit=20&date=YYYY-MM-DD&slot=...`) | Yes |
| `GET` | `/api/readings/:id` | Get single reading by ID | Yes |
| `POST` | `/api/readings` | Record new glucose reading | Yes |
| `PUT` | `/api/readings/:id` | Edit existing reading | Yes |
| `DELETE` | `/api/readings/:id` | Delete reading | Yes |

### Reports Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/reports?date=YYYY-MM-DD` | Returns Daily, Month-to-date, and Previous Month reports | Yes |
| `GET` | `/api/reports/daily?date=YYYY-MM-DD` | Returns Daily report with slot breakdown | Yes |
| `GET` | `/api/reports/month-to-date?date=...` | Returns Month-to-date report (1st to selected date) | Yes |
| `GET` | `/api/reports/monthly?date=...` | Returns Monthly report (whole previous month) | Yes |

---

## 🔒 Validation Rules Summary

| Rule | Trigger Condition | Exact Error Message Displayed |
|---|---|---|
| **Value is required** | Value is empty, null, or undefined | `"Please enter a glucose value."` |
| **Value in range** | Value `< 40` or `> 600` or not whole number | `"Value must be between 40 and 600 mg/dl."` |
| **One reading per slot** | Slot already recorded for chosen date | `"You already have an <Slot> reading for this date."` *(e.g. "You already have an After lunch reading for this date.")* |
| **Max 4 per day** | Target date already has 4 slots filled | `"You can add only 4 readings per day."` |
| **No future dates** | Selected date `> today` | `"Date cannot be in the future."` |

---

## 👤 Demo Credentials

The seed script creates the following pre-configured demo account:

- **Email**: `demo@sweety.com`
- **Password**: `Password123!`
- **Sample Readings**: 160+ readings pre-populated across current and previous months (including Morning, Breakfast, Lunch, and Dinner slots).
- **Secondary User (Isolation Test)**: `other@sweety.com` / `OtherPass123!`

*(You can also click the **"Use Demo Login"** button on the login screen for instant 1-click access).*

---

## 📝 Notes & Assumptions

### Assumptions Made

1. **Previous Month Date Range Calculation**:
   - For any selected date in month $M$ of year $Y$, the "whole previous month" report calculates the range from day 1 to the final calendar day of month $M-1$.
   - For example, selecting `15 Oct 2026` yields `1 Sep 2026` to `30 Sep 2026`.
   - In January (e.g. `10 Jan 2026`), the previous month correctly wraps to `1 Dec 2025` to `31 Dec 2025`.
2. **Rounding Standard**:
   - All averages are rounded to exactly 1 decimal place using `Number(avg.toFixed(1))` (e.g., `124.5 mg/dl`).
3. **Database Uniqueness & Concurrency**:
   - In addition to Express-level pre-checks, a PostgreSQL `UNIQUE(user_id, date, slot)` constraint enforces concurrency safety against race conditions.
4. **Time Slots**:
   - Allowed slot names are strictly fixed to:
     - `Morning (fasting)`
     - `After breakfast`
     - `After lunch`
     - `After dinner`

### What I Would Improve With More Time

1. **Redis Caching**:
   - Cache expensive report calculations (`/api/reports?date=...`) in Redis with cache invalidation triggered on `POST /readings`, `PUT /readings/:id`, and `DELETE /readings/:id`.
2. **Background Jobs (BullMQ)**:
   - Configure a scheduled BullMQ queue to send daily notifications or reminder logs to patients who have logged fewer than 4 readings by 8:00 PM.
3. **Doctor Portal Role**:
   - Extend user roles (`'patient'` vs. `'doctor'`) with an assignment table (`doctor_patients`), allowing physicians to inspect patient reports and download clinical summaries.
4. **CSV / PDF Export**:
   - Add one-click export for doctors to download monthly reports in PDF or CSV format.
