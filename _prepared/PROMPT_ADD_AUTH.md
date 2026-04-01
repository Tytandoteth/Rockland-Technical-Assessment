# Prompt: Add Clerk Auth

Paste this into Claude Code to execute:

---

Add Clerk authentication to the app using keyless mode (no API keys needed).

## 1. Install Clerk
```bash
npm install @clerk/nextjs
```

## 2. Create middleware
Copy the prepared middleware file to the project root (NOT in `src/`, we don't use `src/`):
```bash
cp _prepared/middleware.ts middleware.ts
```

## 3. Update `app/layout.tsx`
Replace with the prepared layout that wraps everything in `<ClerkProvider>`:
```bash
cp _prepared/layout-with-clerk.tsx app/layout.tsx
```

This layout:
- Wraps `<body>` content in `<ClerkProvider>` (Clerk's context provider)
- Keeps `<ErrorBoundary>` inside `<ClerkProvider>`
- Adds a fixed top-right auth UI:
  - **Signed out:** "Sign In" + "Sign Up" buttons (styled to match rockland brand)
  - **Signed in:** Clerk `<UserButton>` avatar
- Uses `<Show when="signed-in">` / `<Show when="signed-out">` (NOT deprecated `<SignedIn>`/`<SignedOut>`)
- Preserves all existing layout (fonts, metadata, classes)

## 4. That's it for basic auth

Clerk keyless mode auto-generates temporary keys — no env vars, no dashboard signup needed. The app should now show Sign In / Sign Up buttons on the top right.

## Verify
1. Run `npm run dev`
2. You should see Sign In / Sign Up buttons floating top-right
3. Click Sign Up, create a test account
4. After signup, the buttons should be replaced by a user avatar icon
5. All existing functionality (grants, pipeline, AI) should still work identically

Do NOT add any Clerk env vars (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY). Keyless mode handles everything.

Commit message: `feat: add Clerk authentication with keyless mode`
