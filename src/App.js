import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PlatformPreview from './PlatformPreview';

const DEFAULT_CENTER = { lat: 35.7796, lng: -78.6382 };
const DEFAULT_API_URL = 'https://here-art-backend-production.up.railway.app';
const CATEGORIES = ['All', 'Mural', 'Street Art', 'Gallery', 'Installation', 'Exhibition', 'Hidden Gem'];

const SAMPLE_ARTWORKS = [
  { id: 'sample-raleigh-mural', title: 'Color Story Wall', artist: 'Local muralist', description: 'A bright public wall that turns an ordinary street corner into a place people stop, photograph, and remember.', address: 'Downtown Raleigh, NC', imageUrl: '', lat: 35.7796, lng: -78.6382, category: 'Mural', neighborhood: 'Downtown' },
  { id: 'sample-gallery-corner', title: 'Quiet Gallery Corner', artist: 'Independent artists', description: 'A small art stop for exhibitions, community shows, and local creative gatherings.', address: 'Warehouse District, Raleigh, NC', imageUrl: '', lat: 35.7758, lng: -78.6464, category: 'Gallery', neighborhood: 'Warehouse District' },
  { id: 'sample-hidden-passage', title: 'Hidden Color Passage', artist: 'Unknown artist', description: 'A tucked-away creative place HERE is built to help people discover and preserve.', address: 'Near Moore Square, Raleigh, NC', imageUrl: '', lat: 35.7774, lng: -78.6357, category: 'Street Art', neighborhood: 'Moore Square' },
];

const initialForm = { title: '', artist: '', category: 'Mural', description: '', address: '', imageUrl: '', lat: '', lng: '' };

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

function getCategoryIcon(category = '') {
  const key = category.toLowerCase();
  if (key.includes('gallery')) return 'G';
  if (key.includes('installation')) return 'I';
  if (key.includes('exhibition')) return 'E';
  if (key.includes('hidden')) return 'H';
  if (key.includes('street')) return 'S';
  return 'M';
}

