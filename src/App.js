import React, { useEffect, useMemo, useRef, useState } from 'react';
import AddCreatePage from './AddCreatePage';

const API = 'https://here-art-backend-production.up.railway.app';
const CENTER = { lat: 35.7796, lng: -78.6382 };

const art = [
  'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
];

const people = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
];

const categoryOptions = [
  { label: 'All', matcher: () => true },
  { label: 'Street Art', terms: ['street', 'mural', 'wall', 'graffiti'] },
  { label: 'Public Art', terms: ['public', 'sculpture', 'installation', 'monument', 'memorial', 'plaza'] },
  { label: 'Gallery', terms: ['gallery', 'studio', 'artspace', 'arts center', 'creative space'] },
  { label: 'Museum', terms: ['museum', 'collection', 'exhibition'] },
  { label: 'Performing Arts', terms: ['performing', 'performance', 'theatre', 'theater', 'opera', 'ballet', 'symphony', 'concert', 'stage'] },
  { label: 'Fashion', terms: ['fashion', 'designer', 'runway', 'brand', 'style'] },
  { label: 'Hidden Gem', terms: ['hidden', 'gem', 'alley', 'local', 'independent'] },
];

const fallbackProfiles = [
  { id: 'p1', displayName: 'HERE City Curator', handle: 'here-curator', profileType: 'curator', bio: 'A curator profile showing how HERE connects street art, public art, events, profiles, and journeys.', city: 'Raleigh', state: 'NC', website: '', imageUrl: people[0] },
  { id: 'p2', displayName: 'Walllight Studio', handle: 'walllight', profileType: 'street_artist', bio: 'A visual storyteller creating public art, murals, and city-based work.', city: 'Raleigh', state: 'NC', website: '', imageUrl: people[1] },
  { id: 'p3', displayName: 'Oak City Sound', handle: 'oakcitysound', profileType: 'performing_artist', bio: 'A creative host profile for local performances, pop-ups, and cultural events.', city: 'Raleigh', state: 'NC', website: '', imageUrl: people[2] },
];

const fallbackArtworks = [
  { id: 'a1', title: 'City Wall Study', artist: 'Local muralist', description: 'A street-art inspired placeholder showing how HERE highlights creative work connected to place.', address: 'Downtown Raleigh, NC', neighborhood: 'Downtown', category: 'Street Art', lat: 35.7796, lng: -78.6382, imageUrl: art[0] },
  { id: 'a2', title: 'Public Color Study', artist: 'Public artist', description: 'A public-art inspired placeholder for creative moments people can discover while moving through the city.', address: 'Warehouse District, Raleigh, NC', neighborhood: 'Warehouse District', category: 'Public Art', lat: 35.7774, lng: -78.6357, imageUrl: art[1] },
  { id: 'a3', title: 'Gallery Light', artist: 'Independent artist', description: 'A gallery-inspired placeholder while HERE expands its verified creative content and image-rights workflow.', address: 'Raleigh, NC', neighborhood: 'Raleigh', category: 'Gallery', lat: 35.7758, lng: -78.6464, imageUrl: art[2] },
];

const fallbackEvents = [
  { id: 'e1', title: 'Street Art Walk', eventType: 'Art Walk', description: 'A guided creative walk through public art, murals, and hidden creative places.', venueName: 'Downtown Raleigh', address: 'Downtown Raleigh, NC', city: 'Raleigh', state: 'NC', latitude: 35.7796, longitude: -78.6382, startsAt: new Date(Date.now() + 4 * 86400000).toISOString(), endsAt: new Date(Date.now() + 4 * 86400000 + 3 * 3600000).toISOString(), priceLabel: 'Free', hostProfileId: 'p1', imageUrl: art[1], ticketUrl: '' },
  { id: 'e2', title: 'Gallery Night & Local Sounds', eventType: 'Creative Event', description: 'A creative evening connecting visual art, sound, and people who want to discover local talent.', venueName: 'Warehouse District', address: 'Warehouse District, Raleigh, NC', city: 'Raleigh', state: 'NC', latitude: 35.7758, longitude: -78.6464, startsAt: new Date(Date.now() + 7 * 86400000).toISOString(), endsAt: new Date(Date.now() + 7 * 86400000 + 2 * 3600000).toISOString(), priceLabel: 'Free / check venue', hostProfileId: 'p3', imageUrl: art[3], ticketUrl: '' },
];

