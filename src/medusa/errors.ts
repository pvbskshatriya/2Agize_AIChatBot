export class MedusaHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: "NOT_FOUND" | "UNAUTHORIZED" | "MEDUSA_ERROR" | "TIMEOUT"
  ) {
    super(message);
    this.name = "MedusaHttpError";
  }
}

export function medusaErrorFromStatus(status: number): MedusaHttpError {
  if (status === 401 || status === 403) {
    return new MedusaHttpError("Unauthorized", status, "UNAUTHORIZED");
  }
  if (status === 404) {
    return new MedusaHttpError("Not found", status, "NOT_FOUND");
  }
  return new MedusaHttpError("Medusa request failed", status, "MEDUSA_ERROR");
}
