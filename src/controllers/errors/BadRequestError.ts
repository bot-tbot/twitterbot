export class BadRequestError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'BadRequestError';
    this.statusCode = 400;
    this.details = details;
  }
}
