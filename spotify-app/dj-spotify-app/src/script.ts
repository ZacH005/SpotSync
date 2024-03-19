// As it is a single page document we detect a callback from Spotify by checking for the hash fragment
//Imports specific functions from an external module.
import { redirectToAuthCodeFlow, getAccessToken } from "./authCodeWithPkce.ts";
import { createGrid, GridOptions, ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";

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
    trackDanceability: number;
    trackEnergy: number;
    trackInstrumentalness: number;
    trackTempo: number;
    trackValence: number;
}

let listofPlaylists: myPlaylistArray = { list: [] }; // Initialize as an empty array

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
    //let listofPlaylists: myPlaylistArray = { list: [] }; // Initialize as an empty array

    let playlist = await getPlaylist(accessToken, playlistID);
    listofPlaylists = populateArray(playlist,listofPlaylists);
    
    playlist = await getPlaylist(accessToken, playlistID2);
    listofPlaylists = populateArray(playlist,listofPlaylists);

    // populatePlaylist(playlist,listofPlaylists);
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
    var trackIDs = "";

    for (let i in playlist.tracks.items) {
        trackIDs += playlist.tracks.items[i].track.id + ",";
    }
    
    // listofPlaylists.list.push(myList); // Use push to add the track to the array
    fetchTrackInfo(accessToken, trackIDs, playlist, listofPlaylists);

    return listofPlaylists;
}
async function fetchTrackInfo(code: string, trackIds: string, playlist: Playlist, listofPlaylists: myPlaylistArray): Promise<any> {
    try {
        const result = await fetch("https://api.spotify.com/v1/audio-features?ids=" + trackIds, {
            method: "GET", headers: { Authorization: `Bearer ${code}` }
        });

        const data = await result.json();
        
        let myList: myPlaylist = {
            playlistName: playlist.name,
            playlistUrl: playlist.external_urls.spotify,
            playlistID: playlist.id,
            playlistImageUrl: playlist.images[0].url,
            playlistTotal: playlist.tracks.total,
            tracks: [],
        }

        // As the additional attributs are returned in the same order, the same array index can be used
        console.error("Playlist has provided data:")
        for (let i = 0; i in playlist.tracks.items; i++) {
            const trackData = data.audio_features[i];
            if (trackData) {
                console.error("Track Attributes are given:", i, trackData.energy, trackData.instrumentalness, trackData.tempo, trackData.valence);
                let track: myTracklist =  {
                    trackName: playlist.tracks.items[i].track.name,
                    trackArtist: playlist.tracks.items[i].track.album.artists[0].name,
                    trackUrl: playlist.tracks.items[i].track.external_urls.spotify,
                    trackID: playlist.tracks.items[i].track.id,
                    trackPopularity: playlist.tracks.items[i].track.popularity,
                    trackDanceability: trackData.danceability, 
                    trackEnergy: trackData.energy,
                    trackInstrumentalness: trackData.instrumentalness,
                    trackTempo: trackData.tempo,
                    trackValence: trackData.valence,
                }
                myList.tracks.push(track)
            }
        }

        listofPlaylists.list.push(myList);
        
        // After fetching the playlists and populating the array, create a new instance of PlaylistGrid for each playlist
        for (let playlist of listofPlaylists.list) {
            console.log("Creating grid for playlist:", playlist.playlistID);
            new PlaylistGrid(playlist);
        }
        return data;
    } catch (error) {
        console.error("Error fetching tracks info:", error);
        throw error;
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
            // populatePlaylist(playlist, updatedList);
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

ModuleRegistry.register(ClientSideRowModelModule);

class PlaylistGrid {
    private gridOptions: GridOptions = <GridOptions>{};
    private playlist: myPlaylist;

    constructor(playlist: myPlaylist) {
        this.playlist = playlist;

        this.gridOptions = {
            columnDefs: this.createColumnDefs(),
            rowData: this.createRowData()
        };
        

        let eGridDiv: HTMLElement = <HTMLElement>document.querySelector('#playlistGrid_' + playlist.playlistID);
        let api = createGrid(eGridDiv, this.gridOptions);
        console.log("Container element:", eGridDiv); // Log the container element

        if (!eGridDiv) {
            console.error("Container element not found for playlist:", playlist.playlistID);
            return; // Return early if the container element is not found
        }
    }

    // specify the columns
    private createColumnDefs() {
        return [
            { headerName: "Track Name", field: "trackName", cellRenderer: this.customCellRenderer, dndSource: true },
            { headerName: "Artist", field: "trackArtist" },
            { headerName: "Popularity", field: "trackPopularity" },
            { headerName: "Danceability", field: "trackDanceability" }, 
            { headerName: "Energy", field: "trackEnergy" }, 
            { headerName: "Instrumentalness", field: "trackInstrumentalness" }, 
            { headerName: "Tempo", field: "trackTempo" }, 
            { headerName: "Valence", field: "trackValence" }, 
        ];
    }

    // specify the data
    private createRowData() {
        // Retrieve playlist tracks from the playlist and format them for the grid
        let rowData: any[] = [];
        for (let track of this.playlist.tracks) {
            rowData.push({
                trackName: track.trackName,
                trackArtist: track.trackArtist,
                trackPopularity: track.trackPopularity,
                trackDanceability: track.trackDanceability,
                trackEnergy: track.trackEnergy,
                trackInstrumentalness: track.trackInstrumentalness,
                trackTempo: track.trackTempo,
                trackValence: track.trackValence,
                trackUrl: track.trackUrl // Include track URL in rowData
            });
        }
        return rowData;
    }

    

    // Custom cell renderer to render track names as hyperlinks
    private customCellRenderer(params: any) {
        if (params.value && params.value !== '') {
            return `<a href="${params.data.trackUrl}" target="spotifytab">${params.value}</a>`;
        }
        return null;
    }
}


