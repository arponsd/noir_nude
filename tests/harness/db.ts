import mongoose from "mongoose";

type ConnectModule = {
  connect?: () => Promise<unknown>;
  disconnect?: () => Promise<unknown>;
  default?: () => Promise<unknown>;
};

async function loadConnectModule(): Promise<ConnectModule> {
  try {
    // reason: src/lib/db/connect.ts is owned by the database agent and may land later (T-1.D01)
    return (await import("@/lib/db/connect")) as ConnectModule;
  } catch (err) {
    throw new Error(
      "tests/harness/db.ts could not import @/lib/db/connect. " +
        "Ensure the database agent has merged T-1.D01 before running integration tests. " +
        `Underlying error: ${(err as Error).message}`,
    );
  }
}

export async function connectTestDb(): Promise<void> {
  const mod = await loadConnectModule();
  const connect = mod.connect ?? mod.default;
  if (typeof connect !== "function") {
    throw new Error("tests/harness/db.ts: @/lib/db/connect did not export a `connect` function.");
  }
  await connect();
}

export async function disconnectTestDb(): Promise<void> {
  try {
    const mod = await loadConnectModule();
    if (typeof mod.disconnect === "function") {
      await mod.disconnect();
      return;
    }
  } catch {
    // fall through to direct mongoose disconnect
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export async function clearDb(): Promise<void> {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return;
  }
  await mongoose.connection.db.dropDatabase();
}
