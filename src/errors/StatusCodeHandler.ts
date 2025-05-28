interface CustomError extends Error {
  statusCode?: number;
}

export const statusCodeHandler = (error: CustomError): number => {
  if (error.statusCode) {
    return error.statusCode;
  }
  return 500;
};
