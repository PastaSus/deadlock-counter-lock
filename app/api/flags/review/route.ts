import { connection } from "next/server";
import { z } from "zod";

import { reviewFlag } from "../../../../lib/flags";
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

export async function POST(request: Request): Promise<Response> {
  try {
    await connection();

    const authorization = authorizeEditor(request);
    if (authorization === "unconfigured") {
      console.error("Flag review API error: EDITOR_SECRET is not configured");
      return errorResponse(
        "INTERNAL_ERROR",
        "An unexpected error occurred",
        500,
      );
    }

    if (authorization === "unauthorized") {
      return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Request body must be valid JSON", 400);
    }

    const parsed = z
      .object({ id: z.string().min(1) })
      .strict()
      .safeParse(payload);
    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid flag review request",
        400,
      );
    }

    const flag = await reviewFlag(parsed.data.id);
    if (!flag) {
      return errorResponse("NOT_FOUND", "Flag not found or not pending", 404);
    }

    return Response.json(
      {
        ok: true,
        data: { flag },
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

    console.error("Flag review API error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
