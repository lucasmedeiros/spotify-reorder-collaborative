require('dotenv').config()
const axios = require('axios').default
const bodyParser = require('body-parser')
const express = require('express')
const cors = require('cors')
const querystring = require('query-string')

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const PORT = process.env.PORT || 5000
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:5500/docs/callback/index.html`
const SPOTIFY_ACCOUNT_API_PREFIX = 'https://accounts.spotify.com'
const SPOTIFY_API_PREFIX = 'https://api.spotify.com/v1'

const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))

function getAuthHeaders() {
  const base64ClientSecrets = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  return {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${base64ClientSecrets}`,
  }
}

function getHeaders(data) {
  return {
    Authorization: `Bearer ${data.access_token}`
  }
}

/**
 * Returns the request authorization link.
 */
app.get('/', async (_req, res) => {
  const queryObject = {
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: ['playlist-read-collaborative', 'playlist-modify-public', 'playlist-modify-private'],
    redirect_uri: REDIRECT_URI,
  }
  const query = querystring.stringify(queryObject, { arrayFormat: 'comma' })
  res.status(200).json({
    url: `${SPOTIFY_ACCOUNT_API_PREFIX}/authorize?${query}`
  })
})

/**
 * Callback route for getting get the token.
 */
app.post('/auth/callback', async (req, res) => {
  const { code } = req.body
  const body = {
    code,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  }
  try {
    console.log("chegou")
    console.log(req.body)
    const response = await axios.post(`${SPOTIFY_ACCOUNT_API_PREFIX}/api/token`,
      querystring.stringify(body),
      {
        headers: getAuthHeaders(),
      })
    const { data } = response
    res.status(200).json({ ok: true, data })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      error
    })
  }
})

/**
 * Refresh user token when it becomes invalid.
 */
app.post('/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body
  if (!refresh_token) {
    return res.status(500).json({
      error: 'refresh token required.'
    })
  }
  const body = {
    refresh_token,
    redirect_uri: REDIRECT_URI,
    grant_type: 'refresh_token',
  }
  try {
    const response = await axios.post(`${SPOTIFY_ACCOUNT_API_PREFIX}/api/token`,
      querystring.stringify(body),
      {
        headers: getAuthHeaders(),
      })
    data = response.data
    res.status(200).json({ ok: true })
  } catch (error) {
    res.status(500).json({
      error
    })
  }
})

/**
 * Get all colaborative playlists of an user.
 * 
 * @returns {object} all user's colaborative playlists.
 */
async function getUserCollaborativePlaylists(data) {
  const response = await axios.get(`${SPOTIFY_API_PREFIX}/me/playlists?limit=50`, {
    headers: getHeaders(data)
  })

  return response.data.items.filter(playlist => playlist.collaborative)
}

/**
 * Get one playlist's details, given its id.
 * 
 * @param {string} playlistId the playlist id.
 * @returns {object} the playlist details.
 */
async function getPlaylistDetails(playlistId, data) {
  const { data: responseData } = await axios.get(`${SPOTIFY_API_PREFIX}/playlists/${playlistId}`, {
    headers: getHeaders(data)
  })

  return {
    id: responseData.id,
    snapshotId: responseData.snapshot_id,
    name: responseData.name,
    tracks: responseData.tracks.items.map((track, index) => ({
      user: track.added_by.id,
      index,
      details: {
        id: track.track.id,
        name: track.track.name,
        uri: track.track.uri,
      }
    }))
  }
}

/**
 * Get the tracks grouped by user.
 * 
 * @param {object} playlistDetails the playlist details.
 * @returns {object} an object where the keys are the users ids and the values are the tracks added by one user.
 */
function getPlaylistTracksGroupedByUser(playlistDetails) {
  return playlistDetails.tracks.reduce((cumulativeTracks, track) => {
    const userTracks = cumulativeTracks[track.user] || []
    return {
      ...cumulativeTracks,
      [track.user]: [...userTracks, track]
    }
  }, {})
}

async function reorderColaborativePlaylist(playlistId, numberOfTracks, tracksGroupedByUser, data) {
  const users = Object.keys(tracksGroupedByUser)
  const headers = getHeaders(data)
  for (let i = 0; i < (numberOfTracks / users.length); i++) {
    for (let user of users) {
      const userTracks = tracksGroupedByUser[user]
      const [track] = userTracks
      if (track) {
        console.log(i, user, track.details.name)
        const playlistDetails = await getPlaylistDetails(playlistId)
        const { tracks } = playlistDetails
        const findTrack = tracks.find(tr => tr.details.id === track.details.id)
        const trackIndex = tracks.indexOf(findTrack)
        const url = `${SPOTIFY_API_PREFIX}/playlists/${playlistId}/tracks`
        await axios.put(url, {
          range_start: trackIndex,
          range_length: 1,
          insert_before: numberOfTracks,
        }, { headers }).catch((error) => {
          if (error.response) {
            console.log(error.response.data)
          }
        })
        tracksGroupedByUser[user] = userTracks.slice(1, userTracks.length)
      }
    }
  }
}

/**
 * Reorder a collaborative playlist alternately by its contributors.
 */
app.post('/reorder', async (req, res) => {
  const { authorization } = req.headers
  if (!authorization) {
    return res.status(403).json({ error: 'No credentials sent' });
  }

  console.log(authorization)
  const [access_token] = authorization.split(' ')
  const data = { access_token }

  const { playlistName } = req.body
  if (!data.access_token) {
    return res.status(401).json({
      error: 'you need to authorize first: request `GET /` will provide you a link for authentication'
    })
  }
  if (!playlistName) {
    return res.status(400).json({
      error: 'playlistName is required on request body'
    })
  }
  try {
    const collaborativePlaylists = await getUserCollaborativePlaylists(data)

    const playlist = collaborativePlaylists.find(
      playlist => playlist.name.toUpperCase() === playlistName.toUpperCase()
    )

    const playlistDetails = await getPlaylistDetails(playlist.id, data)
    const tracksGroupedByUser = getPlaylistTracksGroupedByUser(playlistDetails)
    await reorderColaborativePlaylist(playlistDetails.id, playlistDetails.tracks.length, tracksGroupedByUser, data)
    console.log("Reorder finished!")

    res.status(200).json({
      ok: true,
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
