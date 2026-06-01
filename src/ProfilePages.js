import React, { useEffect, useMemo, useState } from 'react';

const fallbackProfiles = [
  {
    id: 'fallback-explorer',
    displayName: 'HERE Explorer',
    profileType: 'explorer',
    bio: 'A clean profile space for saving places, following creatives, and building a personal city art trail.',
    city: 'Raleigh',
    state: 'NC',
  },
];

export default function ProfilePages({ apiUrl, savedArtworks, savedCount, likedCount, visitedCount, onSelectArtwork }) {
  const [profiles, setProfiles] = useState([]);
  const [events, setEvents] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [status, setStatus] = useState('Loading profiles...');

  useEffect(() => {
    let active = true;

    async function loadProfiles() {
      try {
        const [profilesRes, eventsRes, journeysRes] = await Promise.all([
          fetch(`${apiUrl}/api/profiles`),
          fetch(`${apiUrl}/api/events`),
          fetch(`${apiUrl}/api/journeys`),
        ]);

        const [profilesData, eventsData, journeysData] = await Promise.all([
          profilesRes.json(),
          eventsRes.json(),
          journeysRes.json(),
        ]);

        if (!active) return;
        const nextProfiles = profilesData.profiles?.length ? profilesData.profiles : fallbackProfiles;
        setProfiles(nextProfiles);
        setEvents(eventsData.events || []);
        setJourneys(journeysData.journeys || []);
        setSelectedProfileId((current) => current || nextProfiles[0]?.id || '');
        setStatus('');
      } catch (error) {
        if (!active) return;
        console.warn(error);
        setProfiles(fallbackProfiles);
        setSelectedProfileId('fallback-explorer');
        setStatus('Profiles are ready, but live profile data is still loading.');
      }
    }

    loadProfiles();
    return () => {
      active = false;
    };
  }, [apiUrl]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) || profiles[0] || fallbackProfiles[0],
    [profiles, selectedProfileId]
  );

  const profileEvents = useMemo(
    () => events.filter((event) => event.hostProfileId === selectedProfile?.id || event.host_profile_id === selectedProfile?.id),
    [events, selectedProfile]
  );

  const profileJourneys = useMemo(
    () => journeys.filter((journey) => journey.curatorProfileId === selectedProfile?.id || journey.curator_profile_id === selectedProfile?.id),
    [journeys, selectedProfile]
  );

  return (
    <div className="profile-pages">
      <div className="profile-page-heading">
        <div>
          <p className="eyebrow">Profiles</p>
          <h2>Creative accounts, saved places, and your HERE trail</h2>
          <p>Simple profiles for explorers, artists, musicians, galleries, venues, collectives, and event hosts.</p>
        </div>
      </div>

      {status && <div className="notice">{status}</div>}

      <div className="profile-home-grid">
        <ExplorerCard savedCount={savedCount} likedCount={likedCount} visitedCount={visitedCount} savedArtworks={savedArtworks} onSelectArtwork={onSelectArtwork} />
        <ProfileDetail profile={selectedProfile} events={profileEvents} journeys={profileJourneys} />
      </div>

      <section className="profile-directory app-panel">
        <div className="profile-directory-header">
          <div>
            <p className="eyebrow">Creative directory</p>
            <h3>Accounts to explore</h3>
          </div>
          <span>{profiles.length} profiles</span>
        </div>
        <div className="profile-chip-row">
          {profiles.map((profile) => (
            <button
              className={selectedProfile?.id === profile.id ? 'active' : ''}
              key={profile.id}
              onClick={() => setSelectedProfileId(profile.id)}
              type="button"
            >
              <span>{getInitials(profile)}</span>
              <strong>{profile.displayName || profile.name}</strong>
              <small>{formatProfileType(profile.profileType || profile.profile_type)}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ExplorerCard({ savedCount, likedCount, visitedCount, savedArtworks, onSelectArtwork }) {
  return (
    <aside className="explorer-profile app-panel">
      <div className="profile-cover" />
      <div className="profile-avatar large">Z</div>
      <p className="eyebrow">Explorer profile</p>
      <h2>Zelipa</h2>
      <p className="profile-bio">Your personal HERE space for saving places, checking in, following creatives, and building a city art trail.</p>

      <div className="profile-stats soft">
        <span><strong>{savedCount}</strong>Saved</span>
        <span><strong>{likedCount}</strong>Liked</span>
        <span><strong>{visitedCount}</strong>Check-ins</span>
      </div>

      <div className="profile-action-row">
        <button type="button">Edit profile</button>
        <button type="button">Share</button>
      </div>

      <div className="saved-mini-list">
        <div className="mini-list-heading">
          <strong>Saved places</strong>
          <span>{savedArtworks.length}</span>
        </div>
        {savedArtworks.length > 0 ? (
          savedArtworks.slice(0, 3).map((artwork) => (
            <button key={artwork.id} onClick={() => onSelectArtwork(artwork)} type="button">
              <strong>{artwork.title}</strong>
              <span>{artwork.address || artwork.neighborhood}</span>
            </button>
          ))
        ) : (
          <p className="muted">Save artwork, events, and journeys to build your personal city guide.</p>
        )}
      </div>
    </aside>
  );
}

function ProfileDetail({ profile, events, journeys }) {
  const displayName = profile.displayName || profile.display_name || profile.name || 'Creative profile';
  const profileType = formatProfileType(profile.profileType || profile.profile_type || 'Creative');
  const cityState = [profile.city, profile.state].filter(Boolean).join(', ');
  const website = profile.website || profile.websiteUrl || profile.website_url;

  return (
    <article className="creator-profile app-panel">
      <div className="creator-profile-top">
        <div className="profile-avatar">{getInitials(profile)}</div>
        <div>
          <p className="eyebrow">{profileType}</p>
          <h2>{displayName}</h2>
          {cityState && <p className="profile-location">{cityState}</p>}
        </div>
      </div>

      <p className="profile-bio">{profile.bio || 'This profile is where a creative account can show their work, events, city, and links.'}</p>

      <div className="creator-actions">
        <button type="button">Follow</button>
        <button type="button">Save</button>
        <button type="button">Share</button>
        {website && <a href={website} target="_blank" rel="noreferrer">Website</a>}
      </div>

      <div className="creator-summary-row">
        <span><strong>{events.length}</strong>Events</span>
        <span><strong>{journeys.length}</strong>Journeys</span>
        <span><strong>{profile.isVerified ? 'Yes' : 'Soon'}</strong>Verified</span>
      </div>

      <div className="creator-content-grid">
        <ContentPanel title="Posted events" empty="Events from this account will appear here." items={events} render={(event) => (
          <MiniContentCard key={event.id} label={event.eventType || 'Event'} title={event.title} body={event.venueName || event.address || 'Event details coming soon.'} />
        )} />
        <ContentPanel title="Curated journeys" empty="Curated trails and city guides will appear here." items={journeys} render={(journey) => (
          <MiniContentCard key={journey.id} label={journey.city || 'Journey'} title={journey.title} body={journey.description || 'Journey details coming soon.'} />
        )} />
      </div>
    </article>
  );
}

function ContentPanel({ title, empty, items, render }) {
  return (
    <section className="creator-content-panel">
      <h3>{title}</h3>
      {items.length > 0 ? items.slice(0, 3).map(render) : <p className="muted">{empty}</p>}
    </section>
  );
}

function MiniContentCard({ label, title, body }) {
  return (
    <div className="mini-content-card">
      <span>{label}</span>
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function getInitials(profile) {
  const name = profile?.displayName || profile?.display_name || profile?.name || 'HERE';
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'H';
}

function formatProfileType(type = '') {
  return String(type).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
