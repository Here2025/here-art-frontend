import React, { useEffect, useMemo, useState } from 'react';

export default function PlatformPreview({ apiUrl }) {
  const [profiles, setProfiles] = useState([]);
  const [events, setEvents] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [status, setStatus] = useState('Loading creative layer...');

  useEffect(() => {
    let active = true;

    async function load() {
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
        const nextProfiles = profilesData.profiles || [];
        const nextEvents = eventsData.events || [];
        const nextJourneys = journeysData.journeys || [];

        setProfiles(nextProfiles);
        setEvents(nextEvents);
        setJourneys(nextJourneys);
        setSelectedItem((current) => current || decorateItem(nextEvents[0], 'event', nextProfiles));
        setStatus('');
      } catch (error) {
        if (!active) return;
        console.warn(error);
        setStatus('Creative profiles, events, and journeys are ready for the platform layer.');
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [apiUrl]);

  const decoratedProfiles = useMemo(() => profiles.map((item) => decorateItem(item, 'profile', profiles)), [profiles]);
  const decoratedEvents = useMemo(() => events.map((item) => decorateItem(item, 'event', profiles)), [events, profiles]);
  const decoratedJourneys = useMemo(() => journeys.map((item) => decorateItem(item, 'journey', profiles)), [journeys, profiles]);

  return (
    <section className="platform-preview app-panel">
      <p className="eyebrow">Creative layer</p>
      <h2>Street art, artists, events, and journeys</h2>
      <p className="platform-intro">
        HERE is becoming a living gallery for creative work happening around the city.
      </p>
      {status && <div className="notice">{status}</div>}
      <div className="platform-grid">
        <PlatformColumn title="Creative profiles" items={decoratedProfiles} emptyText="Artists, musicians, galleries, collectives, and hosts will appear here." selectedItem={selectedItem} onSelect={setSelectedItem} />
        <PlatformColumn title="Creative events" items={decoratedEvents} emptyText="Local shows, gallery openings, performances, and pop-ups will appear here." selectedItem={selectedItem} onSelect={setSelectedItem} />
        <PlatformColumn title="Journeys" items={decoratedJourneys} emptyText="Curated art walks, mural routes, and hidden-gem trails will appear here." selectedItem={selectedItem} onSelect={setSelectedItem} />
      </div>
      <DetailPanel item={selectedItem} profiles={profiles} onSelectProfile={(profile) => setSelectedItem(decorateItem(profile, 'profile', profiles))} />
    </section>
  );
}

function PlatformColumn({ title, items, emptyText, selectedItem, onSelect }) {
  return (
    <div className="platform-column">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="platform-empty">{emptyText}</p>
      ) : (
        items.slice(0, 4).map((item) => (
          <button
            className={`platform-item platform-item-button ${selectedItem?.id === item.id && selectedItem?.kind === item.kind ? 'is-selected' : ''}`}
            key={`${item.kind}-${item.id || item.title}`}
            onClick={() => onSelect(item)}
            type="button"
          >
            <span>{item.label}</span>
            <strong>{item.title}</strong>
            <p>{item.summary}</p>
            <em>{item.kind === 'event' ? 'View event details' : 'View details'}</em>
          </button>
        ))
      )}
    </div>
  );
}

