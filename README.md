# CONSTRUCT PRO — Smart Construction Estimation & Cost Management

CONSTRUCT PRO is a full-stack Construction Estimation, Material Calculation, Labour Costing, Bill of Quantities (BOQ), and Project Management platform.

## Architecture & Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/UI, Lucide React, Recharts, Zustand, React Hook Form + Zod, jsPDF, ExcelJS
- **Backend**: Node.js, Express.js, TypeScript, REST API, JWT Authentication, Zod Validation
- **Database**: PostgreSQL with Prisma ORM (`prisma/schema.prisma`)
- **Centralized Calculation Engine**: Pure, deterministic TypeScript module (`client/src/engine/calculationEngine.ts`) with automated unit verification tests

## Quick Start & Installation Instructions

### 1. Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL (v14+)

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env and configure DATABASE_URL and JWT_SECRET
```

### 3. Install Dependencies & Run Migrations
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Start Development Servers
```bash
# Terminal 1: Start Express + Prisma REST Backend
npm run dev:server

# Terminal 2: Start Vite + React Frontend
npm run dev:client
```

### 5. Run Automated Calculation Engine Tests
```bash
npm test
```

## Engineering & Costing Disclaimer
- All material rates in the seed database are **configurable sample/placeholder rates in INR (₹)** and must be updated in the **Rate Management** module using verified local vendor quotes or DSR/SSR schedules before issuing commercial tenders.
- RCC and Steel calculators perform **quantity surveying takeoffs only** based on user-supplied member dimensions and reinforcement bar schedules (`Weight = D² / 162 kg/m`). They do **not** perform structural design or structural safety verification; always follow structural engineering drawings signed by a licensed structural engineer.
