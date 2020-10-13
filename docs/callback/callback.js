import { saveInLocalStorage } from '../storage.js'
import { request } from '../api.js'

const urlParams = new URLSearchParams(window.location.search)
const code = urlParams.get('code')

if (code) {
  request('POST', '/auth/callback', { code }).then(response => {
    const { data } = response
    saveInLocalStorage('data', data)
    location.href = "https://lucasmedeiros.github.io/spotify-reorder-collaborative/docs/reorder"
  })
}