function DetailPanel({ item, profiles, onSelectProfile }) {
  if (!item) {
    return (
      <div className="platform-detail-panel">
        <p className="platform-empty">Select a creative profile, event, or journey to see more.</p>
      </div>
    );
  }

  const hostProfile = item.hostProfileId ? profiles.find((profile) => profile.id === item.hostProfileId) : null;
  const mapsUrl = item.latitude && item.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.latitude},${item.longitude}`)}`
    : item.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`
      : '';
  const externalUrl = item.ticketUrl || item.websiteUrl || item.sponsorUrl || item.adUrl || item.infoUrl || '';
  const externalLabel = item.isSponsored ? 'Visit sponsor website' : item.ticketUrl ? 'Tickets / info' : 'Visit website';

  return (
    <article className="platform-detail-panel">
      <div className="platform-detail-header">
        <div>
          <p className="eyebrow">{item.detailEyebrow}</p>
          <h3>{item.title}</h3>
        </div>
        <span>{item.label}</span>
      </div>

      {item.kind === 'event' && (
        <div className="platform-host-card">
          <span>Hosted by / Posted by</span>
          {hostProfile ? (
            <>
              <button type="button" onClick={() => onSelectProfile(hostProfile)}>
                <strong>{hostProfile.displayName || hostProfile.name}</strong>
                <small>{hostProfile.profileType || 'Creative profile'}</small>
              </button>
              <button className="platform-host-profile-link" type="button" onClick={() => onSelectProfile(hostProfile)}>
                View host profile
              </button>
            </>
          ) : (
            <p>Host profile will appear here when the event is connected to an account.</p>
          )}
        </div>
      )}

      <p className="platform-detail-description">{item.description}</p>

      <div className="platform-detail-facts">
        {item.when && <DetailFact label="When" value={item.when} />}
        {item.where && <DetailFact label="Where" value={item.where} />}
        {item.price && <DetailFact label="Price" value={item.price} />}
        {item.cityState && <DetailFact label="City" value={item.cityState} />}
      </div>

      <div className="platform-detail-actions">
        <button type="button">Save</button>
        <button type="button">Like</button>
        <button type="button">Share</button>
        {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer">Open location</a>}
        {externalUrl && <a href={externalUrl} target="_blank" rel="noreferrer">{externalLabel}</a>}
      </div>

      <div className="platform-sponsored-slot">
        <strong>Sponsored / featured space</strong>
        <p>Future paid placements can show event details inside HERE first, then use a clear website button for tickets, sponsors, venues, or partner offers.</p>
        {externalUrl && <a href={externalUrl} target="_blank" rel="noreferrer">Open external link</a>}
      </div>
    </article>
  );
}

function DetailFact({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function decorateItem(item, kind, profiles) {
  if (!item) return null;

  if (kind === 'event') {
    return {
      ...item,
      kind,
      label: item.isSponsored ? 'Sponsored Event' : item.eventType || 'Creative Event',
      title: item.title || 'Creative event',
      summary: item.venueName || item.address || 'Event details coming soon.',
      description: item.description || 'This creative event is part of the HERE discovery layer.',
      detailEyebrow: item.isSponsored ? 'Sponsored event' : 'Creative event',
      when: formatEventTime(item.startsAt, item.endsAt),
      where: item.venueName || item.address || '',
      price: item.priceLabel || '',
      cityState: [item.city, item.state].filter(Boolean).join(', '),
      latitude: item.latitude || item.lat,
      longitude: item.longitude || item.lng,
      ticketUrl: item.ticketUrl,
      websiteUrl: item.websiteUrl || item.website_url,
      sponsorUrl: item.sponsorUrl || item.sponsor_url,
      adUrl: item.adUrl || item.ad_url,
      infoUrl: item.infoUrl || item.info_url,
    };
  }

  if (kind === 'profile') {
    return {
      ...item,
      kind,
      label: item.profileType || 'Creative Profile',
      title: item.displayName || item.name || 'Creative profile',
      summary: item.bio || item.city || 'Profile details coming soon.',
      description: item.bio || 'This account is part of the HERE artist and creative platform layer.',
      detailEyebrow: 'HERE account',
      cityState: [item.city, item.state].filter(Boolean).join(', '),
      websiteUrl: item.websiteUrl || item.website_url || item.website,
    };
  }

  const curatorProfile = item.curatorProfileId ? profiles.find((profile) => profile.id === item.curatorProfileId) : null;
  return {
    ...item,
    kind,
    label: item.city || 'Journey',
    title: item.title || 'Creative journey',
    summary: item.description || 'Journey details coming soon.',
    description: item.description || 'This journey will guide people through creative places and events.',
    detailEyebrow: curatorProfile ? `Curated by ${curatorProfile.displayName}` : 'Curated journey',
    cityState: [item.city, item.state].filter(Boolean).join(', '),
    websiteUrl: item.websiteUrl || item.website_url,
  };
}

function formatEventTime(startsAt, endsAt) {
  if (!startsAt) return '';
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;
  if (Number.isNaN(start.getTime())) return '';

  const date = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const startTime = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const endTime = end && !Number.isNaN(end.getTime()) ? end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';

  return endTime ? `${date}, ${startTime} - ${endTime}` : `${date}, ${startTime}`;
}
