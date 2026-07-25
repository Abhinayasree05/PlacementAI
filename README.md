# 🎯 PlacementAI — Student Placement Portal

Final-year project: a premium React + TypeScript authentication system and
student dashboard, built with real Firebase Authentication (Email/Password,
Google OAuth, Phone OTP) and Firestore for profile storage.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Build tool | Vite |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Routing | React Router v7 |
| State | Zustand |
| Forms & validation | React Hook Form + Zod |
| Auth & DB | Firebase Authentication + Firestore |
| Icons | Lucide React |

## 2. Prerequisites

- Node.js 18+ and npm
- A free [Firebase](https://console.firebase.google.com) account

## 3. Firebase Setup (required — auth will not work without this)

1. Go to the [Firebase Console](https://console.firebase.google.com) → **Add project**.
2. Once created, go to **Project settings → General → Your apps → Add app → Web (`</>`)**.
   Register the app and copy the `firebaseConfig` object it shows you.
3. Go to **Authentication → Sign-in method** and enable:
   - **Email/Password**
   - **Google**
   - **Phone** — the free Spark plan allows a limited number of *test* phone
     numbers (Authentication → Sign-in method → Phone → Phone numbers for
     testing). Real SMS delivery at scale requires the pay-as-you-go
     **Blaze plan**.
4. Go to **Firestore Database → Create database** (start in production mode).
   Then paste the contents of `firestore.rules.example` into
   **Firestore Database → Rules** and publish.
5. (For the "Forgot Password" email flow) Authentication → Templates →
   Password reset — customize if you like; it works out of the box either way.

## 4. Project Setup

```bash
cd placementai-react
npm install
cp .env.example .env
```

Open `.env` and paste in the config values from step 2 above:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 5. Run it

```bash
npm run dev
```
Opens at `http://localhost:5173`.

## 6. Build for production

```bash
npm run build
npm run preview   # serve the production build locally to sanity-check it
```

## 7. Deploy

Any static host works (Vercel, Netlify, Firebase Hosting). For Firebase Hosting:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # point it at the "dist" folder, configure as a single-page app
npm run build
firebase deploy
```
**Important:** in Firebase Console → Authentication → Settings → **Authorized domains**,
add your deployed domain (e.g. `your-app.vercel.app`) or Google/Phone sign-in
will be blocked on that domain.

---

## Folder Structure

```
src/
├── components/
│   ├── ui/            # Button, Input, PasswordInput, OtpInput, Checkbox,
│   │                     PasswordStrengthMeter, Card, CircularLoader,
│   │                     SuccessCheck, Skeleton, ErrorBoundary
│   ├── layout/         # AuthLayout (split-screen), DashboardLayout, Sidebar, Topbar
│   └── shared/         # RobotIllustration, FeatureRow, GoogleIcon, ProgressRing, BarChart
├── pages/
│   ├── auth/            # LoginPage, SignUpPage, ForgotPasswordPage, ResetPasswordPage, PhoneAuthPage
│   └── dashboard/       # DashboardPage, ProfilePage, PlaceholderPage (Coding/Resume/Interview/Aptitude/etc.)
├── lib/
│   ├── firebase.ts      # Firebase app/auth/firestore initialization
│   └── authActions.ts   # All signup/login/Google/OTP/reset-password calls
├── store/authStore.ts    # Zustand auth state
├── schemas/authSchemas.ts # Zod validation (incl. password rules)
├── hooks/useAuthListener.ts
├── routes/ProtectedRoute.tsx  # ProtectedRoute + GuestRoute
└── types/user.ts
```

## Notes on a couple of flows

- **Forgot Password** uses Firebase's real, secure mechanism: an emailed
  reset **link** (not a typed OTP). A true numeric email-OTP flow needs a
  backend (Cloud Function + email provider) to generate and verify a code
  server-side — Firebase Auth doesn't do this natively. The UI is built to
  match the requested step-by-step feel (email → check inbox → new password
  → confirm → success) using the real link-based flow under the hood; see
  `ForgotPasswordPage.tsx` and `ResetPasswordPage.tsx`.
- **Phone OTP** is genuinely functional (not simulated) via Firebase's
  `signInWithPhoneNumber` + invisible reCAPTCHA — once Phone sign-in is
  enabled in your Firebase project (step 3 above), it sends real SMS codes.
- **Profile photo upload** on Sign Up currently stores the image as a data
  URL for simplicity. For production, swap in Firebase Storage: upload the
  file, get the download URL, and store that instead (see the note in
  `SignUpPage.tsx`).

## What's implemented vs. placeholder

Fully functional: authentication (all 4 methods), signup validation,
password strength meter, protected routing, dashboard shell, profile
editing. The Coding/Resume/Interview/Aptitude/Analytics/Settings/Help pages
are intentionally left as polished placeholder screens — wire in your own
API calls (e.g. Gemini) inside `src/pages/dashboard/PlaceholderPage.tsx`
usages in `App.tsx`.
