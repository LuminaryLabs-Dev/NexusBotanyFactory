export const json = (payload, status = 200, headers = {}) => new Response(JSON.stringify(payload), {
  status,
  headers: {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  },
})

export const error = (statusCode, code, message, details = []) => json({
  error: {
    code,
    message,
    details,
  },
}, statusCode)
