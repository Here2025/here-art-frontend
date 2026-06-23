const STORE_KEYS = {
  artworks: 'here.local.created.artworks',
  events: 'here.local.created.events',
  profiles: 'here.local.created.profiles',
};

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function readItems(type) {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORE_KEYS[type]);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeItems(type, items) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(STORE_KEYS[type], JSON.stringify(items));
  } catch {
    // Keep the app usable even when storage is unavailable.
  }
}

function localId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeLocalArtwork(payload = {}) {
  const lat = numberOrNull(payload.lat ?? payload.latitude);
  const lng = numberOrNull(payload.lng ?? payload.longitude);

  return {
    ...payload,
    id: payload.id || localId('local-artwork'),
    title: payload.title || 'Untitled artwork/place',
    artist: payload.artist || 'Artist / host unknown',
    category: payload.category || payload.mainCategory || payload.main_category || 'Creative Place',
    description: payload.description || 'A locally saved HERE creative place.',
    address: payload.address || [payload.city, payload.state || payload.region].filter(Boolean).join(', '),
    city: payload.city || '',
    state: payload.state || payload.region || '',
    imageUrl: payload.imageUrl || payload.image_url || '',
    image_url: payload.imageUrl || payload.image_url || '',
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    localOnly: true,
  };
}

function normalizeLocalProfile(payload = {}) {
  return {
    ...payload,
    id: payload.id || localId('local-profile'),
    displayName: payload.displayName || payload.display_name || payload.name || 'Creative profile',
    display_name: payload.displayName || payload.display_name || payload.name || 'Creative profile',
    handle: payload.handle || '',
    profileType: payload.profileType || payload.profile_type || 'artist',
    profile_type: payload.profileType || payload.profile_type || 'artist',
    bio: payload.bio || 'A locally saved HERE profile.',
    city: payload.city || '',
    state: payload.state || payload.region || '',
    region: payload.region || payload.state || '',
    country: payload.country || '',
    website: payload.website || payload.websiteUrl || payload.website_url || '',
    imageUrl: payload.imageUrl || payload.image_url || payload.photoPreview || '',
    image_url: payload.imageUrl || payload.image_url || payload.photoPreview || '',
    localOnly: true,
  };
}

function normalizeLocalEvent(payload = {}) {
  const displayType = payload.eventType || payload.event_type || payload.localLabel || payload.local_label || payload.mainCategory || payload.main_category || 'Creative Event';

  return {
    ...payload,
    id: payload.id || localId('local-event'),
    title: payload.title || 'Creative event',
    eventType: displayType,
    event_type: displayType,
    mainCategory: payload.mainCategory || payload.main_category || displayType,
    main_category: payload.mainCategory || payload.main_category || displayType,
    description: payload.description || 'A locally saved HERE event.',
    venueName: payload.venueName || payload.venue_name || '',
    venue_name: payload.venueName || payload.venue_name || '',
    address: payload.address || '',
    city: payload.city || '',
    state: payload.state || payload.region || '',
    region: payload.region || payload.state || '',
    country: payload.country || '',
    startsAt: payload.startsAt || payload.starts_at || '',
    starts_at: payload.startsAt || payload.starts_at || '',
    endsAt: payload.endsAt || payload.ends_at || '',
    ends_at: payload.endsAt || payload.ends_at || '',
    priceLabel: payload.priceLabel || payload.price_label || '',
    price_label: payload.priceLabel || payload.price_label || '',
    imageUrl: payload.imageUrl || payload.image_url || '',
    image_url: payload.imageUrl || payload.image_url || '',
    ticketUrl: payload.ticketUrl || payload.ticket_url || '',
    ticket_url: payload.ticketUrl || payload.ticket_url || '',
    localOnly: true,
  };
}

function saveLocal(type, payload) {
  const normalizers = {
    artworks: normalizeLocalArtwork,
    events: normalizeLocalEvent,
    profiles: normalizeLocalProfile,
  };

  const item = normalizers[type](payload);
  const existing = readItems(type).filter((x) => x.id !== item.id);
  writeItems(type, [item, ...existing]);
  window.dispatchEvent(new CustomEvent('here-local-content-saved', { detail: { type, item } }));
  return item;
}

function endpointType(url = '') {
  if (/\/api\/artworks\/?(?:\?.*)?$/.test(url)) return 'artworks';
  if (/\/api\/events\/?(?:\?.*)?$/.test(url)) return 'events';
  if (/\/api\/profiles\/?(?:\?.*)?$/.test(url)) return 'profiles';
  return '';
}

function mergeLocalData(type, data) {
  const localItems = readItems(type);
  if (!localItems.length) return data;

  const keys = {
    artworks: 'artworks',
    events: 'events',
    profiles: 'profiles',
  };
  const key = keys[type];
  const baseItems = Array.isArray(data?.[key]) ? data[key] : Array.isArray(data?.data) ? data.data : [];
  const seen = new Set(localItems.map((x) => x.id));
  const merged = [...localItems, ...baseItems.filter((x) => !seen.has(x.id))];

  if (Array.isArray(data?.[key])) return { ...data, [key]: merged };
  if (Array.isArray(data?.data)) return { ...data, data: merged };
  return { ...data, [key]: merged };
}

function successResponse(type, item) {
  const key = type === 'artworks' ? 'artwork' : type === 'events' ? 'event' : 'profile';
  return new Response(JSON.stringify({ ok: true, [key]: item, localOnly: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

if (typeof window !== 'undefined' && !window.__HERE_LOCAL_PROTOTYPE_STORE__) {
  window.__HERE_LOCAL_PROTOTYPE_STORE__ = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = (init?.method || input?.method || 'GET').toUpperCase();
    const type = endpointType(url);

    if (type && method === 'POST') {
      let payload = {};
      try {
        payload = init?.body ? JSON.parse(init.body) : {};
      } catch {
        payload = {};
      }

      const item = saveLocal(type, payload);

      try {
        const response = await originalFetch(input, init);
        return response.ok ? response : successResponse(type, item);
      } catch {
        return successResponse(type, item);
      }
    }

    if (type && method === 'GET') {
      const response = await originalFetch(input, init);

      try {
        const data = await response.clone().json();
        const merged = mergeLocalData(type, data);
        return new Response(JSON.stringify(merged), {
          status: response.status,
          statusText: response.statusText,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        return response;
      }
    }

    return originalFetch(input, init);
  };
}
