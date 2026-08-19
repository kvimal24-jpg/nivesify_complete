import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

const CACHE_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
};

export const getR2JsonResponse = async (key: string) => {
  const { env } = getCloudflareContext();
  const bucket = env.MF_DATA_BUCKET;

  if (!bucket) {
    return NextResponse.json({ error: "R2 bucket binding missing" }, { status: 500 });
  }

  const object = await bucket.get(key);
  if (!object) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new Response(object.body, { headers: CACHE_HEADERS });
};

const extractDateTag = (key: string) => {
  const match = key.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
};

export const getLatestR2JsonResponse = async (prefix: string) => {
  const { env } = getCloudflareContext();
  const bucket = env.MF_DATA_BUCKET;

  if (!bucket) {
    return NextResponse.json({ error: "R2 bucket binding missing" }, { status: 500 });
  }

  const listed = await bucket.list({ prefix, limit: 1000 });
  if (!listed.objects.length) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const sorted = [...listed.objects].sort((a, b) => {
    const aDate = extractDateTag(a.key);
    const bDate = extractDateTag(b.key);
    if (aDate && bDate) return bDate.localeCompare(aDate);
    if (a.uploaded && b.uploaded) return b.uploaded.getTime() - a.uploaded.getTime();
    return b.key.localeCompare(a.key);
  });

  const object = await bucket.get(sorted[0].key);
  if (!object) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new Response(object.body, { headers: CACHE_HEADERS });
};
