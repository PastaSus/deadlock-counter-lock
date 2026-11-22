import { createHash, timingSafeEqual } from "node:crypto";

export type EditorAuthorization =
  | "authorized"
  | "unauthorized"
  | "unconfigured";

type EditorEnv = Record<string, string | undefined>;

export function readEditorSecret(
  env: EditorEnv = process.env,
): string | null {
  const secret = env.EDITOR_SECRET?.trim();
  return secret && secret.length > 0 ? secret : null;
}

export function extractBearerSecret(
  headerValue: string | null,
): string | null {
  if (!headerValue) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(headerValue.trim());
  if (!match) {
    return null;
  }

  const secret = match[1].trim();
  return secret.length > 0 ? secret : null;
}

function digestSecret(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest();
}

export function secretsMatch(supplied: string, expected: string): boolean {
  return timingSafeEqual(digestSecret(supplied), digestSecret(expected));
}

export function authorizeEditor(
  request: Request,
  env: EditorEnv = process.env,
): EditorAuthorization {
  const expected = readEditorSecret(env);
  if (expected === null) {
    return "unconfigured";
  }

  const supplied = extractBearerSecret(request.headers.get("authorization"));
  if (supplied === null) {
    return "unauthorized";
  }

  return secretsMatch(supplied, expected) ? "authorized" : "unauthorized";
}
