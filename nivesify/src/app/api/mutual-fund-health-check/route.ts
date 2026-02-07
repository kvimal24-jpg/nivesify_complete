import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { mutualFundHealthCheck } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) return new NextResponse("Unauthorized", { status: 401 });

    const db = getDb();
    const userId = session.userId as string;

    const result = await db
      .select()
      .from(mutualFundHealthCheck)
      .where(eq(mutualFundHealthCheck.userId, userId))
      .get();

    let data: any = result?.data || null;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        data = null;
      }
    }

    if (data?.summary) {
      data.summary = {
        ...data.summary,
        invested: toNumber(data.summary.invested),
        currentValue: toNumber(data.summary.currentValue),
      };
    }

    if (data?.transactions?.length) {
      data.transactions = data.transactions.map((txn: any) => ({
        ...txn,
        amount: toNumber(txn.amount),
        price: toNumber(txn.price),
        units: toNumber(txn.units),
        matchingScheme: txn.matchingScheme
          ? {
              ...txn.matchingScheme,
              schemeCode: toNumber(txn.matchingScheme.schemeCode),
            }
          : txn.matchingScheme,
      }));
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to load data", detail: error?.message || "unknown" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const db = getDb();
    const userId = session.userId as string;

    await db
      .insert(mutualFundHealthCheck)
      .values({
        userId,
        data: body,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: mutualFundHealthCheck.userId,
        set: {
          data: body,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to save data", detail: error?.message || "unknown" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session || !session.userId) return new NextResponse("Unauthorized", { status: 401 });

    const db = getDb();
    const userId = session.userId as string;

    await db.delete(mutualFundHealthCheck).where(eq(mutualFundHealthCheck.userId, userId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete data", detail: error?.message || "unknown" },
      { status: 500 }
    );
  }
}
