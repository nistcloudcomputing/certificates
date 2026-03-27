import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import * as nodeUtil from "node:util";

const ADMIN_TOKEN_COOKIE = "admin_token";

type AdminTokenPayload = JWTPayload & {
  email: string;
  role: "admin";
};

type PreviewTokenPayload = JWTPayload & {
  email: string;
  name: string;
  fileKey: string;
};

let envFileFallbackCache: Record<string, string> | null = null;

function parseEnvFile(contents: string): Record<string, string> {
  const parseEnv = (nodeUtil as unknown as { parseEnv?: (source: string) => Record<string, string> }).parseEnv;

  if (typeof parseEnv === "function") {
    return parseEnv(contents);
  }

  const parsed: Record<string, string> = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim().replace(/^export\s+/, "");
    let value = trimmedLine.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith("`") && value.endsWith("`"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

function loadEnvFallbacksFromFiles() {
  if (envFileFallbackCache) {
    return envFileFallbackCache;
  }

  const mode = process.env.NODE_ENV === "test" ? "test" : process.env.NODE_ENV === "development" ? "development" : "production";
  const envFiles = [`.env.${mode}.local`, mode !== "test" ? ".env.local" : null, `.env.${mode}`, ".env"].filter(
    (file): file is string => Boolean(file),
  );
  const merged: Record<string, string> = {};

  for (const fileName of envFiles) {
    try {
      const filePath = path.join(process.cwd(), fileName);

      if (!fs.existsSync(filePath)) {
        continue;
      }

      const contents = fs.readFileSync(filePath, "utf8");
      const parsed = parseEnvFile(contents);

      for (const [key, value] of Object.entries(parsed)) {
        if (merged[key] === undefined) {
          merged[key] = value;
        }
      }
    } catch {
      // Ignore unreadable env files and keep trying the remaining fallbacks.
    }
  }

  envFileFallbackCache = merged;
  return merged;
}

function getRequiredEnvValue(name: string) {
  const runtimeValue = process.env[name];

  if (typeof runtimeValue === "string" && runtimeValue.trim()) {
    return runtimeValue;
  }

  const fallbackValue = loadEnvFallbacksFromFiles()[name];

  if (typeof fallbackValue === "string" && fallbackValue.trim()) {
    return fallbackValue;
  }

  return undefined;
}

function getJwtSecret() {
  const secret = getRequiredEnvValue("JWT_SECRET");

  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }

  return new TextEncoder().encode(secret);
}

export function getAdminCookieName() {
  return ADMIN_TOKEN_COOKIE;
}

export async function signAdminToken(email: string) {
  const secret = getJwtSecret();

  return new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifyAdminToken(token: string) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);

  if (payload.role !== "admin" || typeof payload.email !== "string") {
    throw new Error("Invalid admin token payload");
  }

  return payload as AdminTokenPayload;
}

export async function signPreviewToken(payload: { email: string; name: string; fileKey: string }) {
  const secret = getJwtSecret();

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret);
}

export async function verifyPreviewToken(token: string) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);

  if (
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    typeof payload.fileKey !== "string"
  ) {
    throw new Error("Invalid preview token payload");
  }

  return payload as PreviewTokenPayload;
}

export function isValidAdminCredentials(email: string, password: string) {
  const adminEmail = getRequiredEnvValue("ADMIN_EMAIL");
  const adminPassword = getRequiredEnvValue("ADMIN_PASSWORD");

  if (!adminEmail || !adminPassword) {
    throw new Error("Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables");
  }

  return email.trim().toLowerCase() === adminEmail.trim().toLowerCase() && password === adminPassword;
}

export async function requireAdminFromRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}
