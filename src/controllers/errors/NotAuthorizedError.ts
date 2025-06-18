export class NotAuthorizedError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'NotAuthorizedError';
    this.statusCode = 401;
    this.details = details;
  }
}
