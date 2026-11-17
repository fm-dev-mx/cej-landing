# 🏗️ CEJ Landing (MVP)

Landing page **for Concreto y Equipos de Juárez (CEJ)** — a construction materials company based in Ciudad Juárez.
This project provides a **functional, mobile-first landing page** featuring a **concrete cost calculator**, **Meta Pixel tracking**, and **WhatsApp lead generation** for contractors and builders.

---

## 🚀 Overview

**CEJ Landing** is built to capture qualified leads by allowing users to estimate the cost of ready-mix concrete directly on the page, view a transparent price breakdown, and contact CEJ instantly via WhatsApp or phone.

It’s designed as a **fast, scalable, and trackable MVP**, deployable to Vercel, with clean code and a modular architecture ready for future growth (e.g., saving leads, CRM integration, API expansion).

---

## Worktree layout

The primary checkout is `D:/code/cej-landing`. Keep isolated worktrees under
`D:/code/cej-landing-worktrees/<work-name>`, following the same sibling-folder
convention as Celebra-me. Worktrees share this repository's Git history; they are
not separate projects or deployment destinations.

The first increment is on branch `feat/cej-first-increment` at
`D:/code/cej-landing-worktrees/first-increment`. Run its commands from that folder.
See [the execution record](docs/first-increment.md) for local setup, verification
and remaining blockers, and [the cutover review](docs/cutover-review.md) for the
production boundary. No production cutover has been executed.

To add another isolated worktree, choose an unused work name and branch:

```powershell
git -C D:/code/cej-landing worktree add -b feat/<work-name> D:/code/cej-landing-worktrees/<work-name> main
```

Use `git worktree move` to relocate existing worktrees after stopping their local
processes; preserve all uncommitted and untracked files.

## Shared board

Pending first-increment work is tracked in the `cej-landing` project of the
[active local board](http://127.0.0.1:4320/), using
`D:/code/celebra-me/tablero.config.json`. Objective T1419 cej-primer-incremento
has six child tasks. See [the task index](docs/board-tracking-active.md) for fixed
task numbers, dependencies, matching prompts and exact CLI commands. Preparation
copies in the other configuration were cancelled with replacement references.
Tasks remain unassigned; this integration does not dispatch agents or authorize Production.

## 🧩 Features

### 🧱 Concrete Calculator
- Real-time calculation by **resistance (f’c)**, **service type (pumped/tirado)**, and **zone/freight**.
- Optional additives.
- Transparent cost breakdown (Base + Extras + Freight + VAT + Total).
- Input validation (minimum m³, numeric formatting, etc.).

### 💬 Lead Capture
- **WhatsApp CTA** with prefilled message including UTM parameters.
- **Phone CTA** with Pixel `Contact` event.
- Optional email CTA (future version).

### 📊 Meta Pixel Tracking
- `PageView`, `ViewContent`, `Lead`, and `Contact` events with proper parameters:
  - `value`, `currency`, `contents`, `content_category`, and custom `lead_type`.

### ⚙️ Technical Foundation
- **Next.js 16 (App Router)**
- **TypeScript** for type safety and maintainability
- **SCSS Modules** for scoped, clean styling
- **pnpm** for fast, reproducible dependency management
- **Vercel-ready static output** (`output: export`)
- Pixel script initialization managed via `useEffect` hook

---

## 🛠️ Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| Framework | **Next.js (App Router)** | Modern React-based architecture |
| Language | **TypeScript** | Type safety and cleaner code |
| Styling | **SCSS Modules** | Modular styles with shared variables/mixins |
| Package Manager | **pnpm** | Fast, deterministic installs |
| Hosting | **Vercel** | Zero-config deployment |
| Tracking | **Meta Pixel** | Lead and conversion tracking |
| Communication | **WhatsApp API** | Instant lead generation |

---

## 🧱 Project Structure

```

cej-landing/
├─ app/
│  ├─ layout.tsx          # Root layout with global styles
│  └─ page.tsx            # Main landing + calculator
├─ components/
│  ├─ Calculator/         # Main calculator logic and UI
│  └─ CTAButtons.tsx      # Persistent bottom CTAs
├─ lib/
│  ├─ pricing.ts          # Pricing tables and constants
│  ├─ pixel.ts            # Pixel initialization + event tracking
│  └─ utils.ts            # Helpers (formatting, WhatsApp link)
├─ styles/
│  ├─ globals.scss        # Global base styles
│  ├─ _variables.scss     # Color palette and variables
│  └─ _mixins.scss        # Shared mixins
├─ public/
│  └─ logo-cej.svg
└─ .env.local             # Environment variables (ignored by Git)

````

---

## ⚙️ Environment Variables

Create a file called `.env.local` at the project root with:

```bash
NEXT_PUBLIC_PIXEL_ID=XXXXXXXXXXXXXX
NEXT_PUBLIC_WHATSAPP_NUMBER=521656XXXXXXX
NEXT_PUBLIC_PHONE=521656XXXXXXX
NEXT_PUBLIC_SITE_URL=https://cej.com.mx
````

Or use `.env.example` as a template.

---

## 🧠 Scripts

| Command      | Description                        |
| ------------ | ---------------------------------- |
| `pnpm dev`   | Run development server (Turbopack) |
| `pnpm build` | Generate production build          |
| `pnpm start` | Serve production build locally     |
| `pnpm lint`  | Run ESLint checks                  |

---

## 🧾 Deployment

### Vercel (recommended)

1. Push this repository to GitHub.
2. Connect it to [Vercel](https://vercel.com).
3. Add the environment variables above in **Project Settings → Environment Variables**.
4. Deploy → Your landing page is live 🚀.

---

## 🧰 Roadmap (next iterations)

* [ ] Serverless API endpoint for saving leads (via `/app/api/lead/route.ts`)
* [ ] Automatic quote ID (`folio`) per lead
* [ ] Integration with Facebook Conversions API (CAPI)
* [ ] Dark mode + theming system
* [ ] SEO enhancements (structured data + OG tags)

---

## 👤 Author

**Francisco Mendoza**
Full-stack developer & marketing automation specialist
[fm-dev-mx](https://github.com/fm-dev-mx)

---

## 📄 License

This project is licensed under the **MIT License**.
See the [LICENSE](LICENSE) file for details.
