// Constants for OAuth
const CLIENT_ID = "1065876985144-23urplbt4j0550mc87gvt5li8opn3cgd.apps.googleusercontent.com";
const REDIRECT_URI = "https://jnoppbigdgmcenglgmpohbgmgeeekmpc.chromiumapp.org"; //change this later
const RESPONSE_TYPE = "token id_token";
const SCOPE = "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify";

// Track user sign-in state
let user_signed_in = false;

// Track side panel state for each tab
const sidePanelStates = new Map();

// Check if user is signed in on startup
chrome.storage.local.get(['userProfile', 'accessToken'], function(result) {
    if (result.userProfile && result.accessToken) {
        user_signed_in = true;
    }
});

// Listen for messages from popup or side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'authenticate') {
        console.log('Starting authentication process...');
        // Launch the auth flow
        authenticateUser()
            .then(response => {
                console.log('Authentication response:', response);
                sendResponse(response);
            })
            .catch(error => {
                console.error('Authentication error:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Will respond asynchronously
    }
    
    if (request.action === 'logout') {
        // Sign out the user
        signOut()
            .then(() => {
                sendResponse({ success: true });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true; // Will respond asynchronously
    }
    
    if (request.action === 'isUserSignedIn') {
        // Return the current sign-in state
        sendResponse({ success: true, isSignedIn: user_signed_in });
        return true;
    }
    
    if (request.action === 'toggleSidePanel') {
        // Get the current tab
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
                const tabId = tabs[0].id;
                const isOpen = sidePanelStates.get(tabId) || false;
                
                if (isOpen) {
                    // Close the side panel
                    chrome.sidePanel.close({ tabId: tabId }).catch(error => {
                        console.error('Error closing side panel:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                    sidePanelStates.set(tabId, false);
                } else {
                    // Open the side panel
                    chrome.sidePanel.open({ tabId: tabId }).catch(error => {
                        console.error('Error opening side panel:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                    sidePanelStates.set(tabId, true);
                }
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: 'No active tab found' });
            }
        });
        return true; // Will respond asynchronously
    }
});

// Clean up side panel state when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    sidePanelStates.delete(tabId);
});

// Function to authenticate user
async function authenticateUser() {
    try {
        console.log('Starting authentication process...');
        console.log('Extension ID:', chrome.runtime.id);
        
        // Create auth URL
        const state = Math.random().toString(36).substring(2, 15);
        const nonce = Math.random().toString(36).substring(2, 15);
        
        let authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.append("client_id", CLIENT_ID);
        authUrl.searchParams.append("response_type", RESPONSE_TYPE);
        authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
        authUrl.searchParams.append("scope", SCOPE);
        authUrl.searchParams.append("state", state);
        authUrl.searchParams.append("nonce", nonce);
        authUrl.searchParams.append("prompt", "select_account");
        
        console.log('Auth URL constructed:', authUrl.toString());
        console.log('Client ID:', CLIENT_ID);
        console.log('Redirect URI:', REDIRECT_URI);
        console.log('Scopes:', SCOPE);
        
        try {
            console.log('Launching web auth flow...');
            const redirectUrl = await chrome.identity.launchWebAuthFlow({
                url: authUrl.toString(),
                interactive: true
            });
            
            console.log('Received redirect URL:', redirectUrl);
            
            if (!redirectUrl) {
                throw new Error('No redirect URL received from auth flow');
            }
            
            // Parse the redirect URL for tokens
            const urlParams = new URLSearchParams(new URL(redirectUrl).hash.substring(1));
            const accessToken = urlParams.get("access_token");
            const idToken = urlParams.get("id_token");
            const returnedState = urlParams.get("state");
            const error = urlParams.get("error");
            const errorDescription = urlParams.get("error_description");
            
            console.log('URL Parameters:', Object.fromEntries(urlParams.entries()));
            
            if (error) {
                console.error('OAuth error:', { error, errorDescription });
                throw new Error(`OAuth error: ${errorDescription || error}`);
            }
            
            if (!accessToken || !idToken) {
                console.error('Missing tokens in response:', { 
                    accessToken: !!accessToken, 
                    idToken: !!idToken,
                    params: Object.fromEntries(urlParams.entries())
                });
                throw new Error('Failed to obtain access token or ID token');
            }
            
            // Verify state to prevent CSRF
            if (returnedState !== state) {
                console.error('State mismatch:', { expected: state, received: returnedState });
                throw new Error("Invalid state parameter");
            }
            
            console.log('Successfully obtained tokens');
            console.log('Fetching user info...');
            
            // Get user info
            const userInfo = await getUserInfo(accessToken);
            console.log('User info received:', userInfo);
            
            console.log('Saving to storage...');
            // Save to storage
            await chrome.storage.local.set({
                accessToken: accessToken,
                idToken: idToken,
                userProfile: userInfo
            });
            
            // Update sign-in state
            user_signed_in = true;
            
            return {
                success: true,
                accessToken: accessToken,
                userProfile: userInfo
            };
        } catch (authError) {
            console.error('Auth flow error:', authError);
            throw authError;
        }
    } catch (error) {
        console.error("Authentication error:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get user profile information
async function getUserInfo(accessToken) {
    try {
        console.log('Fetching user info from Google...');
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch user profile:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText}`);
        }
        
        const userInfo = await response.json();
        console.log('User info response:', userInfo);
        return userInfo;
    } catch (error) {
        console.error('Error in getUserInfo:', error);
        throw error;
    }
}

// Sign out
async function signOut() {
    // Clear storage
    await chrome.storage.local.remove(['accessToken', 'idToken', 'userProfile']);
    
    // Update sign-in state
    user_signed_in = false;
    
    return { success: true };
}

// Listen for tab updates to show the side panel on Gmail
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('mail.google.com')) {
        // Do not open the side panel here. Instead, let the user open it via a gesture.
    }
});

// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
    // Open the side panel when the icon is clicked (a user gesture)
    chrome.sidePanel.open({ tabId: tab.id });
});
