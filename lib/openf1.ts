const BASE_URL = "https://api.openf1.org/v1";

export async function getSessions(year?: number) {
  const params = new URLSearchParams();

  if (year) {
    params.set("year", String(year));
  }

  const res = await fetch(`${BASE_URL}/sessions?${params.toString()}`, {
    cache: "no-store",
  });

  // Treat 404 as "no data found" instead of a real app error
  if (res.status === 404) {
    return [];
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch sessions: ${res.status}`);
  }

  return res.json();
}