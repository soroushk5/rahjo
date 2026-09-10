export class HttpProblem extends Error {
  constructor(status, code, title, detail = title, headers = {}) {
    super(detail);
    this.name = "HttpProblem";
    this.status = status;
    this.code = code;
    this.title = title;
    this.headers = headers;
  }
}

export const problems = Object.freeze({
  unauthorized: () => new HttpProblem(401, "AUTH_REQUIRED", "Authentication required"),
  forbidden: () => new HttpProblem(403, "FORBIDDEN", "Permission denied"),
  notFound: () => new HttpProblem(404, "NOT_FOUND", "Resource not found"),
  conflict: (code = "STATE_CONFLICT", detail = "The requested state transition conflicts with current state") => new HttpProblem(409, code, "Conflict", detail),
  preconditionRequired: () => new HttpProblem(428, "PRECONDITION_REQUIRED", "If-Match is required"),
  staleVersion: () => new HttpProblem(412, "STALE_VERSION", "The resource version is stale"),
  validation: (detail = "The request is invalid") => new HttpProblem(422, "VALIDATION_FAILED", "Validation failed", detail),
  rateLimited: (retryAfter = 60) => new HttpProblem(429, "RATE_LIMITED", "Rate limit exceeded", "Try again later", { "Retry-After": String(retryAfter) }),
  unavailable: (code = "SERVICE_UNAVAILABLE", detail = "A required server service is unavailable") => new HttpProblem(503, code, "Service unavailable", detail, { "Retry-After": "15" })
});

export function toProblem(error, instance, requestId) {
  const source = error instanceof HttpProblem ? error : problems.unavailable();
  return {
    status: source.status,
    headers: source.headers,
    body: {
      type: `https://rahjo.ir/problems/${source.code.toLowerCase().replaceAll("_", "-")}`,
      title: source.title,
      status: source.status,
      detail: source.message,
      instance,
      code: source.code,
      requestId,
      dataMode: "server"
    }
  };
}
