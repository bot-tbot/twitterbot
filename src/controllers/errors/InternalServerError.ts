export class InternalServerError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'InternalServerError';
    this.statusCode = 500;
    this.details = details;
  }
}
