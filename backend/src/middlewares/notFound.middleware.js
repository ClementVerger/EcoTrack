module.exports = (req, res) => {
  res.status(404).json({
    error: {
      status: 404,
      message: 'Not Found',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    }
  });
};