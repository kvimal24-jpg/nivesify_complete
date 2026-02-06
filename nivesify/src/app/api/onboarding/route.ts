import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { onboarding } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET: Retrieve the saved data
export async function GET() {
  const session = await getSession();
  if (!session || !session.userId) return new NextResponse("Unauthorized", { status: 401 });

  const db = getDb();
  // Force userId to be string
  const userId = session.userId as string;

  const result = await db.select().from(onboarding).where(eq(onboarding.userId, userId)).get();

  return NextResponse.json({ data: result?.data || {} });
}

// POST: Save the data
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.userId) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const db = getDb();
  const userId = session.userId as string;

  // We use "onConflictDoUpdate" to handle both "Create" and "Update" logic automatically
  await db.insert(onboarding)
    .values({
      userId: userId,
      data: body, // Drizzle automatically converts this JSON object to a string
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: onboarding.userId,
      set: {
        data: body,
        updatedAt: new Date()
      }
    });

  return NextResponse.json({ success: true });
}