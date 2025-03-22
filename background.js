// Constants for OAuth
const CLIENT_ID = "1065876985144-23urplbt4j0550mc87gvt5li8opn3cgd.apps.googleusercontent.com";
const REDIRECT_URI = "https://edlmlnigjpjhmamkbffghdlheeepfgkf.chromiumapp.org";
const RESPONSE_TYPE = "token id_token";
const SCOPE = "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify";

// Track user sign-in state
let user_signed_in = false;

// Check if user is signed in on startup
chrome.storage.local.get(['userProfile', 'accessToken'], function(result) {
    if (result.userProfile && result.accessToken) {
        user_signed_in = true;
    }
});

// Listen for messages from popup or side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'authenticate') {
        // Launch the auth flow
        authenticateUser()
            .then(response => {
                sendResponse(response);
            })
            .catch(error => {
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
});

// Function to authenticate user
async function authenticateUser() {
    try {
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
        
        // Launch web auth flow
        const redirectUrl = await chrome.identity.launchWebAuthFlow({
            url: authUrl.toString(),
            interactive: true
        });
        
        // Parse the redirect URL for tokens
        const urlParams = new URLSearchParams(new URL(redirectUrl).hash.substring(1));
        const accessToken = urlParams.get("access_token");
        const idToken = urlParams.get("id_token");
        const returnedState = urlParams.get("state");
        
        // Verify state to prevent CSRF
        if (returnedState !== state) {
            throw new Error("Invalid state parameter");
        }
        
        // Get user info
        const userInfo = await getUserInfo(accessToken);
        
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
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch user profile');
    }
    
    return await response.json();
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
        chrome.sidePanel.open({ tabId: tabId });
    }
}); 