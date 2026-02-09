import { getLatestR2JsonResponse } from "@/lib/r2";

export async function GET() {
  return getLatestR2JsonResponse("data/latest/amfi_raw_");
}
