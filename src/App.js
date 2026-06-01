import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_CENTER = { lat: 35.7796, lng: -78.6382 };
const DEFAULT_API_URL = 'https://here-art-backend-production.up.railway.app';
const CATEGORIES = ['All', 'Murals', 'Galleries', 'Events', 'Hidden Gems'];

const SAMPLE_ARTWORKS = [
  { id: 'sample-raleigh-mural', title: 'Color Story Wall', artist: 'Local muralist', description: 'A bright public wall that turns an ordinary street corner into a place people stop, photograph, and remember.', address: 'Downtown Raleigh, NC', imageUrl: '', lat: 35.7796, lng: -78.6382, category: 'Mural', neighborhood: 'Downtown' },
  { id: 'sample-gallery-corner', title: 'Quiet Gallery Corner', artist: 'Independent artists', description: 'A small art stop for exhibitions, community shows, and local creative gatherings.', address: 'Warehouse District, Raleigh, NC', imageUrl: '', lat: 35.7758, lng: -78.6464, category: 'Gallery', neighborhood: 'Warehouse District' },
  { id: 'sample-hidden-passage', title: 'Hidden Color Passage', artist: 'Unknown artist', description: 'A tucked-away creative place HERE is built to help people discover and preserve.', address: 'Near Moore Square, Raleigh, NC', imageUrl: '', lat: 35.7774, lng: -78.6357, category: 'Street Art', neighborhood: 'Moore Square' },
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
    imageUrl: item.imageUrl || item.image_url || item.photoUrl || item.photo_url || '',
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
    country: item.country || 'United States',
    website: item.website || item.websiteUrl || item.website_url || '',
    instagram: item.instagram || '',
    imageUrl: item.imageUrl || item.image_url || item.avatarUrl || item.avatar_url || '',
    isVerified: Boolean(item.isVerified || item.is_verified),
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
    imageUrl: item.imageUrl || item.image_url || '',
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
    imageUrl: item.imageUrl || item.image_url || '',
  };
}

