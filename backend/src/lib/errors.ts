export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "NOT FOUND") {
    super(404, message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "BAD REQUEST", details?: unknown) {
    super(400, message, details);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "UNAUTHORIZED ERROR") {
    super(401, message);
  }
}

export class ForbidenError extends HttpError {
  constructor(message = "FORBIDEN") {
    super(403, message);
  }
}
