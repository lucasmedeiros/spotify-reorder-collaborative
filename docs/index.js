import { request } from './api.js'

const logInButton = document.querySelector('#spotify-login')

request('GET').then(data => {
  logInButton.href = data.url
})
