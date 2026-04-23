import { NextRequest, NextResponse } from "next/server";
import { getSessions } from "@/lib/openf1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");

    const year = yearParam ? Number(yearParam) : undefined;

    if (yearParam && Number.isNaN(year)) {
      return NextResponse.json(
        { error: "Invalid year parameter" },
        { status: 400 }
      );
    }

    const sessions = await getSessions(year);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error in /api/sessions:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch sessions",
      },
      { status: 500 }
    );
  }
}