function formatProfileType(type = '') {
  return String(type).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(name = 'HERE') {
  return String(name).split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'H';
}

function formatEventDate(value) {
  if (!value) return 'Date coming soon';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date coming soon';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatEventTime(startValue, endValue) {
  if (!startValue) return 'Time coming soon';
  const start = new Date(startValue);
  const end = endValue ? new Date(endValue) : null;
  if (Number.isNaN(start.getTime())) return 'Time coming soon';
  const startTime = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const endTime = end && !Number.isNaN(end.getTime()) ? end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
  return endTime ? `${startTime} - ${endTime}` : startTime;
}

function mapsUrlFor(item) {
  const lat = item?.lat ?? item?.latitude;
  const lng = item?.lng ?? item?.longitude;
  if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  }
  if (item?.address || item?.venueName) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address || item.venueName)}`;
  }
  return '';
}

export default function App() {
  const apiUrl = useMemo(() => (process.env.REACT_APP_API_URL || DEFAULT_API_URL).replace(/\/$/, ''), []);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const mapContainerRef = useRef(null);

  const [activeSection, setActiveSection] = useState('discover');
  const [artworks, setArtworks] = useState(SAMPLE_ARTWORKS);
  const [profiles, setProfiles] = useState([]);
  const [events, setEvents] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [selectedArtwork, setSelectedArtwork] = useState(SAMPLE_ARTWORKS[0]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [visitedIds, setVisitedIds] = useState(() => new Set());
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const positionedArtworks = useMemo(() => artworks.filter((artwork) => Number.isFinite(artwork.lat) && Number.isFinite(artwork.lng)), [artworks]);
  const featuredArtwork = selectedArtwork || positionedArtworks[0] || SAMPLE_ARTWORKS[0];
  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId) || events[0] || null, [events, selectedEventId]);
  const selectedProfile = useMemo(() => profiles.find((profile) => profile.id === selectedProfileId) || profiles[0] || null, [profiles, selectedProfileId]);
  const eventHost = useMemo(() => selectedEvent ? profiles.find((profile) => profile.id === selectedEvent.hostProfileId) : null, [selectedEvent, profiles]);
  const savedArtworks = useMemo(() => artworks.filter((artwork) => savedIds.has(artwork.id)), [artworks, savedIds]);
  const savedEvents = useMemo(() => events.filter((event) => savedIds.has(event.id)), [events, savedIds]);

  const refreshMapSize = useCallback(() => {
    const refresh = () => {
      if (mapRef.current) mapRef.current.invalidateSize(true);
    };
    window.requestAnimationFrame(refresh);
    window.setTimeout(refresh, 220);
    window.setTimeout(refresh, 700);
  }, []);

  const updateSet = (setter, id) => setter((current) => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
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

      const nextArtworks = (artworksData.artworks || artworksData.data || []).map(normalizeArtwork).filter((artwork) => artwork.lat && artwork.lng);
      const nextProfiles = (profilesData.profiles || profilesData.data || []).map(normalizeProfile);
      const nextEvents = (eventsData.events || eventsData.data || []).map(normalizeEvent);
      const nextJourneys = (journeysData.journeys || journeysData.data || []).map(normalizeJourney);

      setArtworks(nextArtworks.length ? nextArtworks : SAMPLE_ARTWORKS);
      setProfiles(nextProfiles);
      setEvents(nextEvents);
      setJourneys(nextJourneys);
      setSelectedArtwork((current) => current || nextArtworks[0] || SAMPLE_ARTWORKS[0]);
      setSelectedEventId((current) => current || nextEvents[0]?.id || '');
      setSelectedProfileId((current) => current || nextProfiles[0]?.id || '');
      setIsLoading(false);
      refreshMapSize();
    } catch (loadError) {
      console.warn(loadError);
      setArtworks(SAMPLE_ARTWORKS);
      setIsLoading(false);
      setError('Live content is taking a moment to load, so HERE is showing starter content.');
    }
  }, [apiUrl, refreshMapSize]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    window.addEventListener('resize', refreshMapSize);
    window.addEventListener('orientationchange', refreshMapSize);
    return () => {
      window.removeEventListener('resize', refreshMapSize);
      window.removeEventListener('orientationchange', refreshMapSize);
    };
  }, [refreshMapSize]);

  useEffect(() => {
    if (activeSection !== 'map' || !window.L || !mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = window.L.map(mapContainerRef.current, {
        zoomControl: false,
        scrollWheelZoom: true,
        preferCanvas: true,
      }).setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 13);

      window.L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);

      markerLayerRef.current = window.L.layerGroup().addTo(mapRef.current);
    }

    refreshMapSize();
  }, [activeSection, refreshMapSize]);

  useEffect(() => {
    if (activeSection !== 'map' || !window.L || !mapRef.current || !markerLayerRef.current) return;
    markerLayerRef.current.clearLayers();

    positionedArtworks.forEach((artwork) => {
      const marker = window.L.marker([artwork.lat, artwork.lng], {
        icon: window.L.divIcon({
          className: `redesign-map-pin ${featuredArtwork?.id === artwork.id ? 'selected' : ''}`,
          html: artwork.imageUrl ? `<span style="background-image:url('${artwork.imageUrl.replace(/'/g, '')}')"></span>` : `<span>${getInitials(artwork.title).slice(0, 1)}</span>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        }),
      }).addTo(markerLayerRef.current);
      marker.on('click', () => setSelectedArtwork(artwork));
    });

    if (featuredArtwork?.lat && featuredArtwork?.lng) {
      mapRef.current.setView([featuredArtwork.lat, featuredArtwork.lng], 14, { animate: true });
    }
    refreshMapSize();
  }, [activeSection, positionedArtworks, featuredArtwork, refreshMapSize]);

  const openEvent = (event) => {
    setSelectedEventId(event.id);
    setActiveSection('events');
  };

  const openProfile = (profile) => {
    if (!profile) return;
    setSelectedProfileId(profile.id);
    setActiveSection('profile');
  };

  return (
    <div className="here-redesign-shell">
      <header className="redesign-brand-bar">
        <button className="redesign-brand" onClick={() => setActiveSection('discover')} type="button"><span>H</span><strong>HERE</strong></button>
        <p>Your city. Your art. Your HERE.</p>
      </header>

      {error && <div className="redesign-notice">{error}</div>}
      {status && <div className="redesign-notice">{status}</div>}

      <main className="redesign-phone-stage">
        <section className={`redesign-screen ${activeSection === 'discover' ? 'is-active' : ''}`}>
          <DiscoverScreen
            artworks={artworks}
            events={events}
            featuredArtwork={featuredArtwork}
            isLoading={isLoading}
            savedIds={savedIds}
            onSave={(id) => updateSet(setSavedIds, id)}
            onOpenArtwork={(artwork) => { setSelectedArtwork(artwork); setActiveSection('map'); }}
            onOpenEvent={openEvent}
            onRefresh={loadData}
          />
        </section>

        <section className={`redesign-screen ${activeSection === 'map' ? 'is-active' : ''}`}>
          <MapScreen
            mapContainerRef={mapContainerRef}
            selectedArtwork={featuredArtwork}
            artworks={positionedArtworks}
            saved={savedIds.has(featuredArtwork.id)}
            onSave={() => updateSet(setSavedIds, featuredArtwork.id)}
          />
        </section>

        <section className={`redesign-screen ${activeSection === 'events' ? 'is-active' : ''}`}>
          <EventScreen
            event={selectedEvent}
            host={eventHost}
            events={events}
            saved={selectedEvent ? savedIds.has(selectedEvent.id) : false}
            onSave={() => selectedEvent && updateSet(setSavedIds, selectedEvent.id)}
            onOpenEvent={openEvent}
            onOpenProfile={openProfile}
          />
        </section>

        <section className={`redesign-screen ${activeSection === 'profile' ? 'is-active' : ''}`}>
          <ProfileScreen
            profile={selectedProfile}
            profiles={profiles}
            events={events.filter((event) => event.hostProfileId === selectedProfile?.id)}
            journeys={journeys.filter((journey) => journey.curatorProfileId === selectedProfile?.id)}
            artworks={artworks}
            onOpenProfile={openProfile}
          />
        </section>

        <section className={`redesign-screen ${activeSection === 'saved' ? 'is-active' : ''}`}>
          <SavedScreen
            savedArtworks={savedArtworks}
            savedEvents={savedEvents}
            likedArtworks={artworks.filter((artwork) => likedIds.has(artwork.id))}
            checkIns={artworks.filter((artwork) => visitedIds.has(artwork.id))}
            profiles={profiles}
            onOpenArtwork={(artwork) => { setSelectedArtwork(artwork); setActiveSection('map'); }}
            onOpenEvent={openEvent}
          />
        </section>
      </main>

      <nav className="redesign-bottom-nav" aria-label="HERE app navigation">
        <NavButton label="Discover" section="discover" activeSection={activeSection} onClick={setActiveSection} />
        <NavButton label="Map" section="map" activeSection={activeSection} onClick={setActiveSection} />
        <NavButton label="Events" section="events" activeSection={activeSection} onClick={setActiveSection} />
        <NavButton label="Saved" section="saved" activeSection={activeSection} onClick={setActiveSection} />
        <NavButton label="Profile" section="profile" activeSection={activeSection} onClick={setActiveSection} />
      </nav>
    </div>
  );
}

