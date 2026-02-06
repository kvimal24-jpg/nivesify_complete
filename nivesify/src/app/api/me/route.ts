import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  // 1. Check Cookie
  const session = await getSession();
  
  // We strictly check if session OR userId is missing
  if (!session || !session.userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // 2. Fetch full user details from Database
  const db = getDb();
  
  // FIX: We force TypeScript to treat this as a string
  const userIdString = session.userId as string;

  const user = await db.select().from(users).where(eq(users.id, userIdString)).get();

  return NextResponse.json({ user });
}