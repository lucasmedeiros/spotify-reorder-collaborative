import { request } from '../api.js'

const contentSection = document.querySelector('#content')

contentSection.innerHTML = '<p>olá :)</p>'

request('GET', '/playlists').then(data => {
  data.playlists.forEach(playlist => {
    const playlistLink = document.createElement('a')
    const linkText = document.createTextNode(playlist.name)
    playlistLink.title = playlist.name
    playlistLink.appendChild(linkText)
    playlistLink.href = '#'
    contentSection.appendChild(playlistLink)

    const breakLine = document.createElement('br')
    contentSection.appendChild(breakLine)
  })
})
