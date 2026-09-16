import { publicSubmissionClient } from "@/lib/public-submissions";
import { NextResponse } from "next/server";
import { getShowroomContent } from "@/lib/showroom-queries";
import { googlePlaceSchema } from "@/lib/google-reviews";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET() {
  const { google } = await getShowroomContent();
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!google.enabled || !google.placeId || !key)
    return NextResponse.json({ available: false }, { headers });
  try {
    await publicSubmissionClient("reviews");
    // Fixed origin and encoded ID: no caller-controlled upstream URL or credentials.
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(google.placeId)}?languageCode=pt-PT`,
      {
        headers: {
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask":
            "rating,userRatingCount,googleMapsUri,reviews,attributions",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
        redirect: "error",
      },
    );
    if (!response.ok)
      return NextResponse.json({ available: false }, { headers });
    const result = googlePlaceSchema.safeParse(await response.json());
    return NextResponse.json(
      result.success
        ? { available: true, place: result.data }
        : { available: false },
      { headers },
    );
  } catch {
    return NextResponse.json({ available: false }, { headers });
  }
}
