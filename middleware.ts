import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const hasClerkSecret = Boolean(process.env.CLERK_SECRET_KEY?.trim());

/** Avoid Clerk middleware when secrets are missing (local dev without auth). */
export default hasClerkSecret
  ? clerkMiddleware()
  : function passthrough() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
