# HealthCore — Smart Healthcare Management System
## Full-Stack: React (Vite) + Node.js + Express + MongoDB + Groq AI

---

## Quick Start

### Backend
```bash
cd frontend/backend
npm install
# Edit .env if needed (Mongo URI, Groq key already set)
node utils/seeder.js   # creates demo accounts
npm start              # runs on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # runs on port 3000
```

---

## Demo Accounts (after running seeder)

| Role    | Email               | Password   |
|---------|---------------------|------------|
| Patient | patient@demo.com    | Demo@1234  |
| Doctor  | doctor@demo.com     | Demo@1234  |
| Admin   | admin@demo.com      | Demo@1234  |

---

## Environment Variables (`frontend/backend/.env`)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/healthdb
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-70b-8192
CLIENT_URL=http://localhost:3000
```

---

## What Works

### Patient
- Dashboard with health stats, vitals, upcoming appointments
- Health Data — log vitals (heart rate, BP, glucose, SpO2, temp)
- Medications — track medications, mark as taken
- Appointments — book with ANY approved doctor, view/cancel
- AI Insights — health analysis, risk score, suggestions, medication research (needs Groq key)
- Chat — message ANY approved doctor, real-time with Socket.IO
- Reports — upload/share medical reports
- Emergency — SOS alerts

### Doctor
- Dashboard — total patients assigned, prescriptions written, today's appointments
- My Patients — all assigned patients
- Patient Detail — vitals, write prescriptions (correct `medicines` field), notes
- Prescriptions — view all prescriptions or by patient
- Appointments — confirm, mark arrived, write prescription inline, cancel

### Admin
- Dashboard — system stats
- Users — manage all users
- Doctor Approvals — approve/reject doctor registrations

---

## Bugs Fixed in This Version

1. **Appointment booking** — doctors now show correctly (only admin-approved doctors)
2. **Doctor dashboard** — shows Total Patients Assigned, My Patients, Prescriptions Written, Today's Appointments, Completed
3. **AI Insights** — all features work: Analysis, Risk Score, Suggestions, Medication Research
4. **Chat** — shows ALL approved doctors (not just assigned one), real-time messages, unread badges
5. **Prescriptions** — fixed `medicines` field (was incorrectly using `medications`)
6. **Seeder** — demo doctor account now has `isApproved: true` so login works
7. **PatientDetail** — prescription form sends correct field names to backend
8. **Chat real-time** — socket emits `senderName` so toast shows doctor's name

---

## Project Structure

```
healthcore-fixed-v3/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── services/api.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── components/common/
│   │   │   ├── AppLayout.jsx
│   │   │   └── UI.jsx
│   │   └── pages/
│   │       ├── patient/   (Dashboard, Chat, AIInsights, Appointments, ...)
│   │       ├── doctor/    (Dashboard, Patients, PatientDetail, Prescriptions, Appointments)
│   │       └── admin/     (Dashboard, Users, DoctorApprovals)
│   └── backend/
│       ├── server.js
│       ├── .env
│       ├── controllers/
│       ├── routes/
│       ├── models/
│       ├── middleware/
│       ├── config/
│       └── utils/
└── README.md
```
