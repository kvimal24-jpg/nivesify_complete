import { getR2JsonResponse } from "@/lib/r2";

export async function GET() {
  // Fetch the file with the exact name 'amfi_raw.json' in the expected folder
  return getR2JsonResponse("data/latest/amfi_raw.json");
}
