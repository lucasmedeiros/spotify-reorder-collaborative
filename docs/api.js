import { getFromLocalStorage } from './storage.js'

const API_URL = 'http://localhost:5000'

function generateHeaders() {
  const data = getFromLocalStorage('data')

  const token = data?.token

  return {
    Authorization: token ? `Bearer ${token}` : undefined,
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  }
}

export async function request(method, path = '/', body) {
  const url = `${API_URL}${path}`

  const headers = generateHeaders()

  const formBody = []

  if (body) {
    for (var property in body) {
      const encodedKey = encodeURIComponent(property)
      const encodedValue = encodeURIComponent(body[property])
      formBody.push(`${encodedKey}=${encodedValue}`)
    }
  }

  const response = await fetch(url, {
    method,
    body: method !== 'GET' ? formBody.join("&") : undefined,
    headers
  })

  return response.json()
}
