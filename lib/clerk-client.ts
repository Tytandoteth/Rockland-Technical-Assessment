/** True when Clerk browser SDK is configured (client bundle). */
export function isClerkConfigured(): boolean {
  const k = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return typeof k === "string" && k.trim().length > 0;
}
