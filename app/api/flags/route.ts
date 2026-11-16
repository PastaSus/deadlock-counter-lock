import { hashVisitor, submitFlag } from "../../../lib/flags";
import { flagSubmissionSchema } from "../../../lib/flags/schema";

function validationError(message: string): Response {
  return Response.json(
    {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message,
      },
    },
    { status: 400 },
  );
}

function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    const candidate = first?.trim();
    if (candidate) {
      return candidate;
    }
  }

  const realIp = headers.get("x-real-ip");
  if (realIp?.trim()) {
    return realIp.trim();
  }

  return "unknown";
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return validationError("Request body must be valid JSON");
  }

  const parsed = flagSubmissionSchema.safeParse(payload);
  if (!parsed.success) {
    return validationError(
      parsed.error.issues[0]?.message ?? "Invalid flag submission",
    );
  }

  try {
    const visitorHash = hashVisitor(
      getClientIp(request.headers),
      request.headers.get("user-agent") ?? "",
    );
    const result = await submitFlag(parsed.data, visitorHash);

    if (result.status === "rate-limited") {
      return Response.json(
        {
          ok: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests, try again shortly",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(result.retryAfterSeconds),
          },
        },
      );
    }

    if (result.status === "duplicate") {
      return Response.json(
        {
          ok: false,
          data: {
            flag: result.flag,
          },
          error: {
            code: "DUPLICATE",
            message: "This flag was already submitted recently",
          },
        },
        { status: 409 },
      );
    }

    return Response.json(
      {
        ok: true,
        data: {
          flag: result.flag,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Flag API error:", error);
    return Response.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 },
    );
  }
}
