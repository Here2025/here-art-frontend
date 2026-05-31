import React, { useEffect, useState } from 'react';

export default function PlatformPreview({ apiUrl }) {
  const [profiles, setProfiles] = useState([]);
  const [events, setEvents] = useState([]);
  const [journeys, setJourneys] = useState([]);
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
        setProfiles(profilesData.profiles || []);
        setEvents(eventsData.events || []);
        setJourneys(journeysData.journeys || []);
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

  return (
    <section className="platform-preview app-panel">
      <p className="eyebrow">Creative layer</p>
      <h2>Street art, artists, events, and journeys</h2>
      <p className="platform-intro">
        HERE is becoming a living gallery for creative work happening around the city.
      </p>
      {status && <div className="notice">{status}</div>}
      <div className="platform-grid">
        <PlatformColumn title="Creative profiles" items={profiles} emptyText="Artists, musicians, galleries, collectives, and hosts will appear here." />
        <PlatformColumn title="Creative events" items={events} emptyText="Local shows, gallery openings, performances, and pop-ups will appear here." />
        <PlatformColumn title="Journeys" items={journeys} emptyText="Curated art walks, mural routes, and hidden-gem trails will appear here." />
      </div>
    </section>
  );
}

function PlatformColumn({ title, items, emptyText }) {
  return (
    <div className="platform-column">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="platform-empty">{emptyText}</p>
      ) : (
        items.slice(0, 3).map((item) => (
          <article className="platform-item" key={item.id || item.title || item.displayName}>
            <span>{item.profileType || item.eventType || item.city || 'HERE'}</span>
            <strong>{item.displayName || item.title || item.name}</strong>
            <p>{item.bio || item.description || item.venueName || item.address || 'Details coming soon.'}</p>
          </article>
        ))
      )}
    </div>
  );
}
