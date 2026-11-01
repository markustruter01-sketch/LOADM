import pino from "pino";
import { env, isProd } from "../config";

export const logger = pino({
  level: env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },
      }),
  redact: ["req.headers.cookie", "req.headers.authorization"],
});

export type Logger = typeof logger;
