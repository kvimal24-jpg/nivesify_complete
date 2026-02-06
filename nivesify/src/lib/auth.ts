import { Google } from "arctic";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// 1. Setup Google Auth
export function getGoogleAuth() {
  const { env } = getCloudflareContext();
  
  // SANITIZATION FIX: We .trim() the keys to remove invisible spaces/newlines
  const clientId = (env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (env.GOOGLE_CLIENT_SECRET || "").trim();
  let baseUrl = (env.NEXT_PUBLIC_BASE_URL || "").trim();

  // Safety check for Base URL slash
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }
  
  const redirectUrl = `${baseUrl}/api/auth/callback/google`;

  return new Google(clientId, clientSecret, redirectUrl);
}

// 2. JWT Helper (Edge Compatible)
export async function signSession(payload: any) {
  const { env } = getCloudflareContext();
  // Sanitize the JWT secret too
  const cleanSecret = (env.JWT_SECRET || "default_secret").trim();
  const secret = new TextEncoder().encode(cleanSecret);
  
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d") 
    .sign(secret);
}

export async function verifySession(token: string) {
  const { env } = getCloudflareContext();
  const cleanSecret = (env.JWT_SECRET || "default_secret").trim();
  const secret = new TextEncoder().encode(cleanSecret);
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (e) {
    return null;
  }
}

// 3. Get Current User
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  return await verifySession(token);
}