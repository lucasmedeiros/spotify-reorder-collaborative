import { request } from '../api.js'

const contentSection = document.querySelector('#content')

function reorderPlaylist(playlistName) {
  request('POST', '/reorder', { playlistName }).then((data) => {
    handleReordering(false)
    console.log(data)
  })
}

function handleReordering(reordering) {
  const buttons = document.querySelectorAll('.playlist-container button')
  const loadingOverlay = document.querySelector('.reordering-overlay')

  loadingOverlay.style.display = reordering ? 'flex' : 'none'
  buttons.forEach(button => {
    button.disabled = reordering
  })
}

request('GET', '/playlists').then(data => {
  data.playlists.forEach(playlist => {
    const playlistContainer = document.createElement('div')
    playlistContainer.className = 'playlist-container'

    const playlistName = document.createTextNode(playlist.name)
    playlistContainer.title = playlist.name

    const reorderPlaylistButton = document.createElement('button')
    reorderPlaylistButton.addEventListener('click', () => {
      reorderPlaylist(playlist.name)
      handleReordering(true)
    })

    const buttonText = document.createTextNode('Reordenar playlist')
    const breakLine = document.createElement('br')

    reorderPlaylistButton.appendChild(buttonText)
    playlistContainer.appendChild(playlistName)
    playlistContainer.appendChild(breakLine)
    playlistContainer.appendChild(reorderPlaylistButton)
    contentSection.appendChild(playlistContainer)
  })
})
