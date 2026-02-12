import { generateState, generateCodeVerifier } from "arctic";
import { getGoogleAuth } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


export async function GET() {
  console.log("[AUTH] Starting Google OAuth flow");
  const google = getGoogleAuth();
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  // FIX: We pass the scopes directly as a list, NOT inside { }
  const url = await google.createAuthorizationURL(state, codeVerifier, ["profile", "email"]);
  console.log("[AUTH] Redirecting to Google:", url.toString());

  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", state, {
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
  });
  cookieStore.set("google_code_verifier", codeVerifier, {
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(url);
}