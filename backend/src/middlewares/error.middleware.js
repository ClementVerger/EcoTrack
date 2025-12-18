module.exports = (err, res) => {
  const status = err.status || err.statusCode || 500;
  const payload = {
    error: {
      status,
      message: err.message || 'Internal Server Error',
      timestamp: new Date().toISOString()
    }
  };

  if (process.env.NODE_ENV === 'development') {
    payload.error.stack = err.stack;
    if (err.details) payload.error.details = err.details;
  }

  res.status(status).json(payload);
};