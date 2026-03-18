export const readJsonBody = async (request) => {
  try {
    const text = await request.text()
    if (!text.trim()) return {}
    return JSON.parse(text)
  } catch {
    const error = new Error('Malformed JSON request body.')
    error.statusCode = 400
    throw error
  }
}
