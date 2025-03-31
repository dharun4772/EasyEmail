window.createSideNav = async function () {
    if (document.getElementById('easyemail-sidenav')) return;
  
    const userData = await getUserData();
    if (!userData) return;
  
    // Sidebar
    const sideNav = document.createElement('div');
    sideNav.id = 'easyemail-sidenav';
    Object.assign(sideNav.style, {
      position: 'fixed',
      top: '0',
      right: '0',
      height: '100%',
      width: '60px',
      backgroundColor: '#ffffff',
      borderLeft: '1px solid #ddd',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 0',
      boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
      zIndex: '9998',
      justifyContent: 'space-between'
    });
  
    // Top Icons
    const topIcons = document.createElement('div');
    topIcons.style.display = 'flex';
    topIcons.style.flexDirection = 'column';
    topIcons.style.alignItems = 'center';
  
    const icons = [
      { name: 'Home', svg: 'home', page: 'page-home' },
      { name: 'Mail', svg: 'mail', page: 'page-mail' },
      { name: 'Settings', svg: 'settings', page: 'page-settings' }
    ];
  
    icons.forEach(icon => {
      const iconWrapper = document.createElement('div');
      iconWrapper.title = icon.name;
      iconWrapper.innerHTML = getLucideIcon(icon.svg);
      Object.assign(iconWrapper.style, {
        width: '24px',
        height: '24px',
        margin: '20px 0',
        cursor: 'pointer',
        fill: 'none',
        stroke: '#444'
      });
  
      iconWrapper.addEventListener('mouseover', () => {
        iconWrapper.querySelector('svg').style.stroke = '#1a73e8';
      });
      iconWrapper.addEventListener('mouseout', () => {
        iconWrapper.querySelector('svg').style.stroke = '#444';
      });
  
      iconWrapper.addEventListener('click', () => {
        if (window.switchPage) {
          window.switchPage(icon.page);
        }
      });
  
      topIcons.appendChild(iconWrapper);
    });
  
    // Bottom Account Icon
    const accountIcon = document.createElement('div');
    accountIcon.title = 'Account';
    accountIcon.innerHTML = getLucideIcon('user');
    Object.assign(accountIcon.style, {
      width: '24px',
      height: '24px',
      marginBottom: '20px',
      cursor: 'pointer',
      stroke: '#1a73e8'
    });
  
    accountIcon.addEventListener('click', () => {
      if (window.switchPage) {
        window.switchPage('page-account');
      }
    });
  
    sideNav.appendChild(topIcons);
    sideNav.appendChild(accountIcon);
    document.body.appendChild(sideNav);
  };
  
  function getLucideIcon(name) {
    const icons = {
      home: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 9.75L12 3l9 6.75V21a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 21V9.75z"/><path d="M9 22V12h6v10"/></svg>`,
      mail: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="m22 6-10 7L2 6"/></svg>`,
      settings: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L4.2 7.2a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      user: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>`
    };
    return icons[name] || '';
  }
  
  async function getUserData() {
    return new Promise(resolve => {
      chrome.storage.local.get(['userProfile'], function (result) {
        resolve(result.userProfile || null);
      });
    });
  }
  