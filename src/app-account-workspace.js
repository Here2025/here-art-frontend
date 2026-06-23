function readLocalProfile() {
  try {
    const rawProfiles = window.localStorage.getItem('here.local.created.profiles');
    const profiles = rawProfiles ? JSON.parse(rawProfiles) : [];
    return Array.isArray(profiles) ? profiles[0] : null;
  } catch {
    return null;
  }
}

function readFollowers() {
  try {
    const raw = window.localStorage.getItem('here.local.followers');
    const followers = raw ? JSON.parse(raw) : [];

    if (Array.isArray(followers) && followers.length) return followers;
  } catch {
    // Fall back to prototype followers below.
  }

  return [
    { name: 'HERE City Curator', handle: '@here-curator', note: 'Curator profile' },
    { name: 'Walllight Studio', handle: '@walllight', note: 'Artist profile' },
    { name: 'Oak City Sound', handle: '@oakcitysound', note: 'Creative host' },
  ];
}

function displayName(profile) {
  return profile?.displayName || profile?.display_name || profile?.name || 'your HERE profile';
}

function profileType(profile) {
  const type = profile?.profileType || profile?.profile_type || 'artist';
  if (type === 'street_artist') return 'Artist';
  return String(type).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function followerInitials(name = 'HERE') {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'H';
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
      overflow: hidden;
    }

    .here-account-workspace p,
    .here-account-workspace h2,
    .here-account-workspace h3 {
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

    .here-account-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      width: 100%;
      margin-top: 4px;
    }

    .create-gate-note.ready .button-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      align-items: stretch;
      width: 100%;
      margin-top: 12px;
    }

    .here-account-actions button,
    .create-gate-note.ready .button-row button,
    .here-follower-card {
      border: 1px solid #111;
      box-shadow: none;
    }

    .here-account-actions button,
    .create-gate-note.ready .button-row button {
      min-height: 44px;
      border-radius: 999px;
      background: #111;
      color: #fff;
      padding: 11px 16px;
      font-weight: 800;
      line-height: 1.1;
      text-align: center;
      white-space: nowrap;
      cursor: pointer;
      flex: 1 1 155px;
      max-width: 220px;
    }

    .create-gate-note.ready .button-row button {
      width: 100%;
      max-width: none;
    }

    .here-account-actions button.secondary,
    .create-gate-note.ready .button-row button:first-child {
      background: #fff;
      color: #111;
    }

    .here-followers-panel {
      border-top: 1px solid #111;
      padding-top: 18px;
      display: none;
      gap: 14px;
    }

    .here-followers-panel.show {
      display: grid;
    }

    .here-followers-list {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .here-follower-card {
      border-radius: 20px;
      padding: 14px;
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 10px;
      background: #fff;
      color: #111;
      text-align: left;
      width: 100%;
      cursor: pointer;
    }

    .here-follower-card:hover,
    .here-follower-card:focus-visible {
      background: #f6f6f6;
    }

    .here-follower-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #111;
      color: #fff;
      display: grid;
      place-items: center;
      font-size: 0.78rem;
      font-weight: 900;
    }

    .here-follower-card strong,
    .here-follower-card small {
      display: block;
    }

    .here-follower-card small {
      color: #555;
      margin-top: 3px;
    }

    .here-follower-note {
      grid-column: 1 / -1;
      font-size: 0.84rem;
      color: #555;
    }

    @media (max-width: 960px) {
      .here-account-actions button {
        flex-basis: calc(50% - 10px);
        max-width: none;
      }

      .here-followers-list {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 760px) {
      .here-account-actions,
      .create-gate-note.ready .button-row {
        display: grid;
        grid-template-columns: 1fr;
      }

      .here-account-actions button,
      .create-gate-note.ready .button-row button {
        width: 100%;
        max-width: none;
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

function openFollowerProfile(name) {
  const cards = Array.from(document.querySelectorAll('button'));
  const target = cards.find((button) => {
    const text = button.textContent || '';
    const isAccountCard = button.closest('[data-here-account-workspace]');
    return !isAccountCard && text.includes(name);
  });

  if (target) {
    target.click();
    return;
  }

  const notice = document.querySelector('[data-account-followers-panel] .here-follower-note');
  if (notice) {
    notice.textContent = `${name}'s profile is part of the prototype follower list. Full follower-to-profile routing will connect when live accounts are added.`;
  }
}

function followerCards() {
  return readFollowers()
    .map((follower) => `
      <button class="here-follower-card" type="button" data-follower-name="${follower.name}">
        <span class="here-follower-avatar">${followerInitials(follower.name)}</span>
        <span>
          <strong>${follower.name}</strong>
          <small>${follower.handle || ''}</small>
        </span>
        <span class="here-follower-note">${follower.note || 'Follower'}</span>
      </button>
    `)
    .join('');
}

function toggleFollowers(panel) {
  const followers = panel.querySelector('[data-account-followers-panel]');
  const button = panel.querySelector('[data-account-action="followers"]');
  const isOpen = followers?.classList.toggle('show');

  if (button) button.textContent = isOpen ? 'Hide followers' : 'Followers';
}

function renderAccountWorkspace(profile) {
  const profilePage = document.querySelector('.profile-page');
  if (!profilePage || document.querySelector('[data-here-account-workspace]')) return;

  const followers = readFollowers();
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
      <button type="button" data-account-action="followers">Followers</button>
      <button type="button" class="secondary" data-account-action="my-space">Saved & following</button>
    </div>
    <section class="here-followers-panel" data-account-followers-panel="true">
      <div>
        <p class="account-kicker">Followers</p>
        <h3>${followers.length} followers</h3>
      </div>
      <div class="here-followers-list">
        ${followerCards()}
      </div>
      <p class="here-follower-note">Click a follower to open their profile. These are prototype followers until live accounts are connected.</p>
    </section>
  `;

  profilePage.insertBefore(panel, profilePage.firstChild);
  panel.querySelector('[data-account-action="edit-profile"]')?.addEventListener('click', () => goToCreate('profile'));
  panel.querySelector('[data-account-action="add-artwork"]')?.addEventListener('click', () => goToCreate('artwork'));
  panel.querySelector('[data-account-action="add-event"]')?.addEventListener('click', () => goToCreate('event'));
  panel.querySelector('[data-account-action="followers"]')?.addEventListener('click', () => toggleFollowers(panel));
  panel.querySelector('[data-account-action="my-space"]')?.addEventListener('click', () => findButtonByText(['My Space', 'Saved'])?.click());
  panel.querySelectorAll('[data-follower-name]').forEach((button) => {
    button.addEventListener('click', () => openFollowerProfile(button.getAttribute('data-follower-name')));
  });
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
