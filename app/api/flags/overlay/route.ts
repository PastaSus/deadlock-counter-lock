import { connection } from "next/server";

import { getFlaggedSlugs } from "../../../../lib/flags";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET(): Promise<Response> {
  try {
    await connection();

    const flaggedSlugs = await getFlaggedSlugs();
    return Response.json(
      {
        ok: true,
        data: {
          flaggedSlugs,
        },
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith(
        "During prerendering, `connection()` rejects when the prerender is complete",
      )
    ) {
      throw error;
    }

    console.error("Flag overlay API error:", error);
    return Response.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
