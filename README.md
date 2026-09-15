# ScanLens — Frontend Client

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A modern, responsive web application built with Next.js and TypeScript for automated security scanning and vulnerability assessments. The frontend delivers an intuitive interface for executing security audits, analyzing vulnerability breakdowns, managing subscriptions, and system administration.

> 🔗 Backend repository: [ScanLens — Backend API](https://github.com/eslam-cmd/ScanLens-server)

---

## ✨ Key Features

- **🔍 Scan Management:** Real-time interface to trigger, monitor, and review web application security audits.
- **📈 Detailed Security Audits:** Comprehensive visual breakdown of vulnerability assessments, HTTP headers, SSL/TLS certificates, and CORS rules.
- **🤖 AI-Powered Remediation:** Contextual security fix recommendations directly embedded in the results view.
- **💳 Subscription & Licensing:** Multi-tiered plan selection (Free, Pro, Extra) with dynamic feature access.
- **👨‍💼 Admin Dashboard:** Centralized management system for user administration, scan quotas, and platform metrics.
- **🔐 Multi-Tier Route Protection:** Custom higher-order components (HOCs) enforcing strict access boundaries based on authentication and active subscription status.

---

## 🛠️ Key Technologies

| Technology | Purpose |
| :--- | :--- |
| **Next.js 15 (App Router)** | Full-stack React framework utilizing Server & Client Components |
| **TypeScript** | Static typing and interfaces across UI entities and API payloads |
| **Tailwind CSS** | Utility-first styling with high responsiveness |
| **React** | Component-driven declarative user interfaces |
| **Axios** | Interceptor-configured HTTP client for API communications |

---

## 🔐 Authentication & Authorization Architecture

The client enforces strict access control through modular Route Guards:

- `withAuth` — Protects internal pages by verifying active user authentication.
- `withAdmin` — Restricts access strictly to administrative dashboards and control pages.
- `withSubscription` — Enforces feature-gating according to active license tiers.

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.17
- npm or yarn

### Installation

```bash
# Clone the repository
git clone [https://github.com/eslam-cmd/ScanLens-client.git](https://github.com/eslam-cmd/ScanLens-client.git)
cd ScanLens-client

# Install dependencies
npm install
