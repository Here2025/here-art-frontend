function readLocalProfile() {
  try {
    const rawProfiles = window.localStorage.getItem('here.local.created.profiles');
    const profiles = rawProfiles ? JSON.parse(rawProfiles) : [];
    return Array.isArray(profiles) ? profiles[0] : null;
  } catch {
    return null;
  }
}

function displayName(profile) {
  return profile?.displayName || profile?.display_name || profile?.name || 'your HERE profile';
}

function profileType(profile) {
  const type = profile?.profileType || profile?.profile_type || 'artist';
  if (type === 'street_artist') return 'Artist';
  return String(type).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ensureAccountStyles() {
  if (document.querySelector('[data-here-account-styles]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-here-account-styles', 'true');
  style.textContent = `
    .here-account-workspace {
      grid-column: 1 / -1;
      border: 1px solid #111;
      border-radius: 28px;
      padding: 24px;
      margin-bottom: 18px;
      background: #fff;
      display: grid;
      gap: 18px;
    }

    .here-account-workspace p,
    .here-account-workspace h2 {
      margin: 0;
    }

    .here-account-workspace h2 {
      font-size: clamp(1.5rem, 3vw, 2.4rem);
      letter-spacing: -0.05em;
    }

    .here-account-workspace .account-kicker {
      text-transform: uppercase;
      letter-spacing: 0.14em;
      font-size: 0.72rem;
      font-weight: 800;
    }

    .here-account-actions,
    .create-gate-note.ready .button-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      align-items: stretch;
      width: 100%;
      margin-top: 4px;
    }

    .here-account-actions button,
    .create-gate-note.ready .button-row button {
      width: 100%;
      min-height: 44px;
      border: 1px solid #111;
      border-radius: 999px;
      background: #111;
      color: #fff;
      padding: 11px 16px;
      font-weight: 800;
      line-height: 1;
      text-align: center;
      white-space: nowrap;
      cursor: pointer;
      box-shadow: none;
    }

    .here-account-actions button.secondary,
    .create-gate-note.ready .button-row button:first-child {
      background: #fff;
      color: #111;
    }

    .create-gate-note.ready .button-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-top: 12px;
    }

    @media (max-width: 760px) {
      .here-account-actions,
      .create-gate-note.ready .button-row {
        grid-template-columns: 1fr;
      }

      .here-account-actions button,
      .create-gate-note.ready .button-row button {
        white-space: normal;
      }
    }
  `;
  document.head.appendChild(style);
}

function findButtonByText(texts) {
  const wanted = Array.isArray(texts) ? texts : [texts];
  return Array.from(document.querySelectorAll('button')).find((button) =>
    wanted.includes(button.textContent?.trim())
  );
}

function goToCreate(intent) {
  try {
    window.localStorage.setItem('here.create.intent', intent);
  } catch {
    // Navigation still works without remembering the tab.
  }

  findButtonByText('Create')?.click();
  window.setTimeout(() => openCreateIntent(), 300);
  window.setTimeout(() => openCreateIntent(), 900);
}

function openCreateIntent() {
  let intent = '';

  try {
    intent = window.localStorage.getItem('here.create.intent') || '';
  } catch {
    intent = '';
  }

  if (!intent) return;

  const labels = {
    profile: 'Profile',
    artwork: 'Artwork / Place',
    event: 'Event',
  };

  const target = findButtonByText(labels[intent]);
  if (target && !target.disabled) {
    target.click();
    try {
      window.localStorage.removeItem('here.create.intent');
    } catch {
      // Ignore storage errors.
    }
  }
}

function relabelProfileNav(profile) {
  if (!profile) return;

  Array.from(document.querySelectorAll('button')).forEach((button) => {
    if (button.textContent?.trim() === 'Profile') button.textContent = 'My Account';
  });
}

function renderAccountWorkspace(profile) {
  const profilePage = document.querySelector('.profile-page');
  if (!profilePage || document.querySelector('[data-here-account-workspace]')) return;

  const panel = document.createElement('section');
  panel.className = 'here-account-workspace';
  panel.setAttribute('data-here-account-workspace', 'true');
  panel.innerHTML = `
    <p class="account-kicker">Signed in locally</p>
    <h2>My Account</h2>
    <p>You are working as <strong>${displayName(profile)}</strong>${profileType(profile) ? ` · ${profileType(profile)}` : ''}. Manage your profile and post your creative work from here.</p>
    <div class="here-account-actions">
      <button type="button" data-account-action="edit-profile">Edit profile</button>
      <button type="button" data-account-action="add-artwork">Add artwork/place</button>
      <button type="button" data-account-action="add-event">Add event</button>
      <button type="button" class="secondary" data-account-action="my-space">Saved & following</button>
    </div>
  `;

  profilePage.insertBefore(panel, profilePage.firstChild);
  panel.querySelector('[data-account-action="edit-profile"]')?.addEventListener('click', () => goToCreate('profile'));
  panel.querySelector('[data-account-action="add-artwork"]')?.addEventListener('click', () => goToCreate('artwork'));
  panel.querySelector('[data-account-action="add-event"]')?.addEventListener('click', () => goToCreate('event'));
  panel.querySelector('[data-account-action="my-space"]')?.addEventListener('click', () => findButtonByText(['My Space', 'Saved'])?.click());
}

function syncAccountExperience() {
  const profile = readLocalProfile();
  ensureAccountStyles();
  relabelProfileNav(profile);
  renderAccountWorkspace(profile);
  openCreateIntent();
}

if (typeof window !== 'undefined' && !window.__HERE_ACCOUNT_WORKSPACE__) {
  window.__HERE_ACCOUNT_WORKSPACE__ = true;
  window.setInterval(syncAccountExperience, 700);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncAccountExperience);
  } else {
    syncAccountExperience();
  }
}
