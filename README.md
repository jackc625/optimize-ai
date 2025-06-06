# optimize.ai 🧠⚡

A modern full-stack wellness and self-optimization platform built with **Next.js**, **Supabase**, and **Tailwind CSS**.
Track your habits, macros, and weight—all in one place.

---

## 🚀 Features

- ✅ Secure user authentication (Supabase Auth)
- 🔄 Habit tracker with daily check-offs and streaks
- 📈 Weight tracker with history, editing, and goal reference line
- 🥗 Macro nutrition calculator (BMR, maintenance, target calories, macros)
- 🛡️ Row-Level Security so users only access their own data
- 🔔 Toast notifications for success/error feedback
- 📊 Responsive charts (Chart.js) for weight progress

---

## 🖥️ Tech Stack

- [Next.js (App Router)](https://nextjs.org/)
- [Supabase (PostgreSQL, Auth, Edge Functions, RLS)](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui (for accessible components)](https://ui.shadcn.com/)
- [react-chartjs-2](https://github.com/reactchartjs/react-chartjs-2)
- [react-hot-toast (for notifications)](https://react-hot-toast.com/)
- TypeScript, ESLint, Prettier

---

## 📸 Screenshots

Coming soon!

---

## 🛠️ Local Development

1. Clone the repo

   ```bash
   git clone https://github.com/YOUR_USERNAME/optimize-ai.git
   cd optimize-ai
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up Supabase:

   - Create a project at [supabase.com](https://supabase.com)
   - Copy your API keys into an `.env.local` file:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
     ```

4. Run the dev server
   ```bash
   npm run dev
   ```

---

## 📚 Project Structure

```php
.
├── .github/
│   └── workflows/
│       └── ci.yml           # CI workflow for lint & type-check
├── public/                  # Static assets (favicon, etc.)
├── src/
│   ├── app/
│   │   ├── auth/             # Login & signup pages
│   │   ├── dashboard/
│   │   │   ├── habits/       # Habit tracker pages
│   │   │   ├── weight/       # Weight tracker pages
│   │   │   └── profile/      # Profile setup & edit pages
│   │   └── layout.tsx        # Global app layout
│   ├── components/           # Reusable UI components
│   │   ├── AuthForm.tsx
│   │   ├── ProfileForm.tsx
│   │   ├── MacroSummary.tsx
│   │   └── WeightChart.tsx
│   ├── hooks/                # Custom React hooks
│   │   ├── useUser.ts
│   │   ├── useAuthAndProfileGuard.ts
│   │   ├── useHabits.ts
│   │   ├── useWeightLogs.ts
│   │   └── useMacros.ts
│   ├── lib/
│   │   └── supabaseClient.ts  # Supabase client initialization
│   ├── schemas/
│   │   └── profileSchema.ts   # Zod validation schema
│   ├── types/
│   │   └── database.ts        # TS interfaces for Supabase tables
│   ├── utils/
│   │   └── calculateMacros.ts # Macro calculation logic
│   └── styles/                # Custom CSS (if any)
├── .env.example
├── .eslintrc.js
├── package.json
└── README.md                  # (this file)
```

## ✅ To Do (Future Features)

- [ ] Meal planner with macro targets
- [ ] Workout routine builder
- [ ] Habit templates (e.g., "Morning Routine")
- [ ] Calendar view for habit logs
- [ ] Custom notifications/reminders (e.g., “Log your weight”)
- [ ] Dark mode
- [ ] Settings & profile
- [ ] Native iOS app (Expo/React Native or Swift + Supabase)

---

## 📄 License

MIT — use this freely to build your own system of discipline and progress.
