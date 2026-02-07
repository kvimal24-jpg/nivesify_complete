import { getDb } from "@/lib/db";
import { mfSchemeCache } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const CACHE_ID = "scheme_list";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  const db = getDb();
  const cached = await db.select().from(mfSchemeCache).where(eq(mfSchemeCache.id, CACHE_ID)).get();

  if (cached?.data && cached.updatedAt) {
    const age = Date.now() - new Date(cached.updatedAt).getTime();
    if (age < MAX_AGE_MS) {
      return NextResponse.json({ data: cached.data, cached: true });
    }
  }

  try {
    const res = await fetch("https://api.mfapi.in/mf", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      if (cached?.data) {
        return NextResponse.json({ data: cached.data, cached: true, warning: text });
      }
      return NextResponse.json(
        { error: "Failed to fetch scheme list", detail: text },
        { status: 502 }
      );
    }

    const data = await res.json();
    await db
      .insert(mfSchemeCache)
      .values({ id: CACHE_ID, data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: mfSchemeCache.id,
        set: { data, updatedAt: new Date() },
      });

    return NextResponse.json({ data, cached: false });
  } catch (error: any) {
    if (cached?.data) {
      return NextResponse.json({ data: cached.data, cached: true, warning: error?.message || "unknown" });
    }
    return NextResponse.json(
      { error: "Failed to fetch scheme list", detail: error?.message || "unknown" },
      { status: 502 }
    );
  }
}
