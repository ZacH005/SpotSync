interface UserProfile {
    country: string;
    display_name: string;
    email: string;
    explicit_content: {
        filter_enabled: boolean,
        filter_locked: boolean
    },
    external_urls: { spotify: string; };
    followers: { href: string; total: number; };
    href: string;
    id: string;
    images: Image[];
    product: string;
    type: string;
    uri: string;
}

interface Image {
    url: string;
    height: number;
    width: number;
}

interface UserPlaylists {
    total: number;
    owner:{
        display_name: string;
    }
    items:[
        {
            name: string;
            id: string;
          }
    ]   
}

interface Playlist  {
    external_urls:   {
        spotify: string;
    }
    id: string;
    name: string;
    tracks: {
        total: number;
        items:  {
            track:  {
                name: string;
                id: string;
                external_urls:  {
                    spotify: string;
                }
                album:  {
                    artists:    [
                        {
                            name: string;
                        }
                        
                    ]
                }
                popularity: number;
            }
        }
    }
    images: Image[];
}

interface TrackInfo{
    audio_features: [
        {
            danceability: number;
            energy: number;
            instrumentalness: number;
            tempo: number;
            valence: number;
        }
    ]
}





