import { SpotifyApi } from "@spotify/web-api-ts-sdk";

const prompt = require("prompt-sync")();

var artist = prompt("who do you want to find?")

console.log("Searching Spotify for " + artist + "...");

const api = SpotifyApi.withClientCredentials(
    "29ef0e92931e4445a605be8b6f3b674e",
    "e556a938fea34228a5188266ae3dc456"
);

const items = await api.search(artist, ["artist"]);

console.table(items.artists.items.map((item) => ({
    name: item.name,
    followers: item.followers.total,
    popularity: item.popularity,
})));
