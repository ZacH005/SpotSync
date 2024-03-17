// As it is a single page document we detect a callback from Spotify by checking for the hash fragment
//Imports specific functions from an external module.
import { redirectToAuthCodeFlow, getAccessToken } from "./authCodeWithPkce.ts";

//this is the appID
const clientId = "29ef0e92931e4445a605be8b6f3b674e";
var accessToken = "";

//Parses and handles parameters from the URL.
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

//Defines a custom TypeScript type for an array of playlists.
type myPlaylistArray =  {
    list: myPlaylist[];
}

//Defines a custom TypeScript type for a playlist object. (Object-oriented Programming (OOP))
type myPlaylist =  {
    playlistName: string;
    playlistUrl: string;
    playlistID: string;
    playlistImageUrl: string;
    playlistTotal: number;
    tracks: myTracklist[];
}

type myTracklist =  {
    trackName: string;
    trackArtist: string;
    trackUrl: string;
    trackID: string;
    trackPopularity: string;
}

//Initial values for the playlists
var playlistID = "37i9dQZF1DX4xuWVBs4FgJ";
var playlistID2 = "59XMuGvjGqOINdEGGos9NZ";

var userID = "1212178989";

//Checks if a Spotify authorization code exists and redirects if not.
if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    // Fetches the access token asynchronously from the Spotify API.
    accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    const playlists = await fetchPlaylists(accessToken, userID);

    populateUI(profile);
    populatePlaylists(playlists);

    //intializing the list of playlists
    let listofPlaylists: myPlaylistArray = { list: [] }; // Initialize as an empty array

    let playlist = await getPlaylist(accessToken, playlistID);
    listofPlaylists = populateArray(playlist,listofPlaylists);
    
    playlist = await getPlaylist(accessToken, playlistID2);
    listofPlaylists = populateArray(playlist,listofPlaylists);

    populatePlaylist(playlist,listofPlaylists);
}

//Makes an asynchronous HTTP request to the Spotify API to fetch user profile information.
//Uses promises to handle asynchronous operations when fetching user profile information.
async function fetchProfile(code: string): Promise<UserProfile> {
    try{
        const result = await fetch("https://api.spotify.com/v1/me", {
            method: "GET", headers: { Authorization: `Bearer ${code}` }
        });

        return await result.json();
    } catch (error) {
        console.error("Error fetching profile:", error);
        throw error; // Rethrow the error to propagate it to the caller
    }
}

function populateUI(profile: UserProfile) {

    //Updates the inner text of a DOM element with the user's data
    document.getElementById("displayName")!.innerText = profile.display_name;
    document.getElementById("avatar")!.setAttribute("src", profile.images[1].url)
    document.getElementById("id")!.innerText = profile.id;
    document.getElementById("email")!.innerText = profile.email;
    document.getElementById("uri")!.innerText = profile.uri;
    document.getElementById("uri")!.setAttribute("href", profile.external_urls.spotify);
    document.getElementById("url")!.innerText = profile.href;
    document.getElementById("url")!.setAttribute("href", profile.href);
    document.getElementById("imgUrl")!.innerText = profile.images[1].url;
    document.getElementById("country")!.innerText = profile.country;
}

async function fetchMyPlaylists(code: string): Promise<UserPlaylists> {
    const result = await fetch("https://api.spotify.com/v1/me/playlists", {
        method: "GET", headers: { Authorization: `Bearer ${code}` }
    });

    return await result.json();
}

async function fetchPlaylists(code: string, userID: string): Promise<UserPlaylists> {
    try{
        const result = await fetch("https://api.spotify.com/v1/users/"+userID+"/playlists", {
        method: "GET", headers: { Authorization: `Bearer ${code}` }
    });

    return await result.json();
    } catch (error) {
        console.error("Error fetching user playlist:", error);
        throw error;
    }
}

function populatePlaylists(playlists: UserPlaylists) {
    // Clears the given playlists to avoid appending on repetition of the function
    document.getElementById("playlists_names")!.innerHTML = "";

    document.getElementById("playlists_total")!.textContent = playlists.total.toString();
    for(let i in playlists.items){  
        document.getElementById("playlists_names")!.innerHTML += "<tr><td>"+playlists.items[i].name+"</td><td>"+playlists.items[i].id+"</td></tr>";
    }
}

async function getPlaylist(code: string, playlistID: string): Promise<Playlist> {
    try {
        const result = await fetch("https://api.spotify.com/v1/users/theblazingamer/playlists/"+playlistID, {
        method: "GET", headers: { Authorization: `Bearer ${code}` }
    });

    return await result.json();
    } catch (error) {
        console.error("Error fetching playlist with playlist ID:", error);
        throw error; // Rethrow the error to propagate it to the caller
    }
}

