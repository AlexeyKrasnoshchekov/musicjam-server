const express = require("express");
require("dotenv").config();
var SpotifyWebApi = require("spotify-web-api-node");
const cors = require("cors");
const bodyParser = require("body-parser");

const ORIGIN = process.env.ORIGIN;

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.REACT_APP_SPOTIFY,
  clientSecret: process.env.REACT_APP_SPOTIFY_SECRET,
  redirectUri: `${ORIGIN}/callback`,
});

const app = express();
app.use(bodyParser.json());
const port = process.env.PORT || 8000;

let access_token;


const corsOptions = {
  origin: ORIGIN,
};

app.use(cors(corsOptions));

const scopes = [
  "ugc-image-upload",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "streaming",
  "app-remote-control",
  "user-read-email",
  "user-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-read-private",
  "playlist-modify-private",
  "user-library-modify",
  "user-library-read",
  "user-top-read",
  "user-read-playback-position",
  "user-read-recently-played",
  "user-follow-read",
  "user-follow-modify",
];

//AUTH
app.get("/login", cors(corsOptions), (req, res) => {
  const url = spotifyApi.createAuthorizeURL(scopes);
  if (url) {
    res.json(url);
  } else {
    res.status(404).send();
  }
});

app.get("/callback", cors(corsOptions), async (req, res) => {
  const error = req.query.error;
  const code = req.query.code;

  if (error) {
    res.send(`Callback Error: ${error}`);
    return;
  }

  await spotifyApi
    .authorizationCodeGrant(code)
    .then((data) => {
      access_token = data.body["access_token"];
      const refresh_token = data.body["refresh_token"];
      const expires_in = data.body["expires_in"];

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      console.log(
        `Sucessfully retreived access token. Expires in ${expires_in} s.`
      );
      // res.status(200).send("success");
      if (access_token) {
        res.json(access_token);
      } else {
        res.status(404).send();
      }

      setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        const access_token = data.body["access_token"];

        console.log("The access token has been refreshed!");
        console.log("access_token:", access_token);
        spotifyApi.setAccessToken(access_token);
      }, (expires_in / 2) * 1000);
    })
    .catch((error) => {
      console.error("Error getting Tokens:", error);
      res.send(`Error getting Tokens: ${error}`);
    });
});

//PLAYLISTS

app.get("/playlists", cors(corsOptions), async (req, res) => {
  const playlists = await spotifyApi.getUserPlaylists();

  if (playlists) {
    res.json(playlists.body.items);
  } else {
    res.status(404).send();
  }
});
app.get("/playlist/:id", cors(corsOptions), async (req, res) => {
  const playlist_id = req.params.id;
  const playlist = await spotifyApi.getPlaylist(playlist_id);
  // const json = await playlists.json();

  if (playlist) {
    res.json(playlist.body);
  } else {
    res.status(404).send();
  }
});

app.post("/playlists", cors(corsOptions), async (req, res) => {
  // var playlistName = req.body.playlistName;

  const user = await spotifyApi.getMe();

  try {
    let newPlaylist = await spotifyApi.createPlaylist(user.id, {
      name: req.body.name,
    });

    newPlaylist &&
      spotifyApi.addTracksToPlaylist(newPlaylist.body.id, [
        "spotify:track:2bfGNzdiRa1jXZRdfssSzR",
      ]);
  } catch (error) {
    console.log(error);
  }
});
app.post("/playlist", cors(corsOptions), async (req, res) => {
  // var playlistName = req.body.playlistName;
  
  const playlistId = req.body.playlistId;
  const trackUri = req.body.uri;

  

  try {
    trackUri && spotifyApi.addTracksToPlaylist(playlistId, [trackUri]);
  } catch (error) {
    console.log(error);
  }
});

app.delete("/playlist", cors(corsOptions), async (req, res) => {
  const playlistId = req.body.playlistId;
  const trackUri = req.body.uri;

  console.log('req.body', req.body);

  try {
    trackUri && spotifyApi.removeTracksFromPlaylist(playlistId, [trackUri]);
  } catch (error) {
    console.log(error);
  }
});

//ALBUMS
app.get("/albums", cors(corsOptions), async (req, res) => {
  const albums = await spotifyApi.getMySavedAlbums();
  if (albums) {
    res.json(albums.body.items);
  } else {
    res.status(404).send();
  }
});
app.get("/album/:id", cors(corsOptions), async (req, res) => {
  const album_id = req.params.id;
  const album = await spotifyApi.getAlbum(album_id);

  if (album) {
    res.json(album.body);
  } else {
    res.status(404).send();
  }
});
app.post("/albums", cors(corsOptions), async (req, res) => {
  try {
    await spotifyApi.addToMySavedAlbums([req.body.albumId]);
  } catch (error) {
    console.log(error);
  }
});
app.delete("/album/:id", cors(corsOptions), async (req, res) => {
  const album_id = req.params.id;

  try {
    await spotifyApi.removeFromMySavedAlbums([album_id]);
  } catch (error) {
    console.log(error);
  }
});

//SAVED_TRACKS
app.get("/tracks", cors(corsOptions), async (req, res) => {
  const savedTracks = await spotifyApi.getMySavedTracks();
  if (savedTracks) {
    res.json(savedTracks.body.items);
  } else {
    res.status(404).send();
  }
});
app.post("/track", cors(corsOptions), async (req, res) => {
  try {
    await spotifyApi.addToMySavedTracks([req.body.trackId]);
  } catch (error) {
    console.log(error);
  }
});
app.delete("/track/:id", cors(corsOptions), async (req, res) => {
  const track_id = req.params.id;

  try {
    await spotifyApi.removeFromMySavedTracks([track_id]);
  } catch (error) {
    console.log(error);
  }
});
//USER
app.get("/user", cors(corsOptions), async (req, res) => {
  const user = await spotifyApi.getMe();
  if (user) {
    res.json(user.body);
  } else {
    res.status(404).send();
  }
});

//SEARCH
app.get("/search/:term", cors(corsOptions), async (req, res) => {
  const search_term = req.params.term;
  const types = ["artist", "album", "track"];

  const searchResult = await spotifyApi.search(search_term, types, {
    limit: 5,
  });
  if (searchResult) {
    res.json(searchResult.body);
  } else {
    res.status(404).send();
  }
});

//ARTIST
app.get("/artist/:id", cors(corsOptions), async (req, res) => {
  const artist_id = req.params.id;

  const artist = await spotifyApi.getArtist(artist_id);
  let artistAlbums = await spotifyApi.getArtistAlbums(artist_id, { limit: 10 });
  let relatedArtists = await spotifyApi.getArtistRelatedArtists(artist_id);

  let jsonObj = {
    artist: artist.body,
    artistAlbums: artistAlbums.body.items,
    relatedArtists: relatedArtists.body.artists,
  };
  if (jsonObj) {
    res.json(jsonObj);
  } else {
    res.status(404).send();
  }
});

app.listen(port, () =>
  console.log(
    "HTTP Server up. Now go to http://localhost:8888/login in your browser."
  )
);
