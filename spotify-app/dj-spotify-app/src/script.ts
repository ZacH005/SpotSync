//Imports specific functions from an external module.
import { redirectToAuthCodeFlow, getAccessToken } from "./authCodeWithPkce.ts";
import { GridApi, createGrid, GridOptions, ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { RowDragComp } from "ag-grid-community/dist/lib/rendering/row/rowDragComp";
import { RowDragFeature } from "ag-grid-community/dist/lib/gridBodyComp/rowDragFeature";

//this is the appID
const clientId = "29ef0e92931e4445a605be8b6f3b674e";
var accessToken = "";

//Parses and handles parameters from the URL.
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

//Defines a custom TypeScript type for an array of playlists
type myPlaylistArray =  {
    list: myPlaylist[];
}

/*Defines a custom TypeScript type for a playlist object
including all necessary attributes to be used later*/
type myPlaylist =  {
    playlistName: string;
    playlistUrl: string;
    playlistID: string;
    playlistImageUrl: string;
    playlistTotal: number;
    /*Nests array with an array of tracks within specific 
    playlist, linking it to proper type for referening*/
    tracks: myTracklist[];
}

/*Defining additional type for tracks object, maximizing
reusability allowing for all playlists to locally save
tracks within the given arrays*/
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

// Initialize as an empty array
let listofPlaylists: myPlaylistArray = { list: [] }; 

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
    var trackIDs = "";
    for (let i in playlist.tracks.items) {
        trackIDs += playlist.tracks.items[i].track.id + ",";
    }
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

        /* As the additional attributs are returned in the same order, 
        the same array index can be used*/
        console.log("Playlist has provided data:");
        for (let i = 0; i in playlist.tracks.items; i++) {
            const trackData = data.audio_features[i];
            if (trackData) {
                console.log("Track Attributes are given:", i, trackData.energy);
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
        
        /* After fetching the playlists and populating the array, 
        create a new instance of PlaylistGrid for each playlist*/
        for (let playlist of listofPlaylists.list) {
            console.log("Creating grid for playlist:", playlist.playlistID);
            new PlaylistGrid(playlist);
        }

        new PlaylistsGrid(myList);
        console.log("creating playlists grid:", myList)
        return data;
    } catch (error) {
        console.error("Error fetching tracks info:", error);
        throw error; // Rethrow the error to propagate it to the caller
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

ModuleRegistry.register(ClientSideRowModelModule);

let gridApis: GridApi[] = []; // Define gridApis as an array of GridApi

class PlaylistsGrid {
    private gridOptions: GridOptions = <GridOptions>{};
    private playlist: myPlaylist;
    private gridApi;

    constructor(playlist: myPlaylist) {
        this.playlist = playlist;

        this.gridOptions = {
            columnDefs: this.createColumnDefs(),
            rowData: this.createRowData(),
            rowDragManaged: true,
        };

        let eGridDiv: HTMLElement = <HTMLElement>document.querySelector('#playlistsGridContainer');
        console.log("Container element:", eGridDiv); // Log the container element
        this.gridApi = createGrid(eGridDiv, this.gridOptions);
        gridApis.push(this.gridApi); // Store grid API for later use
    }

    // specify the columns
    private createColumnDefs() {
        return [
            { headerName: "Playlist Name", field: "playlistName", cellRenderer: this.customCellRenderer, rowDrag: true },
            { headerName: "Playlist ID", field: "playlistID" },
        ];
    }

    // specify the data
    private createRowData() {
        // Retrieve playlist tracks from the playlist and format them for the grid
        let rowData: any[] = [];
        for (let track of this.playlist.tracks) {
            rowData.push({
                playlistName: this.playlist.playlistName,
                playlistID: this.playlist.playlistID,
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

class PlaylistGrid {
    private gridOptions: GridOptions = <GridOptions>{};
    private playlist: myPlaylist;
    private gridApi;

    constructor(playlist: myPlaylist) {
        this.playlist = playlist;

        this.gridOptions = {
            columnDefs: this.createColumnDefs(),
            rowData: this.createRowData(),
            rowDragManaged: true,
            //onRowDragMove: this.onRowDragMove.bind(this),
            onRowDragEnd: this.onRowDragEnd.bind(this),
            onRowDragLeave: this.onRowDragLeave.bind(this),
        };

        let eGridDiv: HTMLElement = <HTMLElement>document.querySelector('#playlistGrid_' + playlist.playlistID);
        console.log("Container element:", eGridDiv); // Log the container element
        this.gridApi = createGrid(eGridDiv, this.gridOptions);
        gridApis.push(this.gridApi); // Store grid API for later use
    }

    // specify the columns
    private createColumnDefs() {
        return [
            { headerName: "Track Name", field: "trackName", cellRenderer: this.customCellRenderer, rowDrag: true },
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

    // // Row drag move event handler
    // private onRowDragMove(event) {
    //     
    // }

    // Row drag end event handler
    private onRowDragEnd(event) {
        // This event is triggered when the row dragging ends (regardless of where it ends up)
        console.log("Row dragging ended:", event.node.data);

        // Get the target grid API
        const targetGridApi = gridApis.find(api => api.getGridId() === event.overNode.gridId);

        // Check if targetGridApi is defined and the row is dropped onto another grid
        if (targetGridApi && event.overIndex >= 0) {
            // Get the row data from the source grid
            const sourceRowData = event.node.data;

            // Add the row to the target grid
            targetGridApi.applyTransaction({ add: [sourceRowData] });
        }
    }

    // Row drag leave event handler
    private onRowDragLeave(event) {
        // This event is triggered when the row is dragged out of the grid
        console.log("Row dragged out of the grid:", event.node.data);

        const sourceRowData = event.node.data;

        // Add the row to the target grid
        const targetGridId = event.overIndex >= 0 ? event.overNode.gridId : null;
        if (targetGridId) {
            const targetGridApi = gridApis.find(api => api.getGridId() === targetGridId);
            if (targetGridApi) {
                targetGridApi.applyTransaction({ add: [sourceRowData] });
            }
        }
    }
}



// async function createPlaylist(accessToken: string, userID: string): Promise<any> {
//     try {
//         const result = await fetch("https://api.spotify.com/v1/users/" + userID + "/playlists", {
//             method: "POST",
//             headers: {
//                 Authorization: `Bearer ${accessToken}`,
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 name: "New Playlist",
//                 description: "Empty Playlist",
//                 public: true
//             })
//         });

//         const newPlaylistData = await result.json();

//         const playlist = newPlaylistData.id;

//         populateArray(playlist, listofPlaylists);

//         return newPlaylistData;
//     } catch (error) {
//         console.error("Error creating playlist:", error);
//         throw error; // Rethrow the error to propagate it to the caller
//     }
// }


const createPlaylistButton = document.getElementById('createPlaylist') as HTMLInputElement;

createPlaylistButton.addEventListener('click', async () => {
    await createPlaylist(accessToken, userID);
});

async function createPlaylist(accessToken: string, userID: string): Promise<any> {
    try {
        const response = await fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: "New Playlist",
                public: true // Adjust as needed, whether the playlist should be public or not
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create playlist');
        }

        const playlistData = await response.json();
        return playlistData;
    } catch (error) {
        console.error('Error creating playlist:', error);
        throw error;
    }
}