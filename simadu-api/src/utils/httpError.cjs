class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

module.exports = {
  HttpError,
  badRequest: (msg, details) => new HttpError(400, 'BAD_REQUEST', msg, details),
  unauthorized: (msg) => new HttpError(401, 'UNAUTHORIZED', msg),
  forbidden: (msg) => new HttpError(403, 'FORBIDDEN', msg),
  notFound: (msg) => new HttpError(404, 'NOT_FOUND', msg),
};
