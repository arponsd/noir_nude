import pino, { type Logger, type LoggerOptions } from "pino";

const isProd = process.env.NODE_ENV === "production";

const redactPaths = [
  "password",
  "passwordHash",
  "email",
  "phone",
  "token",
  "*.password",
  "*.email",
  "req.headers.authorization",
  "req.headers.cookie",
];

const baseOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  redact: {
    paths: redactPaths,
    censor: "[redacted]",
  },
  base: { service: "glowcart" },
  timestamp: pino.stdTimeFunctions.isoTime,
};

const devOptions: LoggerOptions = {
  ...baseOptions,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname,service",
      singleLine: false,
    },
  },
};

const logger: Logger = pino(isProd ? baseOptions : devOptions);

export function child(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}

export default logger;