const fallbackJourneys = [
  { id: 'j1', title: 'Downtown Creative Walk', description: 'A curated trail through murals, public art, galleries, and hidden creative places.', city: 'Raleigh', state: 'NC', curatorProfileId: 'p1', imageUrl: art[4] },
];

function normArt(x, i) {
  const lat = Number(x.lat ?? x.latitude);
  const lng = Number(x.lng ?? x.longitude);
  return {
    id: x.id || `a-${i}`,
    title: x.title || 'Untitled artwork',
    artist: x.artist || 'Artist unknown',
    description: x.description || 'A creative place in the HERE discovery layer.',
    address: x.address || '',
    imageUrl: x.imageUrl || x.image_url || art[i % art.length],
    category: x.category || 'Public Art',
    neighborhood: x.neighborhood || x.area || x.address || 'Nearby',
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
}

function normProfile(x, i) {
  return {
    id: x.id || `p-${i}`,
    displayName: x.displayName || x.display_name || x.name || 'Creative profile',
    handle: x.handle || '',
    profileType: x.profileType || x.profile_type || 'artist',
    bio: x.bio || 'A creative account on HERE.',
    city: x.city || 'Raleigh',
    state: x.state || 'NC',
    website: x.website || x.websiteUrl || x.website_url || '',
    imageUrl: x.imageUrl || x.image_url || people[i % people.length],
  };
}

function normEvent(x, i) {
  return {
    id: x.id || `e-${i}`,
    title: x.title || 'Creative event',
    eventType: x.eventType || x.event_type || 'Creative Event',
    description: x.description || 'A creative event in the HERE discovery layer.',
    venueName: x.venueName || x.venue_name || '',
    address: x.address || '',
    city: x.city || 'Raleigh',
    state: x.state || 'NC',
    latitude: Number(x.latitude ?? x.lat),
    longitude: Number(x.longitude ?? x.lng),
    startsAt: x.startsAt || x.starts_at || '',
    endsAt: x.endsAt || x.ends_at || '',
    priceLabel: x.priceLabel || x.price_label || '',
    hostProfileId: x.hostProfileId || x.host_profile_id || null,
    imageUrl: x.imageUrl || x.image_url || art[(i + 1) % art.length],
    ticketUrl: x.ticketUrl || x.ticket_url || x.websiteUrl || x.website_url || '',
  };
}

function normJourney(x, i) {
  return {
    id: x.id || `j-${i}`,
    title: x.title || 'Creative journey',
    description: x.description || 'A curated HERE journey.',
    city: x.city || 'Raleigh',
    state: x.state || 'NC',
    curatorProfileId: x.curatorProfileId || x.curator_profile_id || null,
    imageUrl: x.imageUrl || x.image_url || art[(i + 2) % art.length],
  };
}

function dateText(v) {
  const d = new Date(v);
  return v && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date coming soon';
}

function timeText(s, e) {
  const a = new Date(s);
  const b = new Date(e);
  if (!s || Number.isNaN(a.getTime())) return 'Time coming soon';
  const x = a.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const y = e && !Number.isNaN(b.getTime()) ? b.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
  return y ? `${x} - ${y}` : x;
}

function initials(v = 'HERE') {
  return String(v).split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'H';
}

function typeLabel(v = '') {
  return String(v).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapUrl(x) {
  const lat = x?.lat ?? x?.latitude;
  const lng = x?.lng ?? x?.longitude;
  if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  if (x?.address || x?.venueName) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.address || x.venueName)}`;
  return '';
}

function searchableText(x) {
  return [x.title, x.artist, x.description, x.address, x.neighborhood, x.category, x.eventType, x.venueName, x.city, x.state].filter(Boolean).join(' ').toLowerCase();
}

function match(x, q) {
  if (!q) return true;
  return searchableText(x).includes(q.toLowerCase());
}

function matchCat(item, category) {
  if (!category || category === 'All') return true;
  const option = categoryOptions.find((c) => c.label === category);
  if (!option) return true;
  if (option.matcher) return option.matcher(item);
  const text = searchableText(item);
  return option.terms?.some((term) => text.includes(term)) ?? true;
}

export default function App() {
  const api = useMemo(() => (process.env.REACT_APP_API_URL || API).replace(/\/$/, ''), []);
  const [page, setPage] = useState('discover');
  const [artworks, setArtworks] = useState(fallbackArtworks);
  const [profiles, setProfiles] = useState(fallbackProfiles);
  const [events, setEvents] = useState(fallbackEvents);
  const [journeys, setJourneys] = useState(fallbackJourneys);
  const [artId, setArtId] = useState(fallbackArtworks[0].id);
  const [eventId, setEventId] = useState(fallbackEvents[0].id);
  const [profileId, setProfileId] = useState(fallbackProfiles[0].id);
  const [saved, setSaved] = useState(() => new Set());
  const [liked, setLiked] = useState(() => new Set());
  const [visited, setVisited] = useState(() => new Set());
  const [following, setFollowing] = useState(() => new Set());
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [mapQuery, setMapQuery] = useState('');
  const [mapCategory, setMapCategory] = useState('All');
  const [notice, setNotice] = useState('');
  const mapRef = useRef(null);
  const mapBox = useRef(null);
  const layer = useRef(null);

  const filteredMapArtworks = useMemo(
    () => artworks.filter((a) => match(a, mapQuery) && matchCat(a, mapCategory)),
    [artworks, mapQuery, mapCategory]
  );
  const selectedArt = filteredMapArtworks.find((x) => x.id === artId) || filteredMapArtworks[0] || artworks.find((x) => x.id === artId) || artworks[0] || fallbackArtworks[0];
  const selectedEvent = events.find((x) => x.id === eventId) || events[0] || fallbackEvents[0];
  const selectedProfile = profiles.find((x) => x.id === profileId) || profiles[0] || fallbackProfiles[0];
  const host = profiles.find((p) => p.id === selectedEvent.hostProfileId) || profiles[0] || fallbackProfiles[0];
  const profileEvents = events.filter((e) => e.hostProfileId === selectedProfile.id);
  const profileJourneys = journeys.filter((j) => j.curatorProfileId === selectedProfile.id);

  const setDiscoverCategory = (nextCategory) => {
    setCat(nextCategory);
    setMapCategory(nextCategory);
    setMapQuery('');
  };

  const clearDiscover = () => {
    setQuery('');
    setCat('All');
    setMapQuery('');
    setMapCategory('All');
  };

  const flip = (setter, id) => setter((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const openArt = (a) => {
    setArtId(a.id);
    setPage('map');
  };

  const openEvent = (e) => {
    setEventId(e.id);
    setPage('events');
  };

  const openProfile = (p) => {
    if (p) {
      setProfileId(p.id);
      setPage('profile');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [a, p, e, j] = await Promise.all([
          fetch(`${api}/api/artworks`),
          fetch(`${api}/api/profiles`),
          fetch(`${api}/api/events`),
          fetch(`${api}/api/journeys`),
        ]);
        const [ad, pd, ed, jd] = await Promise.all([a.json(), p.json(), e.json(), j.json()]);
        const na = (ad.artworks || ad.data || []).map(normArt).filter((x) => x.lat && x.lng);
        const np = (pd.profiles || pd.data || []).map(normProfile);
        const ne = (ed.events || ed.data || []).map(normEvent);
        const nj = (jd.journeys || jd.data || []).map(normJourney);
        setArtworks(na.length ? na : fallbackArtworks);
        setProfiles(np.length ? np : fallbackProfiles);
        setEvents(ne.length ? ne : fallbackEvents);
        setJourneys(nj.length ? nj : fallbackJourneys);
        if (na[0]) setArtId(na[0].id);
        if (ne[0]) setEventId(ne[0].id);
        if (np[0]) setProfileId(np[0].id);
        setNotice('');
      } catch {
        setNotice('Showing design-ready placeholder content while live content loads.');
      }
    })();
  }, [api]);

  useEffect(() => {
    if (page !== 'map' || !window.L || !mapBox.current) return;
    if (!mapRef.current) {
      mapRef.current = window.L.map(mapBox.current, { zoomControl: false }).setView([CENTER.lat, CENTER.lng], 13);
      window.L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(mapRef.current);
      layer.current = window.L.layerGroup().addTo(mapRef.current);
    }
    setTimeout(() => mapRef.current?.invalidateSize(true), 120);
  }, [page]);

  useEffect(() => {
    if (page !== 'map' || !window.L || !mapRef.current || !layer.current) return;
    layer.current.clearLayers();
    filteredMapArtworks.filter((a) => a.lat && a.lng).forEach((a) => {
      const selected = a.id === selectedArt.id;
      const icon = window.L.divIcon({ className: `here-map-pin ${selected ? 'selected' : ''}`, html: `<span>${initials(a.category).slice(0, 1)}</span>`, iconSize: [42, 42], iconAnchor: [21, 21] });
      const marker = window.L.marker([a.lat, a.lng], { icon }).addTo(layer.current);
      marker.on('click', () => setArtId(a.id));
    });
    if (filteredMapArtworks.length && selectedArt.lat && selectedArt.lng) mapRef.current.setView([selectedArt.lat, selectedArt.lng], 14, { animate: true });
  }, [page, filteredMapArtworks, selectedArt]);

  return (
    <div className="here-app-shell">
      <AppHeader page={page} setPage={setPage} />
      {notice && <div className="app-notice">{notice}</div>}
      <main className="app-page-wrap">
        {page === 'discover' && <DiscoverPage artworks={artworks} events={events} selectedArt={selectedArt} saved={saved} liked={liked} query={query} cat={cat} setQuery={setQuery} setCat={setDiscoverCategory} clear={clearDiscover} save={(id) => flip(setSaved, id)} like={(id) => flip(setLiked, id)} openArt={openArt} openEvent={openEvent} openMap={() => setPage('map')} openEvents={() => setPage('events')} />}
        {page === 'map' && <MapPage box={mapBox} artworks={filteredMapArtworks} selected={selectedArt} saved={saved.has(selectedArt.id)} visited={visited.has(selectedArt.id)} setSelected={setArtId} save={() => flip(setSaved, selectedArt.id)} check={() => flip(setVisited, selectedArt.id)} q={mapQuery} setQ={setMapQuery} category={mapCategory} setCategory={setMapCategory} />}
        {page === 'events' && <EventsPage event={selectedEvent} host={host} events={events} saved={saved.has(selectedEvent.id)} save={() => flip(setSaved, selectedEvent.id)} openEvent={openEvent} openProfile={openProfile} />}
        {page === 'create' && <AddCreatePage api={api} onNotice={setNotice} />}
        {page === 'profile' && <ProfilePage profile={selectedProfile} profiles={profiles} artworks={artworks} events={profileEvents} journeys={profileJourneys} followed={following.has(selectedProfile.id)} follow={() => flip(setFollowing, selectedProfile.id)} openProfile={openProfile} openEvent={openEvent} />}
        {page === 'saved' && <SavedPage savedArtworks={artworks.filter((a) => saved.has(a.id))} savedEvents={events.filter((e) => saved.has(e.id))} likedArtworks={artworks.filter((a) => liked.has(a.id))} checkIns={artworks.filter((a) => visited.has(a.id))} followed={profiles.filter((p) => following.has(p.id))} openArt={openArt} openEvent={openEvent} openProfile={openProfile} />}
      </main>
      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

function AppHeader({ page, setPage }) {
  return <header className="here-app-header"><button className="here-brand" onClick={() => setPage('discover')} type="button"><span>H</span><strong>HERE</strong></button><p>Find art where you are.</p><nav className="desktop-nav">{['discover', 'map', 'events', 'create', 'saved', 'profile'].map((x) => <button className={page === x ? 'active' : ''} key={x} onClick={() => setPage(x)} type="button">{x === 'discover' ? 'Discover' : x === 'saved' ? 'My Space' : x[0].toUpperCase() + x.slice(1)}</button>)}</nav></header>;
}

function DiscoverPage({ artworks, events, selectedArt, saved, liked, query, cat, setQuery, setCat, clear, save, like, openArt, openEvent, openMap, openEvents }) {
  const places = artworks.filter((a) => match(a, query) && matchCat(a, cat));
  const evs = events.filter((e) => match(e, query));
  const hero = places[0] || selectedArt;
  const visibleCategories = categoryOptions.filter((x) => x.label !== 'All');
  return <section className="page discover-page"><div className="discover-hero"><p className="small-kicker">Street and public artist visibility starts here</p><h1>Find art<br />where you are</h1><p className="hero-subcopy">HERE is a location-based creative discovery app for street art, public art, galleries, performances, fashion, events, and hidden cultural places.</p><SearchBar text="Search art, places, artists, events, or cities..." value={query} onChange={setQuery} /><FeatureArtwork artwork={hero} onClick={() => openArt(hero)} /></div><div className="discover-sidebar"><SectionHeader title="Explore creative categories" action="Clear filters" onAction={clear} /><div className="category-grid-real category-grid-expanded">{visibleCategories.map((x, i) => <button className={cat === x.label ? 'active' : ''} key={x.label} onClick={() => setCat(x.label)} type="button"><ImageTile item={{ imageUrl: art[(i + 1) % art.length], title: x.label }} /><span>{x.label}</span></button>)}</div><SectionHeader title={query ? 'Search results' : 'Creative events'} action="See events" onAction={openEvents} /><div className="content-grid three">{(evs.length ? evs : events).slice(0, 3).map((e) => <EventCard key={e.id} event={e} onClick={() => openEvent(e)} />)}{!evs.length && query && <p className="empty-text">No matching events yet. Try a place, category, or artist search.</p>}</div><SectionHeader title={cat === 'All' && !query ? 'Creative places near you' : 'Matching creative places'} action="See map" onAction={openMap} /><div className="content-grid three">{places.slice(0, 3).map((a) => <ArtworkCard key={a.id} artwork={a} saved={saved.has(a.id)} liked={liked.has(a.id)} save={() => save(a.id)} like={() => like(a.id)} onClick={() => openArt(a)} />)}{!places.length && <p className="empty-text">No matching places yet. Try another search or clear filters.</p>}</div></div></section>;
}

function MapPage({ box, artworks, selected, saved, visited, setSelected, save, check, q, setQ, category, setCategory }) {
  const url = mapUrl(selected);
  return <section className="page map-page"><div className="page-title-row"><div><h1>Creative Map</h1><p>Explore street art, public art, galleries, stages, fashion, and hidden creative places connected to location.</p></div><SearchBar text="Search this area" value={q} onChange={setQ} /></div><div className="map-filter-row">{categoryOptions.map((option) => <button className={category === option.label ? 'active' : ''} key={option.label} onClick={() => setCategory(option.label)} type="button">{option.label}</button>)}</div><div className="map-grid"><div className="map-canvas" ref={box} role="application" aria-label="HERE map" /><aside className="selected-place-card"><ImageTile item={selected} /><p className="label">Selected creative place</p><h2>{selected.title}</h2><small>{selected.category || 'Creative place'} · {selected.artist || 'Artist / place details'}</small><p>{selected.description}</p><span>{selected.address || selected.neighborhood}</span><div className="button-row"><button className={saved ? 'active' : ''} onClick={save} type="button">{saved ? 'Saved' : 'Save place'}</button><button className={visited ? 'active' : ''} onClick={check} type="button">{visited ? 'Checked in' : 'Check in'}</button>{url && <a href={url} target="_blank" rel="noreferrer">Open location</a>}</div><SectionHeader title="Nearby creative places" /><div className="mini-list">{artworks.slice(0, 5).map((a) => <button className={a.id === selected.id ? 'active' : ''} onClick={() => setSelected(a.id)} key={a.id} type="button"><ImageTile item={a} /><span><strong>{a.title}</strong><small>{a.category || 'Creative place'} · {a.neighborhood || a.address}</small></span></button>)}{!artworks.length && <p className="empty-text">No matching places yet. Clear search or choose All.</p>}</div></aside></div></section>;
}

function EventsPage({ event, host, events, saved, save, openEvent, openProfile }) {
  const url = mapUrl(event);
  return <section className="page event-page"><div className="event-main-image"><ImageTile item={event} /></div><article className="event-detail-panel"><p className="label">{event.eventType}</p><h1>{event.title}</h1><InfoLine label={dateText(event.startsAt)} /><InfoLine label={timeText(event.startsAt, event.endsAt)} /><InfoLine label={event.venueName || event.address || [event.city, event.state].filter(Boolean).join(', ')} action={url ? <a href={url} target="_blank" rel="noreferrer">Open in Maps</a> : null} /><p>{event.description}</p><button className="host-strip-real" onClick={() => openProfile(host)} type="button"><Avatar profile={host} /><span><strong>{host?.displayName || 'Host profile'}</strong><small>{typeLabel(host?.profileType || 'Creative host')}</small></span><em>View profile</em></button><div className="button-row"><button className={saved ? 'active' : ''} onClick={save} type="button">{saved ? 'Saved' : 'Save'}</button>{url && <a href={url} target="_blank" rel="noreferrer">Open location</a>}{event.ticketUrl && <a href={event.ticketUrl} target="_blank" rel="noreferrer">Website</a>}</div></article><section className="full-row"><SectionHeader title="More creative events" /><div className="content-grid three">{events.filter((x) => x.id !== event.id).slice(0, 3).map((x) => <EventCard key={x.id} event={x} onClick={() => openEvent(x)} />)}</div></section></section>;
}

function ProfilePage({ profile, profiles, artworks, events, journeys, followed, follow, openProfile, openEvent }) {
  const [tab, setTab] = useState('artworks');
  const [messageOpen, setMessageOpen] = useState(false);
  return <section className="page profile-page"><aside className="profile-info-panel"><div className="profile-head-real"><Avatar profile={profile} large /><div><h1>{profile.displayName}</h1><p>{profile.handle ? `@${profile.handle}` : typeLabel(profile.profileType)}</p><span>{[profile.city, profile.state].filter(Boolean).join(', ')}</span>{profile.website && <a href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a>}</div></div><div className="stats-grid"><span><strong>{artworks.length}</strong>Artworks</span><span><strong>{events.length}</strong>Events</span><span><strong>{journeys.length}</strong>Journeys</span><span><strong>{followed ? '1.2K+' : '1.2K'}</strong>Followers</span></div><div className="button-row"><button className={followed ? 'active' : ''} onClick={follow} type="button">{followed ? 'Following' : 'Follow'}</button><button onClick={() => setMessageOpen((v) => !v)} type="button">Message</button></div>{messageOpen && <div className="message-panel"><strong>Message {profile.displayName}</strong><p>Messaging will connect when HERE accounts are added. For now, this confirms the message action is working.</p><button onClick={() => setMessageOpen(false)} type="button">Close</button></div>}<p>{profile.bio}</p></aside><div className="profile-gallery-panel"><div className="tabs-real"><button className={tab === 'artworks' ? 'active' : ''} onClick={() => setTab('artworks')} type="button">Artworks</button><button className={tab === 'events' ? 'active' : ''} onClick={() => setTab('events')} type="button">Events</button><button className={tab === 'journeys' ? 'active' : ''} onClick={() => setTab('journeys')} type="button">Journeys</button></div>{tab === 'artworks' && <div className="profile-art-grid-real">{artworks.slice(0, 6).map((a) => <ImageTile key={a.id} item={a} />)}</div>}{tab === 'events' && <div className="content-grid three">{(events.length ? events : fallbackEvents).slice(0, 6).map((e) => <EventCard key={e.id} event={e} onClick={() => openEvent(e)} />)}</div>}{tab === 'journeys' && <div className="content-grid three">{(journeys.length ? journeys : fallbackJourneys).slice(0, 6).map((j) => <JourneyCard key={j.id} journey={j} />)}</div>}</div><section className="full-row"><SectionHeader title="More creators" /><div className="creator-row">{profiles.filter((x) => x.id !== profile.id).slice(0, 5).map((x) => <button key={x.id} onClick={() => openProfile(x)} type="button"><Avatar profile={x} /><span>{x.displayName}</span></button>)}</div></section></section>;
}

function SavedPage({ savedArtworks, savedEvents, likedArtworks, checkIns, followed, openArt, openEvent, openProfile }) {
  const [active, setActive] = useState('places');
  const sections = [{ id: 'places', title: 'Saved Places', count: savedArtworks.length }, { id: 'events', title: 'Saved Events', count: savedEvents.length }, { id: 'liked', title: 'Liked Art', count: likedArtworks.length }, { id: 'following', title: 'Following', count: followed.length }, { id: 'checkins', title: 'My Check-ins', count: checkIns.length }];
  return <section className="page saved-page interactive-saved"><div className="page-title-row"><h1>My Space</h1><p>Your saved places, liked art, followed creators, and check-ins in one place.</p></div><div className="saved-tabs">{sections.map((s) => <button className={active === s.id ? 'active' : ''} key={s.id} onClick={() => setActive(s.id)} type="button"><strong>{s.count}</strong><span>{s.title}</span></button>)}</div><div className="saved-active-panel">{active === 'places' && <SavedSection title="Saved Places" empty="Save places from Discover or Map and they will appear here." items={savedArtworks} render={(a) => <SavedTile key={a.id} item={a} onClick={() => openArt(a)} />} />}{active === 'events' && <SavedSection title="Saved Events" empty="Saved creative events will appear here." items={savedEvents} render={(e) => <SavedTile key={e.id} item={e} onClick={() => openEvent(e)} />} />}{active === 'liked' && <SavedSection title="Liked Art" empty="Liked artwork will appear here." items={likedArtworks} render={(a) => <SavedTile key={a.id} item={a} onClick={() => openArt(a)} />} />}{active === 'following' && <section className="saved-section"><SectionHeader title="Following" />{followed.length ? <div className="creator-row">{followed.map((p) => <button key={p.id} onClick={() => openProfile(p)} type="button"><Avatar profile={p} /><span>{p.displayName}</span></button>)}</div> : <p className="empty-text">Follow an artist, host, gallery, or collective and they will appear here.</p>}</section>}{active === 'checkins' && <SavedSection title="My Check-ins" empty="Check in at places you visit to build your memory trail." items={checkIns} render={(a) => <SavedTile key={a.id} item={a} onClick={() => openArt(a)} />} />}</div></section>;
}

function BottomNav({ page, setPage }) {
  return <nav className="bottom-app-nav">{[['discover', 'Discover'], ['map', 'Map'], ['events', 'Events'], ['create', 'Create'], ['saved', 'Saved'], ['profile', 'Profile']].map(([p, l]) => <button className={page === p ? 'active' : ''} onClick={() => setPage(p)} key={p} type="button"><span>{l[0]}</span>{l}</button>)}</nav>;
}

function SearchBar({ text, value, onChange }) {
  return <div className="search-real"><span>⌕</span><input value={value || ''} onChange={(e) => onChange?.(e.target.value)} readOnly={!onChange} placeholder={text} /></div>;
}

function SectionHeader({ title, action, onAction }) {
  return <div className="section-header-real"><strong>{title}</strong>{action && <button onClick={onAction} type="button">{action}</button>}</div>;
}

function FeatureArtwork({ artwork, onClick }) {
  return <button className="feature-real" onClick={onClick} type="button"><ImageTile item={artwork} /><div><span>Street / public art spotlight</span><strong>{artwork.title}</strong><small>{artwork.category || artwork.address || artwork.neighborhood}</small></div><em>Open map</em></button>;
}

function ImageTile({ item }) {
  return item?.imageUrl ? <img className="image-tile" src={item.imageUrl} alt={item.title || 'HERE artwork'} /> : <div className="image-tile placeholder">{initials(item?.title || 'H').slice(0, 1)}</div>;
}

function ArtworkCard({ artwork, saved, liked, save, like, onClick }) {
  return <article className="content-card"><button onClick={onClick} type="button"><ImageTile item={artwork} /><strong>{artwork.title}</strong><small>{artwork.category || artwork.neighborhood || artwork.address}</small></button><div><button className={saved ? 'active' : ''} onClick={save} type="button">{saved ? 'Saved' : 'Save'}</button><button className={liked ? 'active' : ''} onClick={like} type="button">{liked ? 'Liked' : 'Like'}</button></div></article>;
}

function EventCard({ event, onClick }) {
  return <button className="content-card event-card" onClick={onClick} type="button"><ImageTile item={event} /><strong>{event.title}</strong><small>{event.eventType || event.venueName || [event.city, event.state].filter(Boolean).join(', ')}</small></button>;
}

function JourneyCard({ journey }) {
  return <article className="content-card"><ImageTile item={journey} /><strong>{journey.title}</strong><small>{journey.city || 'Journey'}</small></article>;
}

function InfoLine({ label, action }) {
  return <div className="info-real"><span>●</span><strong>{label}</strong>{action}</div>;
}

function Avatar({ profile, large }) {
  return profile?.imageUrl ? <img className={`avatar-real ${large ? 'large' : ''}`} src={profile.imageUrl} alt={profile.displayName || 'Profile'} /> : <span className={`avatar-real ${large ? 'large' : ''}`}>{initials(profile?.displayName || 'H')}</span>;
}

function SavedSection({ title, empty, items, render }) {
  return <section className="saved-section"><SectionHeader title={title} />{items.length ? <div className="content-grid three">{items.map(render)}</div> : <p className="empty-text">{empty}</p>}</section>;
}

function SavedTile({ item, onClick }) {
  return <button className="saved-tile-real" onClick={onClick} type="button"><ImageTile item={item} /><strong>{item.title}</strong><span>{item.address || item.venueName || item.neighborhood}</span></button>;
}
