import { getGoogleAuth, signSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  const storedVerifier = cookieStore.get("google_code_verifier")?.value;

  if (!code || !state || !storedState || !storedVerifier || state !== storedState) {
    return new NextResponse("Invalid Request", { status: 400 });
  }

  try {
    const google = getGoogleAuth();
    
    // FIX 1: Cast to 'any' to stop TypeScript from complaining about the type
    const tokens: any = await google.validateAuthorizationCode(code, storedVerifier);
    
    // FIX 2: Check if accessToken is a function (newer versions) or a string (older versions)
    let rawToken;
    if (typeof tokens.accessToken === 'function') {
      rawToken = tokens.accessToken();
    } else {
      rawToken = tokens.accessToken;
    }

    // FIX 3: Safe trim
    const cleanToken = String(rawToken).trim();

    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${cleanToken}` },
    });
    
    const googleUser = await response.json() as any;

    const db = getDb();
    const existingUser = await db.select().from(users).where(eq(users.email, googleUser.email)).get();
    
    let finalUserId: string;

    if (existingUser) {
      finalUserId = existingUser.id;
    } else {
      finalUserId = googleUser.id;
      await db.insert(users).values({
        id: finalUserId,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      });
    }

    const sessionToken = await signSession({ userId: finalUserId, email: googleUser.email });
    
    cookieStore.set("session_token", sessionToken, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });

    cookieStore.delete("google_oauth_state");
    cookieStore.delete("google_code_verifier");

    return NextResponse.redirect(new URL("/dashboard", request.url));

  } catch (e: any) {
    console.error(e);
    return new NextResponse(`Critical Error: ${e.message}`, { status: 500 });
  }
}