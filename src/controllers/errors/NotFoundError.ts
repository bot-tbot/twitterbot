export class NotFoundError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.details = details;
  }
}
