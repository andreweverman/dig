# Dig: Spotify Playlist Generation

## Currently hosted at [http://garbagewhistle.com](http://garbagewhistle.com)

## This website allows users to access the following functionality:
* Dig: Continuously adds saved tracks within the last week to a playlist. Will automatically remove songs older than a week, as long as there are 20 songs in the playlist.
* Dug: Saves all liked tracks to a playlist, as this is how I used to do things on my own on Spotify.
* Catalog: Saves all discover weekly songs to a playlist.
* Album Save Tracks: A toggleable option to like every individual track if you save an album. Spotify used to do this by default.

### Known Issues and Improvement plans:

* I did not use the Spotify API 100% correctly, so if you have saved more than 20 songs in 5 minutes not all songs will be added to dig/dug. 
* Need to add some sort of testing
* Configurable settings for the playlist (save duration, min playlist length, etc.)

### Plans for improvement are currently halted as I am working on [vvn1](https://github.com/andreweverman/vvn1-ts)