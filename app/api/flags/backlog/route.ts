import { connection } from "next/server";

import { getPendingFlags } from "../../../../lib/flags";
import { authorizeEditor } from "../../../../lib/flags/editor-auth";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

function errorResponse(
  code: string,
  message: string,
  status: number,
): Response {
  return Response.json(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    { status, headers: NO_STORE_HEADERS },
  );
}

export async function GET(request: Request): Promise<Response> {
  try {
    await connection();

    const authorization = authorizeEditor(request);
    if (authorization === "unconfigured") {
      console.error("Flag backlog API error: EDITOR_SECRET is not configured");
      return errorResponse(
        "INTERNAL_ERROR",
        "An unexpected error occurred",
        500,
      );
    }

    if (authorization === "unauthorized") {
      return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
    }

    const flags = await getPendingFlags();
    return Response.json(
      {
        ok: true,
        data: {
          flags,
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

    console.error("Flag backlog API error:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred",
      500,
    );
  }
}
