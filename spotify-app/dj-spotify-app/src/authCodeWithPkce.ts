/* Source: Spotify documentation - (Authorization code with PKCE flow) found in references
Comments written by Author with aid from Spotify Documentation on the Authorization flow*/

// Function to redirect user for authentication with PKCE flow
export async function redirectToAuthCodeFlow(clientId: string) {
    // Generate a code verifier for PKCE
    const verifier = generateCodeVerifier(128);
    // Generate a code challenge based on the verifier
    const challenge = await generateCodeChallenge(verifier);

    // Store the verifier locally to be used later in the flow
    localStorage.setItem("verifier", verifier);

    // Prepare the authorization request parameters
    const params = new URLSearchParams();   
    params.append("client_id", clientId); // Spotify Client ID
    params.append("response_type", "code"); // Indicating we want an authorization code back
    params.append("redirect_uri", "http://localhost:5173/callback"); // Where Spotify will redirect to after authorization
    params.append("scope", "user-read-private user-read-email"); // Permissions the app is requesting
    params.append("code_challenge_method", "S256"); // PKCE method used
    params.append("code_challenge", challenge); // The PKCE code challenge

    // Redirect user to Spotify's authorization endpoint with the parameters
    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Function to exchange authorization code for an access token
export async function getAccessToken(clientId: string, code: string) {
    // Retrieve the stored verifier
    const verifier = localStorage.getItem("verifier");

    // Prepare the request parameters for token exchange
    const params = new URLSearchParams();
    params.append("client_id", clientId); // Spotify Client ID
    params.append("grant_type", "authorization_code"); // Indicating the type of grant we're requesting
    params.append("code", code); // The authorization code received from the initial auth request
    params.append("redirect_uri", "http://localhost:5173/callback"); // Must match the initial request's URI
    params.append("code_verifier", verifier!); // The stored code verifier for PKCE validation

    // Make a POST request to Spotify's token endpoint
    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    // Parse and return the access token from the response
    const { access_token } = await result.json();
    return access_token;
}

// Function to generate a secure, random code verifier for PKCE
function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // Create a random string of specified length
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Function to generate a code challenge from the verifier
async function generateCodeChallenge(codeVerifier: string) {
    // Encode the verifier to a Uint8Array
    const data = new TextEncoder().encode(codeVerifier);
    // Hash the encoded verifier using SHA-256
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    // Convert the hash to a URL-safe base64 string, replacing URL-unsafe characters
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
