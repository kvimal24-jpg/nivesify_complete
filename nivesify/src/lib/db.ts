import { drizzle } from 'drizzle-orm/d1';
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "../db/schema";

export function getDb() {
  // This helper gets the "Environment" from Cloudflare (where your DB lives)
  const { env } = getCloudflareContext();

  // We connect using the binding name 'nivesify_db' you created earlier
  // @ts-ignore
  return drizzle(env.nivesify_db, { schema });
}