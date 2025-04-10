document.addEventListener('DOMContentLoaded', function () {
  const loginButton = document.getElementById('loginButton');
  const accountPic = document.getElementById('accountPic');
  const accountName = document.getElementById('accountName');
  const accountEmail = document.getElementById('accountEmail');
  const signOutBtn = document.getElementById('signOutBtn');

  chrome.storage.local.get(['userProfile', 'accessToken'], function (result) {
    if (result.userProfile && result.accessToken) {
      updateUIWithUserProfile(result.userProfile);
      switchPage('page-mail');
      loadSideNav();
    } else {
      switchPage('page-home');
    }
  });

  loginButton?.addEventListener('click', function () {
    loginButton.textContent = 'Signing in...';
    loginButton.disabled = true;

    chrome.runtime.sendMessage({ action: 'authenticate' }, function (response) {
      if (response.success) {
        updateUIWithUserProfile(response.userProfile);
        switchPage('page-mail');
        loadSideNav();
      } else {
        loginButton.textContent = 'Sign in with Google';
        loginButton.disabled = false;
        alert('Authentication failed. Please try again.');
      }
    });
  });

  signOutBtn?.addEventListener('click', function () {
    chrome.runtime.sendMessage({ action: 'logout' }, function (response) {
      if (response.success) {
        resetUI();
      }
    });
  });

  function updateUIWithUserProfile(profile) {
    accountPic.src = profile.picture;
    accountName.textContent = profile.name || 'Google User';
    accountEmail.textContent = profile.email || '';
  }

  function resetUI() {
    if (loginButton) loginButton.style.display = 'block';
    if (signOutBtn) signOutBtn.style.display = 'none';
    switchPage('page-home');

    const sidenav = document.getElementById('easyemail-sidenav');
    if (sidenav) sidenav.remove();
  }

  function loadSideNav() {
    if (!document.getElementById('easyemail-sidenav')) {
      const script = document.createElement('script');
      script.src = 'sidenav.js';
      script.defer = true;
      script.onload = () => {
        if (typeof createSideNav === 'function') {
          createSideNav();
        } else {
          console.error('createSideNav is not defined');
        }
      };
      script.onerror = () => console.error('Failed to load sidenav.js');
      document.body.appendChild(script);
    }
  }

  window.switchPage = function (pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const page = document.getElementById(pageId);
    if (page) page.style.display = 'block';

    if (pageId === 'page-mail') {
      chrome.storage.local.get(['accessToken'], function (result) {
        const emailList = document.getElementById('emailList');
        if (result.accessToken) {
          fetchEmails(result.accessToken);
        } else {
          emailList.innerHTML = '<div class="loading">Please sign in to view your emails</div>';
        }
      });
    }
  };

  async function fetchEmails(accessToken) {
    const emailList = document.getElementById('emailList');
    emailList.innerHTML = '<div class="loading">Loading your emails...</div>';

    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) throw new Error('Failed to fetch emails');
      const data = await response.json();
      displayEmails(data.messages, accessToken);
    } catch (err) {
      emailList.innerHTML = '<div class="loading">Error loading emails. Please try again.</div>';
    }
  }

  async function displayEmails(messages, accessToken) {
    const emailList = document.getElementById('emailList');

    if (!messages || messages.length === 0) {
      emailList.innerHTML = '<div class="loading">No emails found</div>';
      return;
    }

    const emailHTML = await Promise.all(messages.map(async (message) => {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const emailData = await res.json();
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
