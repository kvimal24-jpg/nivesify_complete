import { getGoogleAuth, signSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  console.log("[CALLBACK] Received OAuth callback");
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("[CALLBACK] OAuth error:", error);
    return new NextResponse(`OAuth request error: ${error}`, { status: 400 });
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  const storedVerifier = cookieStore.get("google_code_verifier")?.value;

  console.log("[CALLBACK] State validation:", { hasCode: !!code, hasState: !!state, statesMatch: state === storedState });

  if (!code || !state || !storedState || !storedVerifier || state !== storedState) {
    console.error("[CALLBACK] Invalid request - missing parameters");
    return new NextResponse("Invalid Request", { status: 400 });
  }

  try {
    const google = getGoogleAuth();
    
    // Exchange Code
    const tokens: any = await google.validateAuthorizationCode(code, storedVerifier);
    let rawToken = typeof tokens.accessToken === 'function' ? tokens.accessToken() : tokens.accessToken;
    const cleanToken = String(rawToken).trim();

    // Get User
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${cleanToken}` },
    });
    const googleUser = await response.json() as any;

    const db = getDb();
    const existingUser = await db.select().from(users).where(eq(users.email, googleUser.email)).get();
    
    let finalUserId = existingUser ? existingUser.id : googleUser.id;

    if (!existingUser) {
      await db.insert(users).values({
        id: finalUserId,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      });
    }

    // Create Session
    const sessionToken = await signSession({ userId: finalUserId, email: googleUser.email });
    cookieStore.set("session_token", sessionToken, {
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });

    // Clean up
    cookieStore.delete("google_oauth_state");
    cookieStore.delete("google_code_verifier");

    // FIX: Always redirect to Home Page, never force Dashboard
    return NextResponse.redirect(new URL("/", request.url));

  } catch (e: any) {
    console.error(e);
    return new NextResponse(`Critical Error: ${e.message}`, { status: 500 });
  }
}