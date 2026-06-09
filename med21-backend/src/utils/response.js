export const sendSuccess = (res, data, statusCode = 200, message) => {
  if (typeof message === 'string') {
    return res.status(statusCode).json({ success: true, message, data });
  }
  return res.status(statusCode).json(data);
};

export const sendError = (res, statusCode, message, details) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(details ? { details } : {}),
  });
};
