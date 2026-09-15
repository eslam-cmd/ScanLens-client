# ScanLens — Frontend Client

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)

A modern, responsive web application built with Next.js and TypeScript for comprehensive security scanning and vulnerability assessment. Provides an intuitive interface for managing scans, viewing reports, and handling subscriptions.

> 🔗 Backend repository: [ScanLens — Backend API](https://github.com/eslam-cmd/ScanLens-server)

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.17
- npm package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/eslam-cmd/ScanLens-client.git
cd ScanLens-client

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📁 Project Structure

```text
client/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout wrapper
│   ├── page.tsx                 # Homepage
│   ├── admin/                   # Admin dashboard
│   ├── auth/                    # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── verify/
│   ├── scan/                    # Scanning interface
│   ├── history/                 # Scan history & details
│   ├── subscription/            # Subscription management
│   ├── buy-license/             # License purchasing
│   ├── settings/                # User settings
│   └── help/                    # Help & documentation
├── components/                  # Reusable React components
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── UpgradeModal.tsx
├── lib/                         # Utilities & helpers
│   ├── api.ts                   # Axios API client
│   ├── plans.config.ts          # Subscription plans
│   └── guards/                  # Route protection
│       ├── withAuth.tsx
│       ├── withAdmin.tsx
│       └── withSubscription.tsx
├── public/
│   └── img/
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
└── package.json
```

---

## ✨ Key Features

- 🔍 **Scan Management** — Create, execute, and manage security scans
- 📈 **Detailed Reports** — Comprehensive vulnerability assessment reports
- 🤖 **AI Recommendations** — Gemini-powered remediation suggestions
- 👥 **Authentication** — Secure login, registration, and email verification
- 💳 **Subscription Management** — Handle plans, billing, and licensing
- ⚙️ **User Settings** — Customizable preferences
- 👨‍💼 **Admin Dashboard** — Manage users and system configuration

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Next.js 15+** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS 4+** | Utility-first styling |
| **React** | UI component library |
| **Axios** | HTTP client for API requests |

---

## 🔐 Authentication & Authorization

Protected routes using custom guards:

- `withAuth` — Requires authenticated user session
- `withAdmin` — Requires admin privileges
- `withSubscription` — Validates active subscription status

---

## 🛠️ Development

```bash
# Production build
npm run build
npm run start

# Linting
npm run lint
```

---

## 📸 Screenshots

### Dashboard
![Dashboard](public/img/dashboard.png)

### Scan Results
![Scan Results](public/img/scan-results.png)

### AI Recommendations
![AI Recommendations](public/img/ai-recommendations.png)

### Admin Panel
![Admin Panel](public/img/admin-panel.png)

---

## 📬 Contact

**Islam Hadaya**

- Portfolio: [Personal Website](https://my-profile-personal-nextjs.vercel.app)
- LinkedIn: [linkedin.com/in/islam-hadaya](https://linkedin.com/in/islam-hadaya)
- Email: hdayaaslam34@gmail.com

---

*Last Updated: August 2026*
