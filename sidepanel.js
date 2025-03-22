document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('loginButton');
    const profilePicture = document.getElementById('profilePicture');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const emailList = document.getElementById('emailList');
    const successScreen = document.getElementById('successScreen');
    const continueButton = document.getElementById('continueButton');

    // Check if user is already authenticated
    chrome.storage.local.get(['userProfile', 'accessToken'], function(result) {
        if (result.userProfile && result.accessToken) {
            updateUIWithUserProfile(result.userProfile);
            showSuccessScreen();
        }
    });

    loginButton.addEventListener('click', function() {
        loginButton.textContent = 'Signing in...';
        loginButton.disabled = true;
        
        chrome.runtime.sendMessage({ action: 'authenticate' }, function(response) {
            if (response.success) {
                updateUIWithUserProfile(response.userProfile);
                showSuccessScreen();
            } else {
                // Show error
                loginButton.textContent = 'Sign in with Google';
                loginButton.disabled = false;
                alert('Authentication failed. Please try again.');
            }
        });
    });

    continueButton.addEventListener('click', function() {
        hideSuccessScreen();
        
        chrome.storage.local.get(['accessToken'], function(result) {
            if (result.accessToken) {
                fetchEmails(result.accessToken);
            } else {
                emailList.innerHTML = '<div class="loading">Error: No access token found. Please sign in again.</div>';
            }
        });
    });

    // Add sign out functionality
    const signOutBtn = document.createElement('button');
    signOutBtn.textContent = 'Sign Out';
    signOutBtn.className = 'login-button';
    signOutBtn.style.backgroundColor = '#d93025';
    signOutBtn.style.display = 'none';
    signOutBtn.style.marginTop = '10px';
    
    // Insert sign out button after userName
    userEmail.parentNode.appendChild(signOutBtn);
    
    signOutBtn.addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'logout' }, function(response) {
            if (response.success) {
                // Reset UI
                profilePicture.style.display = 'none';
                userName.textContent = '';
                userEmail.textContent = '';
                loginButton.style.display = 'block';
                signOutBtn.style.display = 'none';
                successScreen.style.display = 'none';
                emailList.innerHTML = '<div class="loading">Please sign in to view your emails</div>';
                emailList.style.display = 'block';
            }
        });
    });

    function updateUIWithUserProfile(profile) {
        profilePicture.src = profile.picture;
        profilePicture.style.display = 'block';
        userName.textContent = profile.name || 'Google User';
        userEmail.textContent = profile.email || '';
        loginButton.style.display = 'none';
        signOutBtn.style.display = 'block';
    }

    function showSuccessScreen() {
        successScreen.style.display = 'block';
        emailList.style.display = 'none';
    }

    function hideSuccessScreen() {
        successScreen.style.display = 'none';
        emailList.style.display = 'block';
    }

    async function fetchEmails(accessToken) {
        emailList.innerHTML = '<div class="loading">Loading your emails...</div>';
        
        try {
            const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch emails');
            }

            const data = await response.json();
            displayEmails(data.messages, accessToken);
        } catch (error) {
            console.error('Error fetching emails:', error);
            emailList.innerHTML = '<div class="loading">Error loading emails. Please try again.</div>';
        }
    }

    async function displayEmails(messages, accessToken) {
        if (!messages || messages.length === 0) {
            emailList.innerHTML = '<div class="loading">No emails found</div>';
            return;
        }

        const emailHTML = await Promise.all(messages.map(async (message) => {
            const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch email details');
            }

            const emailData = await response.json();
            const headers = emailData.payload.headers;
            const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
            const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';

            return `
                <div class="email-item">
                    <div class="email-subject">${subject}</div>
                    <div class="email-sender">${from}</div>
                </div>
            `;
        }));

        emailList.innerHTML = emailHTML.join('');
    }
}); 