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

    const [lapsRes, positionsRes, stintsRes] = await Promise.all([
      fetch(`${BASE_URL}/laps?session_key=${sessionKey}`),
      fetch(`${BASE_URL}/position?session_key=${sessionKey}`),
      fetch(`${BASE_URL}/stints?session_key=${sessionKey}`),
    ]);

    if (!lapsRes.ok || !positionsRes.ok || !stintsRes.ok) {
      throw new Error("Failed to fetch session data");
    }

    const [laps, positions, stints] = await Promise.all([
      lapsRes.json(),
      positionsRes.json(),
      stintsRes.json(),
    ]);

    return NextResponse.json({
      laps,
      positions,
      stints,
    });
  } catch (error) {
    console.error("Error in /api/session-data:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch session data",
      },
      { status: 500 }
    );
  }
}