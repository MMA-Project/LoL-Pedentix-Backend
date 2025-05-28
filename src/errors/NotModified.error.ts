export default class NotModifiedError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.statusCode = 304;
  }
}
