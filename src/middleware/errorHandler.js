const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // 기본 에러 응답
  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal server error'

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export default errorHandler