export default function App() {
  const apiUrl = useMemo(() => (process.env.REACT_APP_API_URL || DEFAULT_API_URL).replace(/\/$/, ''), []);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const userLayerRef = useRef(null);
  const mapContainerRef = useRef(null);

  const [artworks, setArtworks] = useState(SAMPLE_ARTWORKS);
  const [selectedArtwork, setSelectedArtwork] = useState(SAMPLE_ARTWORKS[0]);
  const [activeSection, setActiveSection] = useState('discover');
  const [activeCategory, setActiveCategory] = useState('All');
  const [form, setForm] = useState(initialForm);
  const [userLocation, setUserLocation] = useState(null);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [visitedIds, setVisitedIds] = useState(() => new Set());
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const positionedArtworks = useMemo(() => artworks.filter((artwork) => Number.isFinite(artwork.lat) && Number.isFinite(artwork.lng)), [artworks]);
  const filteredArtworks = useMemo(() => activeCategory === 'All' ? positionedArtworks : positionedArtworks.filter((artwork) => artwork.category === activeCategory), [activeCategory, positionedArtworks]);
  const featuredArtwork = selectedArtwork || filteredArtworks[0] || positionedArtworks[0] || SAMPLE_ARTWORKS[0];
  const savedArtworks = useMemo(() => artworks.filter((artwork) => savedIds.has(artwork.id)), [artworks, savedIds]);

  const refreshMapSize = useCallback(() => {
    const refresh = () => {
      if (mapRef.current) mapRef.current.invalidateSize(true);
    };
    window.requestAnimationFrame(refresh);
    window.setTimeout(refresh, 220);
    window.setTimeout(refresh, 700);
  }, []);

  const fetchArtworks = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const candidatePaths = ['/api/artworks', '/artworks'];
    let lastError = null;

    for (const path of candidatePaths) {
      try {
        const response = await fetch(`${apiUrl}${path}`);
        if (!response.ok) {
          lastError = new Error(`Request failed at ${path}`);
          continue;
        }
        const data = await response.json();
        const records = Array.isArray(data) ? data : data.artworks || data.data || [];
        const normalized = records.map(normalizeArtwork).filter((artwork) => artwork.lat && artwork.lng);
        const nextArtworks = normalized.length > 0 ? normalized : SAMPLE_ARTWORKS;
        setArtworks(nextArtworks);
        setSelectedArtwork((current) => current || nextArtworks[0]);
        setIsLoading(false);
        refreshMapSize();
        return;
      } catch (requestError) {
        lastError = requestError;
      }
    }

    setArtworks(SAMPLE_ARTWORKS);
    setSelectedArtwork((current) => current || SAMPLE_ARTWORKS[0]);
    setIsLoading(false);
    setError('Live artwork could not load yet, so HERE is showing sample locations while the database connection is completed.');
    console.warn(lastError);
    refreshMapSize();
  }, [apiUrl, refreshMapSize]);

  useEffect(() => { fetchArtworks(); }, [fetchArtworks]);

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
      userLayerRef.current = window.L.layerGroup().addTo(mapRef.current);
    }

    refreshMapSize();
  }, [activeSection, refreshMapSize]);

  useEffect(() => {
    if (activeSection !== 'map' || !window.L || !mapRef.current || !markerLayerRef.current) return;
    markerLayerRef.current.clearLayers();

    filteredArtworks.forEach((artwork) => {
      const isSelected = featuredArtwork?.id === artwork.id;
      const marker = window.L.marker([artwork.lat, artwork.lng], {
        icon: window.L.divIcon({
          className: `here-marker ${isSelected ? 'selected' : ''}`,
          html: `<span>${getCategoryIcon(artwork.category)}</span>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        }),
      }).addTo(markerLayerRef.current);
      marker.on('click', () => { setSelectedArtwork(artwork); setActiveSection('map'); });
    });

    if (featuredArtwork?.lat && featuredArtwork?.lng) {
      mapRef.current.setView([featuredArtwork.lat, featuredArtwork.lng], 15, { animate: true });
    } else if (filteredArtworks.length > 0) {
      const bounds = window.L.latLngBounds(filteredArtworks.map((artwork) => [artwork.lat, artwork.lng]));
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }

    refreshMapSize();
  }, [activeSection, featuredArtwork, filteredArtworks, refreshMapSize]);

  useEffect(() => {
    if (activeSection !== 'map' || !window.L || !mapRef.current || !userLayerRef.current) return;
    userLayerRef.current.clearLayers();
    if (!userLocation) return;
    window.L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 9,
      color: '#ffffff',
      fillColor: '#30a8b5',
      fillOpacity: 1,
      weight: 4,
    }).addTo(userLayerRef.current);
    refreshMapSize();
  }, [activeSection, userLocation, refreshMapSize]);

  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateSet = (setter, id) => setter((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const selectArtwork = (artwork) => {
    setSelectedArtwork(artwork);
    setActiveSection('map');
    window.setTimeout(() => {
      if (mapRef.current && artwork.lat && artwork.lng) {
        mapRef.current.setView([artwork.lat, artwork.lng], 16, { animate: true });
      }
      refreshMapSize();
    }, 250);
  };

  const useMyLocation = () => {
    setStatus('Requesting your location...');
    setError('');
    if (!navigator.geolocation) {
      setError('Location is not available in this browser. You can enter coordinates manually.');
      setStatus('');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setUserLocation({ lat, lng });
        setForm((current) => ({ ...current, lat: String(lat), lng: String(lng) }));
        setStatus('Location added. You can now save it to a submission.');
        setActiveSection('map');
        window.setTimeout(() => {
          if (mapRef.current) mapRef.current.setView([lat, lng], 15, { animate: true });
          refreshMapSize();
        }, 250);
      },
      () => { setError('Location permission was not granted. You can still enter coordinates manually.'); setStatus(''); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('Submitting artwork...');
    setError('');
    const payload = {
      title: form.title.trim(), artist: form.artist.trim(), category: form.category,
      description: form.description.trim(), address: form.address.trim(), imageUrl: form.imageUrl.trim(),
      latitude: form.lat ? Number(form.lat) : null, longitude: form.lng ? Number(form.lng) : null,
      lat: form.lat ? Number(form.lat) : null, lng: form.lng ? Number(form.lng) : null,
    };
    if (!payload.title) { setError('Please add a title or short name for the artwork.'); setStatus(''); setIsSubmitting(false); return; }
    if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) { setError('Please add a location using current location or manual coordinates.'); setStatus(''); setIsSubmitting(false); return; }

    const candidatePaths = ['/api/artworks', '/artworks'];
    let saved = false;
    let lastError = null;
    for (const path of candidatePaths) {
      try {
        const response = await fetch(`${apiUrl}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) { lastError = new Error(`Submit failed at ${path}`); continue; }
        saved = true;
        break;
      } catch (submitError) { lastError = submitError; }
    }
    if (!saved) {
      const optimisticArtwork = normalizeArtwork({ ...payload, id: `local-${Date.now()}` }, artworks.length);
      setArtworks((current) => [optimisticArtwork, ...current]);
      setSelectedArtwork(optimisticArtwork);
      setActiveSection('map');
      setError('The backend could not save this yet, but it has been added locally for preview. Finish the Railway database connection to make submissions permanent.');
      setStatus(''); setIsSubmitting(false); console.warn(lastError); return;
    }
    setForm(initialForm);
    setStatus('Artwork submitted successfully. Refreshing map...');
    setIsSubmitting(false);
    await fetchArtworks();
    setActiveSection('map');
  };

  return (
    <div className="app-shell">
      <header className="mobile-app-hero">
        <nav className="top-nav" aria-label="Main navigation">
          <button className="logo-button" onClick={() => setActiveSection('discover')} type="button"><span className="logo-icon">H</span><span>Here</span></button>
          <button className="top-profile" onClick={() => setActiveSection('profile')} type="button">Z</button>
        </nav>
        <section className="hero-stage">
          <div className="hero-copy app-panel">
            <p className="eyebrow">Art around you</p>
            <h1>Find art where you are.</h1>
            <p>Discover murals, street art, galleries, exhibitions, installations, and hidden creative places. Save what you love, check in where you go, and help your city art map grow.</p>
            <div className="hero-actions"><button className="primary-button" onClick={() => setActiveSection('map')} type="button">Open map</button><button className="secondary-button" onClick={useMyLocation} type="button">Use my location</button></div>
          </div>
          <div className="phone-shell" aria-label="HERE app preview"><div className="phone-notch" /><div className="phone-screen"><div className="phone-header"><span>Here</span><strong>{filteredArtworks.length}</strong></div><div className="phone-art-symbol">{getCategoryIcon(featuredArtwork.category)}</div><p className="script-logo">Here</p><div className="phone-card"><span>{featuredArtwork.category}</span><h2>{featuredArtwork.title}</h2><p>{featuredArtwork.artist}</p></div></div></div>
        </section>
      </header>

      <main className="app-main">
        {error && <div className="notice error global-notice">{error}</div>}
        {status && <div className="notice success global-notice">{status}</div>}

        <section className={`app-section ${activeSection === 'discover' ? 'is-active' : ''}`}>
          <div className="section-heading split-heading"><div><p className="eyebrow">Discover</p><h2>Nearby creative places</h2></div><button className="ghost-button" onClick={fetchArtworks} type="button">Refresh</button></div>
          <div className="category-row" aria-label="Filter artwork categories">{CATEGORIES.map((category) => <button key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)} type="button">{category}</button>)}</div>
          {isLoading && <div className="notice">Loading artwork from Railway...</div>}
          <div className="feed-grid">{filteredArtworks.map((artwork) => <ArtworkCard key={artwork.id} artwork={artwork} saved={savedIds.has(artwork.id)} liked={likedIds.has(artwork.id)} onSelect={selectArtwork} onSave={() => updateSet(setSavedIds, artwork.id)} onLike={() => updateSet(setLikedIds, artwork.id)} />)}</div>
          <PlatformPreview apiUrl={apiUrl} />
        </section>

        <section className={`app-section map-app-section ${activeSection === 'map' ? 'is-active' : ''}`}>
          <div className="section-heading split-heading"><div><p className="eyebrow">Map</p><h2>Location points</h2></div><button className="secondary-button compact" onClick={useMyLocation} type="button">Find me</button></div>
          <div className="map-layout app-panel"><div className="map-card"><div ref={mapContainerRef} className="map-container" role="application" aria-label="HERE artwork map" /></div><ArtworkDetail artwork={featuredArtwork} saved={savedIds.has(featuredArtwork.id)} liked={likedIds.has(featuredArtwork.id)} visited={visitedIds.has(featuredArtwork.id)} onSave={() => updateSet(setSavedIds, featuredArtwork.id)} onLike={() => updateSet(setLikedIds, featuredArtwork.id)} onVisit={() => updateSet(setVisitedIds, featuredArtwork.id)} /></div>
        </section>

        <section className={`app-section ${activeSection === 'submit' ? 'is-active' : ''}`}>
          <div className="section-heading"><p className="eyebrow">Contribute</p><h2>Add a creative location</h2><p>Community submissions are part of the app experience. Add a location point with enough detail for someone else to find it.</p></div>
          <form className="submission-form" onSubmit={handleSubmit}>
            <label>Artwork or place title<input name="title" value={form.title} onChange={handleChange} placeholder="Example: The blue wall mural" /></label>
            <label>Artist or host<input name="artist" value={form.artist} onChange={handleChange} placeholder="Artist, gallery, or unknown" /></label>
            <label>Category<select name="category" value={form.category} onChange={handleChange}>{CATEGORIES.filter((category) => category !== 'All').map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Image URL<input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Image upload comes next; paste a link for now" /></label>
            <label className="full-width">Description<textarea name="description" value={form.description} onChange={handleChange} placeholder="What should people notice about this place?" /></label>
            <label className="full-width">Address or location note<input name="address" value={form.address} onChange={handleChange} placeholder="Street, neighborhood, landmark, or building" /></label>
            <label>Latitude<input name="lat" value={form.lat} onChange={handleChange} placeholder="35.779600" /></label>
            <label>Longitude<input name="lng" value={form.lng} onChange={handleChange} placeholder="-78.638200" /></label>
            <div className="form-actions full-width"><button type="button" className="secondary-button dark" onClick={useMyLocation}>Use my current location</button><button type="submit" className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Add to HERE'}</button></div>
          </form>
        </section>

        <section className={`app-section ${activeSection === 'profile' ? 'is-active' : ''}`}>
          <div className="profile-layout"><div className="profile-card app-panel"><div className="avatar">Z</div><p className="eyebrow">Explorer profile</p><h2>Zelipa</h2><p>Art explorer, collector of hidden places, and early HERE community builder.</p><div className="profile-stats"><span><strong>{savedIds.size}</strong>Saved</span><span><strong>{likedIds.size}</strong>Liked</span><span><strong>{visitedIds.size}</strong>Check-ins</span></div><button className="primary-button" type="button">Sign-in flow coming next</button></div><div className="profile-card app-panel"><p className="eyebrow">Your saved map</p><h3>Places to revisit</h3><div className="saved-list">{savedArtworks.length > 0 ? savedArtworks.map((artwork) => <button key={artwork.id} onClick={() => selectArtwork(artwork)} type="button"><strong>{artwork.title}</strong><span>{artwork.address || artwork.neighborhood}</span></button>) : <p className="muted">Save artwork and places to build your personal art trail.</p>}</div></div></div>
        </section>
      </main>

      <nav className="bottom-nav" aria-label="App navigation"><button className={activeSection === 'discover' ? 'active' : ''} onClick={() => setActiveSection('discover')} type="button">Discover</button><button className={activeSection === 'map' ? 'active' : ''} onClick={() => setActiveSection('map')} type="button">Map</button><button className={activeSection === 'submit' ? 'active' : ''} onClick={() => setActiveSection('submit')} type="button">Add</button><button className={activeSection === 'profile' ? 'active' : ''} onClick={() => setActiveSection('profile')} type="button">Profile</button></nav>
    </div>
  );
}

function ArtworkCard({ artwork, saved, liked, onSelect, onSave, onLike }) {
  return <article className="feed-card"><button className="feed-visual" onClick={() => onSelect(artwork)} type="button">{artwork.imageUrl ? <img src={artwork.imageUrl} alt={artwork.title} /> : <span>{getCategoryIcon(artwork.category)}</span>}</button><div className="feed-body"><div className="feed-meta"><span>{artwork.category}</span><span>{artwork.neighborhood}</span></div><h3>{artwork.title}</h3><p>{artwork.description || 'No description added yet.'}</p><div className="interaction-row"><button className={saved ? 'active' : ''} onClick={onSave} type="button">Save</button><button className={liked ? 'active' : ''} onClick={onLike} type="button">Like</button><button onClick={() => onSelect(artwork)} type="button">Map</button></div></div></article>;
}

function ArtworkDetail({ artwork, saved, liked, visited, onSave, onLike, onVisit }) {
  return <aside className="artwork-panel"><div className="detail-topline"><span>{artwork.category}</span><span>{artwork.neighborhood}</span></div><h3>{artwork.title}</h3>{artwork.imageUrl ? <img src={artwork.imageUrl} alt={artwork.title} /> : <div className="detail-placeholder">{getCategoryIcon(artwork.category)}</div>}<p className="artist-line">{artwork.artist}</p><p>{artwork.description || 'No description added yet.'}</p><p className="muted">{artwork.address}</p><div className="interaction-row stacked"><button className={saved ? 'active' : ''} onClick={onSave} type="button">Save place</button><button className={liked ? 'active' : ''} onClick={onLike} type="button">Like</button><button className={visited ? 'active' : ''} onClick={onVisit} type="button">Check in</button></div></aside>;
}
