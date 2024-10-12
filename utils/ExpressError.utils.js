class ExpressError extends Error {
  constructor(message, statusCode) {
    super();
    this.message = message;
    this.status = statusCode;
    this.statusCode = statusCode;
  }
}

export default ExpressError;
