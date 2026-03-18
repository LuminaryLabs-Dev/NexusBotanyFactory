import { NextResponse } from 'next/server'

export const json = (payload, status = 200) => NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store' } })

export const error = (statusCode, code, message, details = []) => json({
  error: {
    code,
    message,
    details,
  },
}, statusCode)
