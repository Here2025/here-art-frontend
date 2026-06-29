import React, { useMemo, useState } from 'react';
import './my-account-page.css';

const fallbackFollowers = [
  { name: 'HERE City Curator', handle: '@here-curator', note: 'Curator profile' },
  { name: 'Walllight Studio', handle: '@walllight', note: 'Artist profile' },
  { name: 'Oak City Sound', handle: '@oakcitysound', note: 'Creative host' },
];

const profileTypes = [
  { value: 'explorer', label: 'Explorer' },
  { value: 'artist', label: 'Artist' },
  { value: 'designer', label: 'Designer / Fashion Brand' },
  { value: 'musician', label: 'Musician / Performer' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'venue', label: 'Venue' },
  { value: 'collective', label: 'Collective' },
  { value: 'curator', label: 'Curator / Host' },
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

function writeLocalList(key, value) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the account page usable if local storage is unavailable.
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

function profileBioWithoutSpecialty(profile) {
  return String(profile?.bio || '').replace(/Specialty:\s*[^\n]+/i, '').trim();
}

function profileSpecialty(profile) {
  const direct = profile?.specialty || profile?.discipline || '';
  if (direct) return direct;
  const match = String(profile?.bio || '').match(/Specialty:\s*([^\n]+)/i);
  return match?.[1] || '';
}

function profileToForm(profile) {
  return {
    displayName: profile?.displayName || profile?.display_name || '',
    handle: normalizeHandle(profile?.handle || ''),
    profileType: profile?.profileType || profile?.profile_type || 'explorer',
    specialty: profileSpecialty(profile),
    city: profile?.city || '',
    region: profile?.region || profile?.state || '',
    country: profile?.country || '',
    website: profile?.website || profile?.websiteUrl || profile?.website_url || '',
    bio: profileBioWithoutSpecialty(profile),
    imageUrl: profile?.imageUrl || profile?.image_url || '',
  };
}

function buildUpdatedProfile(original, form) {
  const specialty = form.specialty.trim();
  const bio = form.bio.trim();
  const displayBio = [specialty ? `Specialty: ${specialty}` : '', bio].filter(Boolean).join('\n\n');

  return {
    ...original,
    id: original?.id || `local-profile-${Date.now()}`,
    displayName: form.displayName.trim() || 'Creative profile',
    display_name: form.displayName.trim() || 'Creative profile',
    handle: normalizeHandle(form.handle),
    profileType: form.profileType,
    profile_type: form.profileType,
    specialty,
    discipline: specialty,
    city: form.city.trim(),
    state: form.region.trim(),
    region: form.region.trim(),
    country: form.country.trim(),
    website: form.website.trim(),
    website_url: form.website.trim(),
    bio: displayBio || 'A creative account on HERE.',
    imageUrl: form.imageUrl.trim(),
    image_url: form.imageUrl.trim(),
    localOnly: true,
  };
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

function EditProfileForm({ form, setForm, onSave, onCancel }) {
  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className="account-edit-form" onSubmit={onSave}>
      <label><span>Profile name</span><input value={form.displayName} onChange={(event) => update('displayName', event.target.value)} /></label>
      <label><span>Handle</span><input value={form.handle} onChange={(event) => update('handle', event.target.value)} /></label>
      <label><span>Profile type</span><select value={form.profileType} onChange={(event) => update('profileType', event.target.value)}>{profileTypes.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}</select></label>
      <label><span>Specialty / discipline</span><input value={form.specialty} onChange={(event) => update('specialty', event.target.value)} /></label>
      <label><span>City</span><input value={form.city} onChange={(event) => update('city', event.target.value)} /></label>
      <label><span>Region / State / Province</span><input value={form.region} onChange={(event) => update('region', event.target.value)} /></label>
      <label><span>Country</span><input value={form.country} onChange={(event) => update('country', event.target.value)} /></label>
      <label><span>Website</span><input value={form.website} onChange={(event) => update('website', event.target.value)} /></label>
      <label className="wide"><span>Profile image URL</span><input value={form.imageUrl} onChange={(event) => update('imageUrl', event.target.value)} placeholder="Permanent image upload comes next" /></label>
      <label className="wide"><span>Bio</span><textarea value={form.bio} onChange={(event) => update('bio', event.target.value)} /></label>
      <div className="account-edit-actions">
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        <button type="submit">Save profile</button>
      </div>
    </form>
  );
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
  const initialProfile = useMemo(() => readCurrentProfile() || profiles.find((p) => p.localOnly) || null, [profiles]);
  const [active, setActive] = useState('overview');
  const [notice, setNotice] = useState('');
  const [profile, setProfile] = useState(initialProfile);
  const [editForm, setEditForm] = useState(() => profileToForm(initialProfile));
  const localArtworks = useMemo(() => readLocalList('here.local.created.artworks'), []);
  const localEvents = useMemo(() => readLocalList('here.local.created.events'), []);
  const followers = useMemo(() => {
    const savedFollowers = readLocalList('here.local.followers');
    return savedFollowers.length ? savedFollowers : fallbackFollowers;
  }, []);

  const ownedArtworks = localArtworks.length ? localArtworks : artworks.filter((item) => item.localOnly);
  const ownedEvents = localEvents.length ? localEvents : events.filter((item) => item.localOnly);

  function goCreate(mode) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('here.create.intent', mode);
    }
    setPage?.('create');
  }

  function startEditProfile() {
    setEditForm(profileToForm(profile));
    setNotice('');
    setActive('edit');
  }

  function saveProfile(event) {
    event.preventDefault();

    if (!editForm.displayName.trim()) {
      setNotice('Add a profile name before saving.');
      return;
    }

    const updatedProfile = buildUpdatedProfile(profile, editForm);
    const existingProfiles = readLocalList('here.local.created.profiles').filter((item) => item.id !== updatedProfile.id);
    writeLocalList('here.local.created.profiles', [updatedProfile, ...existingProfiles]);

    try {
      window.localStorage.setItem('here.profile.ready', 'true');
    } catch {
      // Keep editing usable.
    }

    setProfile(updatedProfile);
    setNotice('Profile updated in My Account.');
    setActive('overview');
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
          <button type="button" onClick={startEditProfile}>Edit profile</button>
          <button type="button" onClick={() => goCreate('artwork')}>Add artwork/place</button>
          <button type="button" onClick={() => goCreate('event')}>Add event</button>
          <button type="button" className="secondary" onClick={() => openProfile?.(profile)}>View public profile</button>
        </div>
      </div>

      {notice && <div className="account-notice">{notice}</div>}

      <div className="account-tabs">
        {[
          ['overview', 'Overview'],
          ['edit', 'Edit profile'],
          ['artwork', 'My artwork'],
          ['events', 'My events'],
          ['followers', 'Followers'],
          ['following', 'Following'],
          ['saved', 'Saved'],
          ['settings', 'Settings'],
        ].map(([id, label]) => (
          <button className={active === id ? 'active' : ''} key={id} onClick={() => (id === 'edit' ? startEditProfile() : setActive(id))} type="button">{label}</button>
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

        {active === 'edit' && <EditProfileForm form={editForm} setForm={setEditForm} onSave={saveProfile} onCancel={() => setActive('overview')} />}

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
              {ownedEvents.map((eventItem) => (
                <button key={eventItem.id} type="button" onClick={() => openEvent?.(eventItem)}>
                  {eventItem.imageUrl || eventItem.image_url ? <img src={eventItem.imageUrl || eventItem.image_url} alt={eventItem.title} /> : <span>{initials(eventItem.title).slice(0, 1)}</span>}
                  <strong>{eventItem.title}</strong>
                  <small>{eventItem.eventType || eventItem.event_type || eventItem.venueName || 'Creative event'}</small>
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
