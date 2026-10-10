export function assertProductionTls(): void {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.npm_lifecycle_event === "build") return;
  if (process.env.NODE_ENV === "production" && process.env.FORCE_HTTPS !== "1") {
    throw new Error("TLS-only: set FORCE_HTTPS=1");
  }
}

export function sessionCookieOptions(expires: Date): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  expires: Date;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  };
}
