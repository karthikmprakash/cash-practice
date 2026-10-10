import { Buffer } from "node:buffer";

process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
process.env.SESSION_SECRET = "test-session-secret-not-for-production-use";
process.env.RATE_LIMIT_DISABLED = "1";
