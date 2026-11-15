# Smart ERP — AI-Powered Attendance Management System

A frontend-only College ERP & Attendance Management web application built with React, TypeScript, Vite, and Tailwind CSS. All application data is persisted locally in `localStorage` under `smarterp_v1` (with zero backend required).

## Quick Start

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Demo Logins

| Role    | Identifier / Roll | Password     | Dashboard         |
| ------- | ----------------- | ------------ | ----------------- |
| Admin   | `admin@ssec.edu.in` | `admin123`   | `/#/admin`        |
| Faculty | `faculty@ssec.edu.in` | `faculty123` | `/#/faculty`      |
| Student | `267325205039` (R. Kishore Kumar) | `student123` | `/#/student` |

Any seeded student can also sign in using their Roll Number and `student123` (or their DOB).

## Project Structure

- `src/data/` — Typed models (`types.ts`) and consistent seeded dataset (`seed.ts`: 120 students, 12 staff, 14-day attendance history).
- `src/store/` — React Context + `useReducer` store (`AppContext.tsx`) persisted to `localStorage`.
- `src/utils/` — Attendance calculators (`attendance.ts`), AI insights & coach (`ai.ts`), local PDF generators (`pdf.ts`), SheetJS Excel import/export (`excel.ts`), CSV export (`csv.ts`), and date/window helpers (`date.ts`).
- `src/components/` — Reusable UI components including `Logo`, `AppLayout`, `IdCardPreview` (local QR via `qrcode.react`), `StudentFormModal`, `StudentProfileModal`, `ConfirmModal`, and `FloatingAiAssistant`.
- `src/pages/` — Role dashboards and feature modules for Splash, Landing, Login, Attendance Window (Manual / QR / Face), Reports, Timetable, Exams & Marks, Excel Import, ID Cards, and Settings.

## Resetting Demo Data

Go to **Admin → Settings → Reset demo data** to restore the original seeded dataset at any time.
