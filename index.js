require('dotenv').config()
const axios = require('axios').default
const bodyParser = require('body-parser')
const express = require('express')
const cors = require('cors')
const querystring = require('query-string')

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = 'http://localhost:5000/auth/callback'
const SPOTIFY_ACCOUNT_API_PREFIX = 'https://accounts.spotify.com'
const SPOTIFY_API_PREFIX = 'https://api.spotify.com/v1'

let data = {
  access_token: null,
  token_type: 'Bearer',
  expires_in: 0,
  refresh_token: null,
  scope: null
}

const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))

function generateAuthHeaders() {
  const base64ClientSecrets = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  return {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${base64ClientSecrets}`,
  }
}

function generateHeaders() {
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
  const query = querystring.stringify(queryObject, { arrayFormat: 'comma' });
  res.status(200).json({
    url: `${SPOTIFY_ACCOUNT_API_PREFIX}/authorize?${query}`
  })
})

/**
 * Callback route for getting get the token.
 */
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query
  const body = {
    code,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  }
  try {
    const response = await axios.post(`${SPOTIFY_ACCOUNT_API_PREFIX}/api/token`,
      querystring.stringify(body),
      {
        headers: generateAuthHeaders(),
      })
    data = response.data
    res.status(200).json({ ok: true, message: "Now you can use the /reorder route" })
  } catch (error) {
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
        headers: generateAuthHeaders(),
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
async function getUserColaborativePlaylists() {
  const response = await axios.get(`${SPOTIFY_API_PREFIX}/me/playlists?limit=50`, {
    headers: generateHeaders()
  })

  return response.data.items.filter(playlist => playlist.collaborative)
}

/**
 * Get one playlist's details, given its id.
 * 
 * @param {string} playlistId the playlist id.
 * @returns {object} the playlist details.
 */
async function getPlaylistDetails(playlistId) {
  const response = await axios.get(`${SPOTIFY_API_PREFIX}/playlists/${playlistId}`, {
    headers: generateHeaders()
  })

  return {
    id: response.data.id,
    snapshotId: response.data.snapshot_id,
    name: response.data.name,
    tracks: response.data.tracks.items.map((track, index) => ({
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
    const userTracks = cumulativeTracks[track.user]
    return {
      ...cumulativeTracks,
      [track.user]: userTracks
        ? [...userTracks, track]
        : [track]
    }
  }, {})
}

async function reorderColaborativePlaylist(playlistDetails, tracksGroupedByUser) {
  // TODO: reorder
}

/**
 * Reorder a collaborative playlist alternately by its contributors.
 */
app.post('/reorder', async (req, res) => {
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
    const collaborativePlaylists = await getUserColaborativePlaylists()

    const playlist = collaborativePlaylists.find(
      playlist => playlist.name.toUpperCase() === playlistName.toUpperCase()
    )

    const playlistsDetails = await getPlaylistDetails(playlist.id)
    const tracksGroupedByUser = getPlaylistTracksGroupedByUser(playlistsDetails)
    console.log(tracksGroupedByUser)
    // await reorderColaborativePlaylist(playlistsDetails, tracksGroupedByUser)

    res.status(200).json({
      ok: true,
      playlistsDetails,
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
})

app.listen(5000, () => {
  console.log(`Server listening on port 5000`)
})
