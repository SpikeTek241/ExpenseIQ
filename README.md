# 💰 ExpenseIQ — Full-Stack Expense Intelligence Dashboard

ExpenseIQ is a full-stack financial analytics platform designed to help users track spending, analyze behavior, and gain actionable insights through real-time data visualization.

Built with a modern tech stack and production-style architecture, this project demonstrates end-to-end development—from API design to responsive UI/UX.

---

## 🚀 Live Demo

👉 https://expense-iq-lilac.vercel.app/

---

## 🧱 Architecture Overview

ExpenseIQ follows a client-server architecture:

* **Frontend:** React + TypeScript (Vite)
* **Backend:** Node.js + Express
* **Database:** PostgreSQL (via Prisma ORM)
* **Data Flow:** RESTful API → JSON → UI state → Charts/Insights

```txt
Client (React) → API (Express) → Database (PostgreSQL)
```

---

## 🛠 Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Recharts (data visualization)

### Backend

* Node.js
* Express
* Prisma ORM

### Database

* PostgreSQL

### Deployment

* Vercel (Frontend)
* (Render / Local) Backend

---

## ✨ Core Features

### 🔐 Authentication

* JWT-based authentication system
* Protected routes for user-specific data access

### 💸 Transaction Management

* Create, update, delete transactions
* Category-based organization
* Real-time updates

### 📊 Analytics Dashboard

* Category spending breakdown
* Daily spending trends
* Cumulative spending tracking
* Percentage distribution by category

### 📅 Smart Filtering

* Last 7 days
* Last 30 days
* All-time analytics

### 🧠 Intelligent Insights

* Total spending summaries
* Highest transaction detection
* Peak spending day analysis
* Behavior-driven insights

### 📤 Export System

* Export transactions to CSV format
* Structured for external financial analysis

### ⚡ UX Enhancements

* Loading states
* Empty states
* Responsive layout
* Smooth data updates

---

## 📸 Screenshots
## Demo
<img width="1138" height="926" alt="dashboard" src="https://github.com/user-attachments/assets/31a7040f-e563-4c8b-94d1-77f07fa86261" />
<img width="1270" height="931" alt="transactions" src="https://github.com/user-attachments/assets/e4263075-f1b5-4167-80bd-d39adf061336" />
<img width="1680" height="1050" alt="Updated AI Analytics" src="https://github.com/user-attachments/assets/c919f711-e57b-463e-9435-e63f047da3fa" />

---

## ⚙️ Local Setup

### 1. Clone repository

```bash
git clone https://github.com/your-username/ExpenseIQ.git
cd ExpenseIQ
```

### 2. Install dependencies

```bash
cd client
npm install

cd ../server
npm install
```

### 3. Configure environment variables

Create `.env` in server:

```env
DATABASE_URL=your_postgres_url
JWT_SECRET=your_secret
```

### 4. Run application

```bash
# Backend
cd server
npm run dev

# Frontend
cd ../client
npm run dev
```

---

## 📌 API Overview

### Transactions

* `GET /api/transactions`
* `POST /api/transactions`
* `PUT /api/transactions/:id`
* `DELETE /api/transactions/:id`

### Budgets

* `GET /api/budgets`
* `POST /api/budgets`

### Insights

* `GET /api/insights`

---

## 🧠 Engineering Highlights

* Designed normalized relational schema using Prisma
* Implemented secure user-scoped queries
* Built reusable data transformation layers for analytics
* Optimized rendering with React hooks (`useMemo`)
* Structured scalable API routes with middleware authentication

---

## 🚧 Future Improvements

* OAuth (Google Login)
* Recurring transactions
* AI-powered financial assistant
* Notifications & alerts
* Mobile optimization
* Unit & integration testing
* Docker containerization

---

## 📈 What This Project Demonstrates

* Full-stack development (frontend + backend + database)
* API design and data modeling
* Real-time data processing
* Analytics and visualization
* UX-focused engineering decisions

---

## 👤 Author

**Kevin Jerome**
Full-Stack Developer | React | Node.js | TypeScript

---

⭐ If you found this project valuable, consider starring the repo!

<img width="1680" height="1050" alt="Updated AI Analytics " src="https://github.com/user-attachments/assets/666bb967-50ae-4bff-91c1-f0888ed3fa41" />

