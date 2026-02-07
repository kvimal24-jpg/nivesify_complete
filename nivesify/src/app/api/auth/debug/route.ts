import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export async function GET() {
  const { env } = getCloudflareContext();
  
  // Get the values (mask secrets for security)
  const clientId = (env.GOOGLE_CLIENT_ID || "NOT_SET").trim();
  const baseUrl = (env.NEXT_PUBLIC_BASE_URL || "NOT_SET").trim();
  
  // Construct what the redirect URI would be
  const sanitizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const redirectUri = `${sanitizedBaseUrl}/api/auth/callback/google`;
  
  const diagnostics = {
    client_id: clientId,
    client_id_length: clientId.length,
    client_secret_set: env.GOOGLE_CLIENT_SECRET ? "YES" : "NO",
    base_url: baseUrl,
    computed_redirect_uri: redirectUri,
    environment: env.NODE_ENV || "production",
  };
  
  return NextResponse.json(diagnostics, { status: 200 });
}
