import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_API_URL = 'https://here-art-backend-production.up.railway.app';
const DEFAULT_CENTER = { lat: 35.7796, lng: -78.6382 };

const artImages = [
  'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
];

const peopleImages = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
];

const fallbackArtworks = [
  { id: 'placeholder-1', title: 'Reflections', artist: 'Local muralist', description: 'A gallery-style placeholder for the HERE visual experience.', address: 'Brick Lane, London', neighborhood: 'Brick Lane', category: 'Mural', lat: 35.7796, lng: -78.6382, imageUrl: artImages[0] },
  { id: 'placeholder-2', title: 'Silent Witness', artist: 'Street artist', description: 'A quiet public artwork moment that invites people to slow down and notice the city.', address: 'Shoreditch, London', neighborhood: 'Shoreditch', category: 'Street Art', lat: 35.7774, lng: -78.6357, imageUrl: artImages[1] },
  { id: 'placeholder-3', title: 'Urban Bloom', artist: 'Independent artist', description: 'A bright city artwork used as a visual placeholder while HERE content grows.', address: 'Warehouse District', neighborhood: 'Warehouse', category: 'Installation', lat: 35.7758, lng: -78.6464, imageUrl: artImages[2] },
];

function normalizeArtwork(item, index) {
  const lat = Number(item.lat ?? item.latitude ?? item.location_lat ?? item.location?.lat);
  const lng = Number(item.lng ?? item.longitude ?? item.location_lng ?? item.location?.lng);
  return {
    id: item.id ?? item._id ?? `artwork-${index}`,
    title: item.title || item.name || 'Untitled artwork',
    artist: item.artist || item.artist_name || 'Artist unknown',
    description: item.description || item.notes || '',
    address: item.address || item.location_name || item.location || '',
    imageUrl: item.imageUrl || item.image_url || item.photoUrl || item.photo_url || artImages[index % artImages.length],
    category: item.category || 'Mural',
    neighborhood: item.neighborhood || item.area || 'Nearby',
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
}

function normalizeProfile(item, index) {
  return {
    id: item.id || `profile-${index}`,
    displayName: item.displayName || item.display_name || item.name || 'Creative profile',
    handle: item.handle || item.username || '',
    profileType: item.profileType || item.profile_type || 'artist',
    bio: item.bio || 'A creative account on HERE.',
    city: item.city || 'Raleigh',
    state: item.state || 'NC',
    website: item.website || item.websiteUrl || item.website_url || '',
    imageUrl: item.imageUrl || item.image_url || peopleImages[index % peopleImages.length],
  };
}

function normalizeEvent(item, index) {
  return {
    id: item.id || `event-${index}`,
    title: item.title || 'Creative event',
    eventType: item.eventType || item.event_type || 'Event',
    description: item.description || 'Event details coming soon.',
    venueName: item.venueName || item.venue_name || '',
    address: item.address || '',
    city: item.city || 'Raleigh',
    state: item.state || 'NC',
    latitude: Number(item.latitude ?? item.lat),
    longitude: Number(item.longitude ?? item.lng),
    startsAt: item.startsAt || item.starts_at || '',
    endsAt: item.endsAt || item.ends_at || '',
    priceLabel: item.priceLabel || item.price_label || '',
    hostProfileId: item.hostProfileId || item.host_profile_id || null,
    imageUrl: item.imageUrl || item.image_url || artImages[(index + 1) % artImages.length],
    ticketUrl: item.ticketUrl || item.ticket_url || item.websiteUrl || item.website_url || '',
  };
}

function normalizeJourney(item, index) {
  return {
    id: item.id || `journey-${index}`,
    title: item.title || 'Creative journey',
    description: item.description || 'A curated HERE journey.',
    city: item.city || 'Raleigh',
    state: item.state || 'NC',
    curatorProfileId: item.curatorProfileId || item.curator_profile_id || null,
    imageUrl: item.imageUrl || item.image_url || artImages[(index + 2) % artImages.length],
  };
}

function formatDate(value) {
  if (!value) return 'Date coming soon';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date coming soon';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(startValue, endValue) {
  if (!startValue) return 'Time coming soon';
  const start = new Date(startValue);
  const end = endValue ? new Date(endValue) : null;
  if (Number.isNaN(start.getTime())) return 'Time coming soon';
  const startText = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const endText = end && !Number.isNaN(end.getTime()) ? end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
  return endText ? `${startText} - ${endText}` : startText;
}

function mapsUrl(item) {
  const lat = item?.lat ?? item?.latitude;
  const lng = item?.lng ?? item?.longitude;
  if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  if (item?.address || item?.venueName) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address || item.venueName)}`;
  return '';
}

function getInitials(value = 'HERE') {
  return String(value).split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'H';
}

function profileTypeLabel(value = '') {
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function App() {
  const apiUrl = useMemo(() => (process.env.REACT_APP_API_URL || DEFAULT_API_URL).replace(/\/$/, ''), []);
  const [activePage, setActivePage] = useState('discover');
  const [artworks, setArtworks] = useState(fallbackArtworks);
  const [profiles, setProfiles] = useState([]);
  const [events, setEvents] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [selectedArtworkId, setSelectedArtworkId] = useState(fallbackArtworks[0].id);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [visitedIds, setVisitedIds] = useState(() => new Set());
  const [notice, setNotice] = useState('');
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerLayerRef = useRef(null);

  const selectedArtwork = useMemo(() => artworks.find((item) => item.id === selectedArtworkId) || artworks[0] || fallbackArtworks[0], [artworks, selectedArtworkId]);
  const selectedEvent = useMemo(() => events.find((item) => item.id === selectedEventId) || events[0] || null, [events, selectedEventId]);
  const selectedProfile = useMemo(() => profiles.find((item) => item.id === selectedProfileId) || profiles[0] || null, [profiles, selectedProfileId]);
  const selectedEventHost = useMemo(() => profiles.find((profile) => profile.id === selectedEvent?.hostProfileId) || profiles[0] || null, [profiles, selectedEvent]);
  const profileEvents = useMemo(() => events.filter((event) => event.hostProfileId === selectedProfile?.id), [events, selectedProfile]);
  const profileJourneys = useMemo(() => journeys.filter((journey) => journey.curatorProfileId === selectedProfile?.id), [journeys, selectedProfile]);
  const savedArtworks = useMemo(() => artworks.filter((item) => savedIds.has(item.id)), [artworks, savedIds]);
  const savedEvents = useMemo(() => events.filter((item) => savedIds.has(item.id)), [events, savedIds]);
  const likedArtworks = useMemo(() => artworks.filter((item) => likedIds.has(item.id)), [artworks, likedIds]);
  const checkIns = useMemo(() => artworks.filter((item) => visitedIds.has(item.id)), [artworks, visitedIds]);

  const updateSet = (setter, id) => setter((current) => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const loadData = useCallback(async () => {
    try {
      const [artworksRes, profilesRes, eventsRes, journeysRes] = await Promise.all([
        fetch(`${apiUrl}/api/artworks`),
        fetch(`${apiUrl}/api/profiles`),
        fetch(`${apiUrl}/api/events`),
        fetch(`${apiUrl}/api/journeys`),
      ]);
      const [artworksData, profilesData, eventsData, journeysData] = await Promise.all([
        artworksRes.json(),
        profilesRes.json(),
        eventsRes.json(),
        journeysRes.json(),
      ]);
      const nextArtworks = (artworksData.artworks || artworksData.data || []).map(normalizeArtwork).filter((item) => item.lat && item.lng);
      const nextProfiles = (profilesData.profiles || profilesData.data || []).map(normalizeProfile);
      const nextEvents = (eventsData.events || eventsData.data || []).map(normalizeEvent);
      const nextJourneys = (journeysData.journeys || journeysData.data || []).map(normalizeJourney);
      setArtworks(nextArtworks.length ? nextArtworks : fallbackArtworks);
      setProfiles(nextProfiles);
      setEvents(nextEvents);
      setJourneys(nextJourneys);
      setSelectedArtworkId((current) => current || nextArtworks[0]?.id || fallbackArtworks[0].id);
      setSelectedEventId((current) => current || nextEvents[0]?.id || '');
      setSelectedProfileId((current) => current || nextProfiles[0]?.id || '');
      setNotice('');
    } catch (error) {
      console.warn(error);
      setNotice('Showing design-ready placeholder content while live content loads.');
    }
  }, [apiUrl]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (activePage !== 'map' || !window.L || !mapContainerRef.current) return;
    if (!mapRef.current) {
      mapRef.current = window.L.map(mapContainerRef.current, { zoomControl: false, scrollWheelZoom: true }).setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 13);
      window.L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(mapRef.current);
      markerLayerRef.current = window.L.layerGroup().addTo(mapRef.current);
    }
    window.setTimeout(() => mapRef.current?.invalidateSize(true), 100);
    window.setTimeout(() => mapRef.current?.invalidateSize(true), 500);
  }, [activePage]);

  useEffect(() => {
    if (activePage !== 'map' || !window.L || !mapRef.current || !markerLayerRef.current) return;
    markerLayerRef.current.clearLayers();
    artworks.filter((item) => item.lat && item.lng).forEach((artwork) => {
      const marker = window.L.marker([artwork.lat, artwork.lng], {
        icon: window.L.divIcon({
          className: `here-map-pin ${artwork.id === selectedArtwork.id ? 'selected' : ''}`,
          html: artwork.imageUrl ? `<span style="background-image:url('${artwork.imageUrl.replace(/'/g, '')}')"></span>` : `<span>${getInitials(artwork.title).slice(0, 1)}</span>`,
          iconSize: [42, 42],
          iconAnchor: [21, 21],
        }),
      }).addTo(markerLayerRef.current);
      marker.on('click', () => setSelectedArtworkId(artwork.id));
    });
    if (selectedArtwork.lat && selectedArtwork.lng) mapRef.current.setView([selectedArtwork.lat, selectedArtwork.lng], 14, { animate: true });
  }, [activePage, artworks, selectedArtwork]);

  const goToEvent = (event) => {
    setSelectedEventId(event.id);
    setActivePage('events');
  };

  const goToProfile = (profile) => {
    if (!profile) return;
    setSelectedProfileId(profile.id);
    setActivePage('profile');
  };

  const goToArtwork = (artwork) => {
    setSelectedArtworkId(artwork.id);
    setActivePage('map');
  };

  return (
    <div className="here-app-shell">
      <AppHeader activePage={activePage} setActivePage={setActivePage} />
      {notice && <div className="app-notice">{notice}</div>}
      <main className="app-page-wrap">
        {activePage === 'discover' && <DiscoverPage artworks={artworks} events={events} featuredArtwork={selectedArtwork} savedIds={savedIds} likedIds={likedIds} onSave={(id) => updateSet(setSavedIds, id)} onLike={(id) => updateSet(setLikedIds, id)} onArtwork={goToArtwork} onEvent={goToEvent} />}
        {activePage === 'map' && <MapPage mapContainerRef={mapContainerRef} artworks={artworks} selectedArtwork={selectedArtwork} saved={savedIds.has(selectedArtwork.id)} visited={visitedIds.has(selectedArtwork.id)} onArtwork={(artwork) => setSelectedArtworkId(artwork.id)} onSave={() => updateSet(setSavedIds, selectedArtwork.id)} onCheckIn={() => updateSet(setVisitedIds, selectedArtwork.id)} />}
        {activePage === 'events' && <EventsPage event={selectedEvent} host={selectedEventHost} events={events} saved={selectedEvent ? savedIds.has(selectedEvent.id) : false} onSave={() => selectedEvent && updateSet(setSavedIds, selectedEvent.id)} onEvent={goToEvent} onProfile={goToProfile} />}
        {activePage === 'profile' && <ProfilePage profile={selectedProfile} profiles={profiles} artworks={artworks} events={profileEvents} journeys={profileJourneys} onProfile={goToProfile} />}
        {activePage === 'saved' && <SavedPage savedArtworks={savedArtworks} savedEvents={savedEvents} likedArtworks={likedArtworks} checkIns={checkIns} profiles={profiles} onArtwork={goToArtwork} onEvent={goToEvent} />}
      </main>
      <BottomNav activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
}

function AppHeader({ activePage, setActivePage }) {
  return (
    <header className="here-app-header">
      <button className="here-brand" onClick={() => setActivePage('discover')} type="button"><span>H</span><strong>HERE</strong></button>
      <p>Your city. Your art. Your HERE.</p>
      <nav className="desktop-nav">
        {['discover', 'map', 'events', 'saved', 'profile'].map((page) => <button className={activePage === page ? 'active' : ''} key={page} onClick={() => setActivePage(page)} type="button">{page === 'discover' ? 'Discover' : page === 'saved' ? 'My Space' : page[0].toUpperCase() + page.slice(1)}</button>)}
      </nav>
    </header>
  );
}

function DiscoverPage({ artworks, events, featuredArtwork, savedIds, likedIds, onSave, onLike, onArtwork, onEvent }) {
  return (
    <section className="page discover-page">
      <div className="discover-hero">
        <p className="small-kicker">Good morning, Alex</p>
        <h1>Find art<br />where you are</h1>
        <SearchBar text="Search for art, places, artists, events..." />
        <FeatureArtwork artwork={featuredArtwork} onClick={() => onArtwork(featuredArtwork)} />
      </div>
      <div className="discover-sidebar">
        <SectionHeader title="Explore by category" action="View all" />
        <div className="category-grid-real">
          {['Murals', 'Galleries', 'Events', 'Hidden Gems'].map((item, index) => <button key={item} type="button"><ImageTile item={{ imageUrl: artImages[index + 1], title: item }} /><span>{item}</span></button>)}
        </div>
        <SectionHeader title="Featured this week" action="See more" />
        <div className="content-grid three">
          {(events.length ? events : []).slice(0, 3).map((event) => <EventCard key={event.id} event={event} onClick={() => onEvent(event)} />)}
          {events.length === 0 && artworks.slice(0, 3).map((artwork) => <ArtworkCard key={artwork.id} artwork={artwork} saved={savedIds.has(artwork.id)} liked={likedIds.has(artwork.id)} onSave={() => onSave(artwork.id)} onLike={() => onLike(artwork.id)} onClick={() => onArtwork(artwork)} />)}
        </div>
        <SectionHeader title="Near you" action="See map" />
        <div className="content-grid three">
          {artworks.slice(0, 3).map((artwork) => <ArtworkCard key={artwork.id} artwork={artwork} saved={savedIds.has(artwork.id)} liked={likedIds.has(artwork.id)} onSave={() => onSave(artwork.id)} onLike={() => onLike(artwork.id)} onClick={() => onArtwork(artwork)} />)}
        </div>
      </div>
    </section>
  );
}

function MapPage({ mapContainerRef, artworks, selectedArtwork, saved, visited, onArtwork, onSave, onCheckIn }) {
  const url = mapsUrl(selectedArtwork);
  return (
    <section className="page map-page">
      <div className="page-title-row"><h1>Map</h1><SearchBar text="Search this area" /></div>
      <div className="map-grid">
        <div className="map-canvas" ref={mapContainerRef} role="application" aria-label="HERE map" />
        <aside className="selected-place-card">
          <ImageTile item={selectedArtwork} />
          <p className="label">Selected place</p>
          <h2>{selectedArtwork.title}</h2>
          <p>{selectedArtwork.description}</p>
          <span>{selectedArtwork.address || selectedArtwork.neighborhood}</span>
          <div className="button-row"><button className={saved ? 'active' : ''} onClick={onSave} type="button">Save place</button><button className={visited ? 'active' : ''} onClick={onCheckIn} type="button">Check in</button>{url && <a href={url} target="_blank" rel="noreferrer">Open location</a>}</div>
          <SectionHeader title="Nearby creative places" />
          <div className="mini-list">{artworks.slice(0, 5).map((artwork) => <button className={artwork.id === selectedArtwork.id ? 'active' : ''} onClick={() => onArtwork(artwork)} key={artwork.id} type="button"><ImageTile item={artwork} /><span><strong>{artwork.title}</strong><small>{artwork.neighborhood || artwork.address}</small></span></button>)}</div>
        </aside>
      </div>
    </section>
  );
}

function EventsPage({ event, host, events, saved, onSave, onEvent, onProfile }) {
  if (!event) return <EmptyPage title="Events" text="Creative events will appear here." />;
  const url = mapsUrl(event);
  return (
    <section className="page event-page">
      <div className="event-main-image"><ImageTile item={event} /></div>
      <article className="event-detail-panel">
        <p className="label">{event.eventType}</p>
        <h1>{event.title}</h1>
        <InfoLine label={formatDate(event.startsAt)} />
        <InfoLine label={formatTime(event.startsAt, event.endsAt)} />
        <InfoLine label={event.venueName || event.address || [event.city, event.state].filter(Boolean).join(', ')} action={url ? <a href={url} target="_blank" rel="noreferrer">Open in Maps</a> : null} />
        <p>{event.description}</p>
        <button className="host-strip-real" onClick={() => onProfile(host)} type="button"><Avatar profile={host} /><span><strong>{host?.displayName || 'Host profile'}</strong><small>{profileTypeLabel(host?.profileType || 'Creative host')}</small></span><em>View profile</em></button>
        <div className="button-row"><button className={saved ? 'active' : ''} onClick={onSave} type="button">Save</button>{url && <a href={url} target="_blank" rel="noreferrer">Open location</a>}{event.ticketUrl && <a href={event.ticketUrl} target="_blank" rel="noreferrer">Website</a>}</div>
      </article>
      <section className="full-row"><SectionHeader title="More events" action="See all" /><div className="content-grid three">{events.filter((item) => item.id !== event.id).slice(0, 3).map((item) => <EventCard key={item.id} event={item} onClick={() => onEvent(item)} />)}</div></section>
    </section>
  );
}

function ProfilePage({ profile, profiles, artworks, events, journeys, onProfile }) {
  if (!profile) return <EmptyPage title="Profile" text="Creative profiles will appear here." />;
  return (
    <section className="page profile-page">
      <aside className="profile-info-panel">
        <div className="profile-head-real"><Avatar profile={profile} large /><div><h1>{profile.displayName}</h1><p>{profile.handle ? `@${profile.handle}` : profileTypeLabel(profile.profileType)}</p><span>{[profile.city, profile.state].filter(Boolean).join(', ')}</span>{profile.website && <a href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a>}</div></div>
        <div className="stats-grid"><span><strong>{artworks.length}</strong>Artworks</span><span><strong>{events.length}</strong>Events</span><span><strong>{journeys.length}</strong>Journeys</span><span><strong>1.2K</strong>Followers</span></div>
        <div className="button-row"><button type="button">Follow</button><button type="button">Message</button></div>
        <p>{profile.bio}</p>
      </aside>
      <div className="profile-gallery-panel">
        <div className="tabs-real"><button className="active" type="button">Artworks</button><button type="button">Events</button><button type="button">Journeys</button></div>
        <div className="profile-art-grid-real">{artworks.slice(0, 6).map((artwork) => <ImageTile key={artwork.id} item={artwork} />)}</div>
      </div>
      <section className="full-row"><SectionHeader title="More creators" /><div className="creator-row">{profiles.filter((item) => item.id !== profile.id).slice(0, 5).map((item) => <button key={item.id} onClick={() => onProfile(item)} type="button"><Avatar profile={item} /><span>{item.displayName}</span></button>)}</div></section>
    </section>
  );
}

function SavedPage({ savedArtworks, savedEvents, likedArtworks, checkIns, profiles, onArtwork, onEvent }) {
  return (
    <section className="page saved-page">
      <div className="page-title-row"><h1>My Space</h1><p>Your saved places, liked art, and check-ins in one place.</p></div>
      <SavedSection title="Saved Places" empty="Save places from Discover or Map and they will appear here." items={savedArtworks} render={(artwork) => <SavedTile key={artwork.id} item={artwork} onClick={() => onArtwork(artwork)} />} />
      <SavedSection title="Saved Events" empty="Saved creative events will appear here." items={savedEvents} render={(event) => <SavedTile key={event.id} item={event} onClick={() => onEvent(event)} />} />
      <SavedSection title="Liked Art" empty="Liked artwork will appear here." items={likedArtworks} render={(artwork) => <SavedTile key={artwork.id} item={artwork} onClick={() => onArtwork(artwork)} />} />
      <section className="saved-section"><SectionHeader title="Following" action="See all" /><div className="creator-row">{profiles.slice(0, 5).map((profile) => <button key={profile.id} type="button"><Avatar profile={profile} /><span>{profile.displayName}</span></button>)}</div></section>
      <SavedSection title="My Check-ins" empty="Check in at places you visit to build your memory trail." items={checkIns} render={(artwork) => <SavedTile key={artwork.id} item={artwork} onClick={() => onArtwork(artwork)} />} />
    </section>
  );
}

function BottomNav({ activePage, setActivePage }) {
  const items = [['discover', 'Discover'], ['map', 'Map'], ['events', 'Events'], ['saved', 'Saved'], ['profile', 'Profile']];
  return <nav className="bottom-app-nav">{items.map(([page, label]) => <button className={activePage === page ? 'active' : ''} onClick={() => setActivePage(page)} key={page} type="button"><span>{label[0]}</span>{label}</button>)}</nav>;
}

function SearchBar({ text }) { return <div className="search-real"><span>⌕</span><input value="" readOnly placeholder={text} /></div>; }
function SectionHeader({ title, action }) { return <div className="section-header-real"><strong>{title}</strong>{action && <button type="button">{action}</button>}</div>; }
function FeatureArtwork({ artwork, onClick }) { return <button className="feature-real" onClick={onClick} type="button"><ImageTile item={artwork} /><div><span>Featured Artwork</span><strong>{artwork.title}</strong><small>{artwork.address || artwork.neighborhood}</small></div><em>0.4 km</em></button>; }
function ImageTile({ item }) { return item?.imageUrl ? <img className="image-tile" src={item.imageUrl} alt={item.title || 'HERE artwork'} /> : <div className="image-tile placeholder">{getInitials(item?.title || 'H').slice(0, 1)}</div>; }
function ArtworkCard({ artwork, saved, liked, onSave, onLike, onClick }) { return <article className="content-card"><button onClick={onClick} type="button"><ImageTile item={artwork} /><strong>{artwork.title}</strong><small>{artwork.neighborhood || artwork.address}</small></button><div><button className={saved ? 'active' : ''} onClick={onSave} type="button">Save</button><button className={liked ? 'active' : ''} onClick={onLike} type="button">Like</button></div></article>; }
function EventCard({ event, onClick }) { return <button className="content-card event-card" onClick={onClick} type="button"><ImageTile item={event} /><strong>{event.title}</strong><small>{event.venueName || [event.city, event.state].filter(Boolean).join(', ')}</small></button>; }
function InfoLine({ label, action }) { return <div className="info-real"><span>●</span><strong>{label}</strong>{action}</div>; }
function Avatar({ profile, large }) { const src = profile?.imageUrl; return src ? <img className={`avatar-real ${large ? 'large' : ''}`} src={src} alt={profile?.displayName || 'Profile'} /> : <span className={`avatar-real ${large ? 'large' : ''}`}>{getInitials(profile?.displayName || 'H')}</span>; }
function SavedSection({ title, empty, items, render }) { return <section className="saved-section"><SectionHeader title={title} action="See all" />{items.length ? <div className="content-grid three">{items.map(render)}</div> : <p className="empty-text">{empty}</p>}</section>; }
function SavedTile({ item, onClick }) { return <button className="saved-tile-real" onClick={onClick} type="button"><ImageTile item={item} /><strong>{item.title}</strong><span>{item.address || item.venueName || item.neighborhood}</span></button>; }
function EmptyPage({ title, text }) { return <section className="page empty-page"><h1>{title}</h1><p>{text}</p></section>; }