function populateArray(playlist: Playlist,listofPlaylists: myPlaylistArray): myPlaylistArray  {
    
    let trackNames: myPlaylistArray = { list: [] }; // Initialize as an empty array

    let myList: myPlaylist = {
        playlistName: playlist.name,
        playlistUrl: playlist.external_urls.spotify,
        playlistID: playlist.id,
        playlistImageUrl: playlist.images[0].url,
        playlistTotal: playlist.tracks.total,
        tracks: [],
    }

    for (let i in playlist.tracks.items) {
        let track: myTracklist =  {
            trackName: playlist.tracks.items[i].track.name,
            trackArtist: playlist.tracks.items[i].track.album.artists[0].name,
            trackUrl: playlist.tracks.items[i].track.external_urls.spotify,
            trackID: playlist.tracks.items[i].track.id,
            trackPopularity: playlist.tracks.items[i].track.popularity,
        }
        myList.tracks.push(track)
    }
    
    listofPlaylists.list.push(myList); // Use push to add the track to the array

    return listofPlaylists;
}
    
function populatePlaylist(playlist: Playlist, trackNames: myPlaylistArray) {

    // Retrieves HTML element "playlist_track_names" and casts it as a table element
    const playlistTrackNames = document.getElementById("playlist_track_names")! as HTMLTableElement;
    const playlistNames = document.getElementById("playlist_names")! as HTMLTableElement;
    

    //Iterates over playlists when populating HTML elements.
    for (let i in trackNames.list) {
        const playlistItem = trackNames.list[i];

        playlistTrackNames.innerHTML += "<table>";

        //Modifies the inner HTML of an element to wrap playlist names in an ordered list.
        playlistNames.innerHTML += "<tr><td>"+playlistItem.playlistTotal.toString()+"</td>"
        +"<td>"+"<a target='spotifytab' href=" + playlistItem.playlistUrl + ">" 
        +playlistItem.playlistName+"</a></td>"
        +"<td><img class='logo' src="+playlistItem.playlistImageUrl+"></td></tr>";
        
        for (let j in playlistItem.tracks) {
            const track = playlistItem.tracks[j];

            playlistTrackNames.innerHTML += "<tr><td>"
                + j.toString() + "</td><td>"
                + "<a target='spotifytab' href=" + track.trackUrl + ">" 
                + track.trackName + "</a></td><td>"
                + track.trackArtist + "</td><td>"
                + track.trackPopularity + "</td></tr>";
        }
        playlistTrackNames.innerHTML += "</table>";

    }
}

const playlistIDElement = document.getElementById('addPlaylist') as HTMLInputElement;
const submitPlaylistButton = document.getElementById('submitPlaylist') as HTMLInputElement;

if (playlistIDElement) {

    playlistID2 = playlistIDElement.value;

    // Visualize in the HTML
    let resultElement = document.getElementById('result');

    if (resultElement) {
        resultElement.textContent = "Playlist ID:" + playlistID2;
    }

    submitPlaylistButton.addEventListener('click', async () => {
        playlistID2 = playlistIDElement.value;

        // Fetch the updated playlist asynchronously
        try {
            const playlist = await getPlaylist(accessToken, playlistID2);
            const listofPlaylists: myPlaylistArray = { list: [] };
            const updatedList = populateArray(playlist, listofPlaylists);

            // Update UI or perform any other actions here
            populatePlaylist(playlist, updatedList);
        } catch (error) {
            console.error("Error fetching playlist:", error);
            // Handle error appropriately
        }
    });
} else {
    // Handle the case when the element is not found
    playlistID2 = "59XMuGvjGqOINdEGGos9NZ";
}

const userIDElement = document.getElementById('addUser') as HTMLInputElement;
const submitUserButton = document.getElementById('submitUser') as HTMLInputElement;

if (userIDElement) {
    // Declare accessToken based on your use case
    //const accessToken = await getAccessToken(clientId, code);

    userID = userIDElement.value;

    submitUserButton.addEventListener('click', async () => {
        userID = userIDElement.value;

        // Fetch the updated playlist asynchronously
        try {
            //Populate user elements here
            const playlists = await fetchPlaylists(accessToken, userID);

            populatePlaylists(playlists);
        } catch (error) {
            console.error("Error fetching userID:", error);
            // Handle error appropriately
        }
    });
} else {
    // Handle the case when the element is not found
    userID = "theblazingamer";
}