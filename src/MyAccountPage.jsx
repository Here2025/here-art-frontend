import React, { useMemo, useState } from 'react';
import './my-account-page.css';

const fallbackFollowers = [
  { name: 'HERE City Curator', handle: '@here-curator', note: 'Curator profile' },
  { name: 'Walllight Studio', handle: '@walllight', note: 'Artist profile' },
  { name: 'Oak City Sound', handle: '@oakcitysound', note: 'Creative host' },
];

function readLocalList(key) {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readCurrentProfile() {
  return readLocalList('here.local.created.profiles')[0] || null;
}

function normalizeHandle(handle = '') {
  return String(handle).replace(/^@/, '').toLowerCase();
}

function displayType(profile) {
  const type = profile?.profileType || profile?.profile_type || 'explorer';
  if (type === 'street_artist') return 'Artist';
  return String(type).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function initials(value = 'HERE') {
  return String(value)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'H';
}

function findProfileForFollower(follower, profiles) {
  const followerHandle = normalizeHandle(follower.handle);
  return profiles.find((profile) => {
    const profileHandle = normalizeHandle(profile.handle);
    return profile.displayName === follower.name || (followerHandle && profileHandle === followerHandle);
  });
}

function AccountTile({ label, value }) {
  return (
    <span className="account-stat-tile">
      <strong>{value}</strong>
      <small>{label}</small>
    </span>
  );
}

function EmptyPanel({ children }) {
  return <p className="account-empty-panel">{children}</p>;
}

export default function MyAccountPage({
  profiles = [],
  artworks = [],
  events = [],
  savedArtworks = [],
  savedEvents = [],
  likedArtworks = [],
  checkIns = [],
  followed = [],
  openArt,
  openEvent,
  openProfile,
  setPage,
}) {
  const [active, setActive] = useState('overview');
  const [notice, setNotice] = useState('');
  const currentProfile = useMemo(() => readCurrentProfile(), []);
  const localArtworks = useMemo(() => readLocalList('here.local.created.artworks'), []);
  const localEvents = useMemo(() => readLocalList('here.local.created.events'), []);
  const followers = useMemo(() => {
    const savedFollowers = readLocalList('here.local.followers');
    return savedFollowers.length ? savedFollowers : fallbackFollowers;
  }, []);

  const profile = currentProfile || profiles.find((p) => p.localOnly) || null;
  const ownedArtworks = localArtworks.length ? localArtworks : artworks.filter((item) => item.localOnly);
  const ownedEvents = localEvents.length ? localEvents : events.filter((item) => item.localOnly);

  function goCreate(mode) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('here.create.intent', mode);
    }
    setPage?.('create');
  }

  function openFollower(follower) {
    const profileMatch = findProfileForFollower(follower, profiles);

    if (profileMatch) {
      openProfile?.(profileMatch);
      return;
    }

    setNotice(`${follower.name}'s profile is not connected to a live account yet.`);
  }

  if (!profile) {
    return (
      <section className="page my-account-page">
        <div className="account-hero-card">
          <p className="small-kicker">My Account</p>
          <h1>Create your HERE profile</h1>
          <p>Create a profile first, then you can manage your account, post artwork, share events, and see your saved/followed activity from one place.</p>
          <div className="account-action-row">
            <button type="button" onClick={() => goCreate('profile')}>Create profile</button>
            <button type="button" className="secondary" onClick={() => setPage?.('discover')}>Explore first</button>
          </div>
        </div>
      </section>
    );
  }

  const location = [profile.city, profile.state || profile.region, profile.country].filter(Boolean).join(', ');

  return (
    <section className="page my-account-page">
      <div className="account-hero-card">
        <div className="account-identity-row">
          <div className="account-avatar">{profile.imageUrl || profile.image_url ? <img src={profile.imageUrl || profile.image_url} alt={profile.displayName || 'My profile'} /> : initials(profile.displayName)}</div>
          <div>
            <p className="small-kicker">Signed in locally</p>
            <h1>{profile.displayName || profile.display_name || 'My Account'}</h1>
            <p>{profile.handle ? `@${normalizeHandle(profile.handle)}` : displayType(profile)} {location ? `· ${location}` : ''}</p>
          </div>
        </div>

        <div className="account-stat-grid">
          <AccountTile label="My artwork/places" value={ownedArtworks.length} />
          <AccountTile label="My events" value={ownedEvents.length} />
          <AccountTile label="Followers" value={followers.length} />
          <AccountTile label="Following" value={followed.length} />
        </div>

        <div className="account-action-row">
          <button type="button" onClick={() => goCreate('profile')}>Edit profile</button>
          <button type="button" onClick={() => goCreate('artwork')}>Add artwork/place</button>
          <button type="button" onClick={() => goCreate('event')}>Add event</button>
          <button type="button" className="secondary" onClick={() => setPage?.('profile')}>View public profile</button>
        </div>
      </div>

      {notice && <div className="account-notice">{notice}</div>}

      <div className="account-tabs">
        {[
          ['overview', 'Overview'],
          ['artwork', 'My artwork'],
          ['events', 'My events'],
          ['followers', 'Followers'],
          ['following', 'Following'],
          ['saved', 'Saved'],
          ['settings', 'Settings'],
        ].map(([id, label]) => (
          <button className={active === id ? 'active' : ''} key={id} onClick={() => setActive(id)} type="button">{label}</button>
        ))}
      </div>

      <div className="account-panel">
        {active === 'overview' && (
          <div className="account-overview-grid">
            <article>
              <p className="small-kicker">Profile</p>
              <h2>{displayType(profile)}</h2>
              <p>{profile.bio || 'Add your bio so people understand your creative work and why they should follow you.'}</p>
              {profile.website && <a href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a>}
            </article>
            <article>
              <p className="small-kicker">Next actions</p>
              <h2>Build your presence</h2>
              <p>Add at least three works or places, one current event, and a strong bio before inviting early testers.</p>
              <div className="account-mini-actions">
                <button type="button" onClick={() => goCreate('artwork')}>Post work</button>
                <button type="button" onClick={() => goCreate('event')}>Post event</button>
              </div>
            </article>
          </div>
        )}

        {active === 'artwork' && (
          ownedArtworks.length ? (
            <div className="account-card-grid">
              {ownedArtworks.map((item) => (
                <button key={item.id} type="button" onClick={() => openArt?.(item)}>
                  {item.imageUrl || item.image_url ? <img src={item.imageUrl || item.image_url} alt={item.title} /> : <span>{initials(item.title).slice(0, 1)}</span>}
                  <strong>{item.title}</strong>
                  <small>{item.category || item.address || 'Creative place'}</small>
                </button>
              ))}
            </div>
          ) : <EmptyPanel>No artwork or places posted yet. Use Add artwork/place to build your profile.</EmptyPanel>
        )}

        {active === 'events' && (
          ownedEvents.length ? (
            <div className="account-card-grid">
              {ownedEvents.map((event) => (
                <button key={event.id} type="button" onClick={() => openEvent?.(event)}>
                  {event.imageUrl || event.image_url ? <img src={event.imageUrl || event.image_url} alt={event.title} /> : <span>{initials(event.title).slice(0, 1)}</span>}
                  <strong>{event.title}</strong>
                  <small>{event.eventType || event.event_type || event.venueName || 'Creative event'}</small>
                </button>
              ))}
            </div>
          ) : <EmptyPanel>No events posted yet. Use Add event to share openings, shows, pop-ups, walks, or performances.</EmptyPanel>
        )}

        {active === 'followers' && (
          <div className="account-card-grid follower-grid">
            {followers.map((follower) => (
              <button key={`${follower.name}-${follower.handle}`} type="button" onClick={() => openFollower(follower)}>
                <span>{initials(follower.name)}</span>
                <strong>{follower.name}</strong>
                <small>{follower.handle || follower.note}</small>
              </button>
            ))}
          </div>
        )}

        {active === 'following' && (
          followed.length ? (
            <div className="account-card-grid follower-grid">
              {followed.map((profileItem) => (
                <button key={profileItem.id} type="button" onClick={() => openProfile?.(profileItem)}>
                  <span>{initials(profileItem.displayName)}</span>
                  <strong>{profileItem.displayName}</strong>
                  <small>{displayType(profileItem)}</small>
                </button>
              ))}
            </div>
          ) : <EmptyPanel>You are not following anyone yet. Follow artists, galleries, hosts, and collectives from their public profiles.</EmptyPanel>
        )}

        {active === 'saved' && (
          <div className="account-overview-grid">
            <article>
              <p className="small-kicker">Saved</p>
              <h2>{savedArtworks.length + savedEvents.length}</h2>
              <p>Saved places and events live in My Space.</p>
              <button type="button" onClick={() => setPage?.('saved')}>Open My Space</button>
            </article>
            <article>
              <p className="small-kicker">Activity</p>
              <h2>{likedArtworks.length + checkIns.length}</h2>
              <p>Liked artwork and check-ins help shape your creative trail.</p>
            </article>
          </div>
        )}

        {active === 'settings' && (
          <div className="account-overview-grid">
            <article>
              <p className="small-kicker">Prototype status</p>
              <h2>Local account</h2>
              <p>This account currently lives in this browser. The next backend step is real authentication, image storage, account ownership, and permissions.</p>
            </article>
            <article>
              <p className="small-kicker">Needed before launch</p>
              <h2>Account foundation</h2>
              <p>Connect sign up/login, profile ownership, edit/delete rights, uploads, followers, reporting, and privacy controls.</p>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}