function NavButton({ label, section, activeSection, onClick }) {
  return <button className={activeSection === section ? 'active' : ''} onClick={() => onClick(section)} type="button"><span>{getInitials(label).slice(0, 1)}</span>{label}</button>;
}

function DiscoverScreen({ artworks, events, featuredArtwork, isLoading, savedIds, onSave, onOpenArtwork, onOpenEvent, onRefresh }) {
  const nearYou = artworks.slice(0, 4);
  return (
    <div className="redesign-mobile-screen discover-flow">
      <ScreenTopBar title="HERE" right={<><button type="button" onClick={onRefresh}>↻</button><span className="tiny-avatar">Z</span></>} />
      <p className="redesign-greeting">Good morning, Alex</p>
      <h1>Find art<br />where you are</h1>
      <SearchBar placeholder="Search for art, places, artists, events..." />
      {isLoading && <p className="redesign-muted">Loading nearby creative places...</p>}
      <button className="feature-art-card" onClick={() => onOpenArtwork(featuredArtwork)} type="button">
        <ArtVisual item={featuredArtwork} />
        <div>
          <span>Featured Artwork</span>
          <strong>{featuredArtwork.title}</strong>
          <small>{featuredArtwork.address || featuredArtwork.neighborhood}</small>
        </div>
        <em>{Number.isFinite(featuredArtwork.lat) ? '0.4 km' : 'Nearby'}</em>
      </button>
      <SectionRow title="Explore by category" action="View all" />
      <div className="category-card-row">
        {CATEGORIES.filter((item) => item !== 'All').map((category) => <button key={category} type="button"><span>{category[0]}</span>{category}</button>)}
      </div>
      <SectionRow title="Featured this week" action="See more" />
      <div className="mini-card-row">
        {events.slice(0, 3).map((event) => <MiniEventCard key={event.id} event={event} onClick={() => onOpenEvent(event)} />)}
      </div>
      <SectionRow title="Near you" action="See map" />
      <div className="mini-card-row">
        {nearYou.map((artwork) => <MiniArtworkCard key={artwork.id} artwork={artwork} saved={savedIds.has(artwork.id)} onSave={() => onSave(artwork.id)} onClick={() => onOpenArtwork(artwork)} />)}
      </div>
    </div>
  );
}

