import { getR2JsonResponse } from "@/lib/r2";

export async function GET() {
  return getR2JsonResponse("data/latest/industry-and-category-insights.json");
}
