export function roomUrlForToken(token: string): string {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("room token is not a 32-byte hex value");
  const base = (process.env.VIDEO_ROOM_BASE_URL ?? "https://meet.jit.si").replace(/\/$/, "");
  return `${base}/cp-${token}`;
}
