import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.openf1.org/v1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionKey = searchParams.get("session_key");

    if (!sessionKey) {
      return NextResponse.json(
        { error: "session_key is required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${BASE_URL}/drivers?session_key=${sessionKey}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch drivers: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /api/drivers:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch drivers",
      },
      { status: 500 }
    );
  }
}