function MapScreen({ mapContainerRef, selectedArtwork, saved, onSave }) {
  const mapsUrl = mapsUrlFor(selectedArtwork);
  return (
    <div className="redesign-mobile-screen map-flow">
      <ScreenTopBar title="Map" right={<button type="button">☷</button>} />
      <SearchBar placeholder="Search this area" />
      <div className="redesign-map-frame"><div ref={mapContainerRef} className="redesign-map-container" role="application" aria-label="HERE map" /></div>
      <article className="map-selected-card">
        <ArtVisual item={selectedArtwork} />
        <div>
          <strong>{selectedArtwork.title}</strong>
          <span>{selectedArtwork.address || selectedArtwork.neighborhood}</span>
        </div>
        <button className={saved ? 'active' : ''} onClick={onSave} type="button">♡</button>
      </article>
      <div className="redesign-action-pair">
        {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer">Open location</a>}
        <button type="button">Save place</button>
      </div>
    </div>
  );
}

function EventScreen({ event, host, events, saved, onSave, onOpenEvent, onOpenProfile }) {
  if (!event) return <EmptyScreen title="Events" message="Creative events will appear here." />;
  const mapsUrl = mapsUrlFor(event);
  return (
    <div className="redesign-mobile-screen event-flow">
      <ScreenTopBar title="" left="‹" right={<><button type="button">⇧</button><button type="button">•••</button></>} />
      <div className="event-hero"><ArtVisual item={event} /></div>
      <div className="event-detail-card">
        <span className="detail-label">{event.eventType}</span>
        <h1>{event.title}</h1>
        <InfoLine icon="□" label={formatEventDate(event.startsAt)} />
        <InfoLine icon="○" label={formatEventTime(event.startsAt, event.endsAt)} />
        <InfoLine icon="•" label={event.venueName || event.address || [event.city, event.state].filter(Boolean).join(', ')} action={mapsUrl ? <a href={mapsUrl} target="_blank" rel="noreferrer">Open in Maps</a> : null} />
        <p>{event.description}</p>
        <div className="host-strip">
          <span className="avatar-photo">{getInitials(host?.displayName || 'H')}</span>
          <div><strong>{host?.displayName || 'Host profile coming soon'}</strong><small>{formatProfileType(host?.profileType || 'Creative host')}</small></div>
          {host && <button onClick={() => onOpenProfile(host)} type="button">View profile</button>}
        </div>
        <div className="redesign-action-pair">
          <button className={saved ? 'active' : ''} onClick={onSave} type="button">Save</button>
          {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer">Open location</a>}
        </div>
      </div>
      <SectionRow title="More events" action="" />
      <div className="mini-card-row">
        {events.filter((item) => item.id !== event.id).slice(0, 3).map((item) => <MiniEventCard key={item.id} event={item} onClick={() => onOpenEvent(item)} />)}
      </div>
    </div>
  );
}

function ProfileScreen({ profile, profiles, events, journeys, artworks, onOpenProfile }) {
  if (!profile) return <EmptyScreen title="Profile" message="Creative profiles will appear here." />;
  return (
    <div className="redesign-mobile-screen profile-flow">
      <ScreenTopBar title="" left="‹" right={<button type="button">•••</button>} />
      <div className="profile-head">
        <span className="profile-photo">{getInitials(profile.displayName)}</span>
        <div>
          <h1>{profile.displayName}</h1>
          <p>{profile.handle ? `@${profile.handle}` : formatProfileType(profile.profileType)}</p>
          <small>{[profile.city, profile.state].filter(Boolean).join(', ')}</small>
        </div>
      </div>
      <div className="profile-stats-row">
        <span><strong>{artworks.length}</strong>Artworks</span>
        <span><strong>{events.length}</strong>Events</span>
        <span><strong>{journeys.length}</strong>Journeys</span>
        <span><strong>1.2K</strong>Followers</span>
      </div>
      <div className="profile-action-row"><button type="button">Follow</button><button type="button">✉</button></div>
      <p className="profile-bio-text">{profile.bio}</p>
      {profile.website && <a className="profile-link" href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a>}
      <div className="profile-tabs"><button className="active" type="button">Artworks</button><button type="button">Events</button><button type="button">Journeys</button></div>
      <div className="profile-art-grid">
        {artworks.slice(0, 6).map((artwork) => <ArtVisual key={artwork.id} item={artwork} />)}
      </div>
      <SectionRow title="More creators" action="" />
      <div className="avatar-row">
        {profiles.filter((item) => item.id !== profile.id).slice(0, 5).map((item) => <button key={item.id} onClick={() => onOpenProfile(item)} type="button"><span>{getInitials(item.displayName)}</span><small>{item.displayName}</small></button>)}
      </div>
    </div>
  );
}

function SavedScreen({ savedArtworks, savedEvents, likedArtworks, checkIns, profiles, onOpenArtwork, onOpenEvent }) {
  return (
    <div className="redesign-mobile-screen saved-flow">
      <ScreenTopBar title="My Space" right={<button type="button">⚙</button>} />
      <SectionRow title="Saved Places" action="See all" />
      <div className="saved-card-row">
        {(savedArtworks.length ? savedArtworks : []).slice(0, 4).map((artwork) => <SavedTile key={artwork.id} title={artwork.title} subtitle={artwork.address || artwork.neighborhood} item={artwork} onClick={() => onOpenArtwork(artwork)} />)}
        {savedArtworks.length === 0 && <p className="redesign-muted">Save places from Discover or Map and they will appear here.</p>}
      </div>
      <SectionRow title="Saved Events" action="See all" />
      <div className="saved-card-row">
        {(savedEvents.length ? savedEvents : []).slice(0, 3).map((event) => <SavedTile key={event.id} title={event.title} subtitle={formatEventDate(event.startsAt)} item={event} onClick={() => onOpenEvent(event)} />)}
        {savedEvents.length === 0 && <p className="redesign-muted">Saved creative events will appear here.</p>}
      </div>
      <SectionRow title="Liked Art" action="See all" />
      <div className="saved-card-row compact">
        {likedArtworks.slice(0, 3).map((artwork) => <SavedTile key={artwork.id} title={artwork.title} subtitle={artwork.neighborhood} item={artwork} onClick={() => onOpenArtwork(artwork)} />)}
        {likedArtworks.length === 0 && <p className="redesign-muted">Liked artwork will appear here.</p>}
      </div>
      <SectionRow title="Following" action="See all" />
      <div className="avatar-row">
        {profiles.slice(0, 5).map((profile) => <button key={profile.id} type="button"><span>{getInitials(profile.displayName)}</span><small>{profile.displayName}</small></button>)}
      </div>
      <SectionRow title="My Check-ins" action="See all" />
      <div className="avatar-row">
        {checkIns.slice(0, 5).map((artwork) => <button key={artwork.id} onClick={() => onOpenArtwork(artwork)} type="button"><span>{getInitials(artwork.title).slice(0, 1)}</span><small>{artwork.neighborhood}</small></button>)}
        {checkIns.length === 0 && <p className="redesign-muted">Check in at places you visit to build your memory trail.</p>}
      </div>
    </div>
  );
}

function ScreenTopBar({ title, left, right }) {
  return <div className="screen-topbar"><span>{left || '9:41'}</span><strong>{title}</strong><div>{right}</div></div>;
}

function SearchBar({ placeholder }) {
  return <label className="redesign-search"><span>⌕</span><input placeholder={placeholder} readOnly /></label>;
}

function SectionRow({ title, action }) {
  return <div className="section-row"><strong>{title}</strong>{action && <button type="button">{action}</button>}</div>;
}

function InfoLine({ icon, label, action }) {
  return <div className="info-line"><span>{icon}</span><strong>{label}</strong>{action}</div>;
}

function ArtVisual({ item }) {
  const imageUrl = item?.imageUrl || item?.image_url;
  return imageUrl ? <img className="art-visual" src={imageUrl} alt={item.title || 'HERE artwork'} /> : <div className="art-visual placeholder"><span>{getInitials(item?.title || item?.displayName || 'HERE').slice(0, 1)}</span></div>;
}

function MiniArtworkCard({ artwork, saved, onSave, onClick }) {
  return <article className="mini-art-card"><button onClick={onClick} type="button"><ArtVisual item={artwork} /><strong>{artwork.title}</strong><small>{artwork.neighborhood || artwork.address}</small></button><button className={saved ? 'active' : ''} onClick={onSave} type="button">♡</button></article>;
}

function MiniEventCard({ event, onClick }) {
  return <button className="mini-event-card" onClick={onClick} type="button"><ArtVisual item={event} /><strong>{event.title}</strong><small>{event.venueName || [event.city, event.state].filter(Boolean).join(', ')}</small></button>;
}

function SavedTile({ title, subtitle, item, onClick }) {
  return <button className="saved-tile" onClick={onClick} type="button"><ArtVisual item={item} /><strong>{title}</strong><span>{subtitle}</span></button>;
}

function EmptyScreen({ title, message }) {
  return <div className="redesign-mobile-screen empty-flow"><ScreenTopBar title={title} /><div className="empty-card"><h1>{title}</h1><p>{message}</p></div></div>;
}
