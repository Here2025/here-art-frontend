import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const DEFAULT_CENTER = { lat: 35.7796, lng: -78.6382 };
const DEFAULT_API_URL = 'https://here-art-backend-production.up.railway.app';

const normalizeArtwork = (item, index) => {
  const lat = Number(item.lat ?? item.latitude ?? item.location_lat ?? item.location?.lat);
  const lng = Number(item.lng ?? item.longitude ?? item.location_lng ?? item.location?.lng);

  return {
    id: item.id ?? item._id ?? `artwork-${index}`,
    title: item.title || item.name || 'Untitled artwork',
    artist: item.artist || item.artist_name || 'Artist unknown',
    description: item.description || item.notes || '',
    address: item.address || item.location_name || item.location || '',
    imageUrl: item.imageUrl || item.image_url || item.photoUrl || item.photo_url || '',
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
};

const initialForm = {
  title: '',
  artist: '',
  description: '',
  address: '',
  imageUrl: '',
  lat: '',
  lng: '',
};

function App() {
  const apiUrl = useMemo(
    () => (process.env.REACT_APP_API_URL || DEFAULT_API_URL).replace(/\/$/, ''),
    []
  );

  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const mapContainerRef = useRef(null);

  const [artworks, setArtworks] = useState([]);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const positionedArtworks = artworks.filter(
    (artwork) => Number.isFinite(artwork.lat) && Number.isFinite(artwork.lng)
  );

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
        setArtworks(records.map(normalizeArtwork));
        setIsLoading(false);
        return;
      } catch (requestError) {
        lastError = requestError;
      }
    }

    setIsLoading(false);
    setError(
      'The app could not load artwork from the backend yet. Check that Railway is awake and that the artwork route is enabled.'
    );
    console.warn(lastError);
  }, [apiUrl]);

  useEffect(() => {
    fetchArtworks();
  }, [fetchArtworks]);

  useEffect(() => {
    if (!window.L || !mapContainerRef.current || mapRef.current) return;

    mapRef.current = window.L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 12);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current);

    markerLayerRef.current = window.L.layerGroup().addTo(mapRef.current);
  }, []);

  useEffect(() => {
    if (!window.L || !mapRef.current || !markerLayerRef.current) return;

    markerLayerRef.current.clearLayers();

    positionedArtworks.forEach((artwork) => {
      const marker = window.L.marker([artwork.lat, artwork.lng]).addTo(markerLayerRef.current);
      marker.bindPopup(
        `<strong>${artwork.title}</strong><br/>${artwork.artist}<br/>${artwork.address || ''}`
      );
      marker.on('click', () => setSelectedArtwork(artwork));
    });

    if (positionedArtworks.length > 0) {
      const bounds = window.L.latLngBounds(
        positionedArtworks.map((artwork) => [artwork.lat, artwork.lng])
      );
      mapRef.current.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
    }
  }, [positionedArtworks]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
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
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setForm((current) => ({ ...current, lat, lng }));
        setStatus('Location added to the form.');
        if (mapRef.current) mapRef.current.setView([lat, lng], 15);
      },
      () => {
        setError('Location permission was not granted. You can still enter coordinates manually.');
        setStatus('');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('Submitting artwork...');
    setError('');

    const payload = {
      title: form.title.trim(),
      artist: form.artist.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      imageUrl: form.imageUrl.trim(),
      latitude: form.lat ? Number(form.lat) : null,
      longitude: form.lng ? Number(form.lng) : null,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
    };

    if (!payload.title) {
      setError('Please add a title or short name for the artwork.');
      setStatus('');
      setIsSubmitting(false);
      return;
    }

    const candidatePaths = ['/api/artworks', '/artworks'];
    let saved = false;
    let lastError = null;

    for (const path of candidatePaths) {
      try {
        const response = await fetch(`${apiUrl}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          lastError = new Error(`Submit failed at ${path}`);
          continue;
        }

        saved = true;
        break;
      } catch (submitError) {
        lastError = submitError;
      }
    }

    if (!saved) {
      console.warn(lastError);
      setError('The artwork could not be saved yet. Check the Railway POST route and CORS settings.');
      setStatus('');
      setIsSubmitting(false);
      return;
    }

    setForm(initialForm);
    setStatus('Artwork submitted. Refreshing map...');
    setIsSubmitting(false);
    await fetchArtworks();
    setStatus('Artwork submitted successfully.');
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <nav className="nav-bar" aria-label="Main navigation">
          <div className="brand-mark">HERE</div>
          <div className="nav-links">
            <a href="#map">Map</a>
            <a href="#submit">Submit Art</a>
            <a href="#vision">Vision</a>
          </div>
        </nav>

        <section className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Art around you</p>
            <h1>Discover the murals, street art, and creative places that make a city feel alive.</h1>
            <p>
              HERE is a location-based art discovery app for finding nearby public art,
              saving creative places, and helping artists become more visible in the communities
              they shape.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#map">Explore map</a>
              <a className="secondary-button" href="#submit">Add artwork</a>
            </div>
          </div>

          <div className="hero-card" aria-label="App summary">
            <span className="card-kicker">Live app build</span>
            <h2>{positionedArtworks.length}</h2>
            <p>mapped artwork locations connected to the Railway backend.</p>
          </div>
        </section>
      </header>

      <main>
        <section className="section map-section" id="map">
          <div className="section-heading">
            <p className="eyebrow">Explore</p>
            <h2>Art map</h2>
            <p>
              View submitted artwork locations. Use the form below to add a mural, installation,
              gallery moment, or public creative space.
            </p>
          </div>

          {error && <div className="notice error">{error}</div>}
          {status && <div className="notice success">{status}</div>}
          {isLoading && <div className="notice">Loading artwork from Railway...</div>}

          <div className="map-layout">
            <div className="map-card">
              <div ref={mapContainerRef} className="map-container" role="application" aria-label="HERE artwork map" />
            </div>

            <aside className="artwork-panel">
              <h3>{selectedArtwork ? selectedArtwork.title : 'Featured locations'}</h3>
              {selectedArtwork ? (
                <article>
                  {selectedArtwork.imageUrl && (
                    <img src={selectedArtwork.imageUrl} alt={selectedArtwork.title} />
                  )}
                  <p className="artist-line">{selectedArtwork.artist}</p>
                  <p>{selectedArtwork.description || 'No description added yet.'}</p>
                  <p className="muted">{selectedArtwork.address}</p>
                </article>
              ) : (
                <div className="artwork-list">
                  {positionedArtworks.slice(0, 6).map((artwork) => (
                    <button key={artwork.id} type="button" onClick={() => setSelectedArtwork(artwork)}>
                      <strong>{artwork.title}</strong>
                      <span>{artwork.artist}</span>
                    </button>
                  ))}
                  {positionedArtworks.length === 0 && (
                    <p className="muted">No artwork locations have loaded yet.</p>
                  )}
                </div>
              )}
            </aside>
          </div>
        </section>

        <section className="section submit-section" id="submit">
          <div className="section-heading">
            <p className="eyebrow">Contribute</p>
            <h2>Add an artwork location</h2>
            <p>
              Add the details you know. A title and location are enough to start building the map.
            </p>
          </div>

          <form className="submission-form" onSubmit={handleSubmit}>
            <label>
              Artwork title
              <input name="title" value={form.title} onChange={handleChange} placeholder="Example: The blue wall mural" />
            </label>
            <label>
              Artist
              <input name="artist" value={form.artist} onChange={handleChange} placeholder="Artist name, if known" />
            </label>
            <label className="full-width">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What should people notice about this piece?"
              />
            </label>
            <label className="full-width">
              Address or location note
              <input name="address" value={form.address} onChange={handleChange} placeholder="Street, neighborhood, landmark, or building" />
            </label>
            <label className="full-width">
              Image URL
              <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="Paste an image link for now" />
            </label>
            <label>
              Latitude
              <input name="lat" value={form.lat} onChange={handleChange} placeholder="35.779600" />
            </label>
            <label>
              Longitude
              <input name="lng" value={form.lng} onChange={handleChange} placeholder="-78.638200" />
            </label>

            <div className="form-actions full-width">
              <button type="button" className="secondary-button dark" onClick={useMyLocation}>
                Use my current location
              </button>
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit artwork'}
              </button>
            </div>
          </form>
        </section>

        <section className="section vision-section" id="vision">
          <div>
            <p className="eyebrow">Why HERE</p>
            <h2>Built for artists, explorers, and local creative communities.</h2>
          </div>
          <div className="vision-grid">
            <article>
              <h3>Discover</h3>
              <p>Make public art easier to find through a simple location-first experience.</p>
            </article>
            <article>
              <h3>Document</h3>
              <p>Capture murals, exhibitions, installations, and creative spaces before they disappear.</p>
            </article>
            <article>
              <h3>Connect</h3>
              <p>Create a foundation for artist profiles, follows, events, and future AR experiences.</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
