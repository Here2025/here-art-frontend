import React from 'react';

const artImages = [
  'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80',
];

const peopleImages = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
];

function App() {
  return (
    <main className="here-board-shell">
      <header className="here-board-header">
        <div>
          <div className="here-board-brand"><span>H</span><strong>HERE</strong></div>
          <p>Your city. Your art. Your HERE.</p>
        </div>
        <p className="here-board-copy">A gallery-first app for discovering street art,<br />creative places, events, artists, and journeys.</p>
      </header>

      <section className="here-phone-row" aria-label="HERE app experience mockup">
        <div>
          <DiscoverPhone />
          <BoardCaption number="1" title="Discover / Home" text="Your daily destination for art and inspiration." />
        </div>
        <div>
          <MapPhone />
          <BoardCaption number="2" title="Map" text="Explore the city and discover art, places, and hidden gems near you." />
        </div>
        <div>
          <EventPhone />
          <BoardCaption number="3" title="Event Detail" text="All the details you need to plan your art-filled experience." />
        </div>
        <div>
          <ProfilePhone />
          <BoardCaption number="4" title="Artist / Host Profile" text="Learn about artists, view their work, events, and curated journeys." />
        </div>
        <div>
          <SavedPhone />
          <BoardCaption number="5" title="Personal Space" text="Your saved places, liked art, and check-ins in one place." />
        </div>
      </section>
    </main>
  );
}

function PhoneFrame({ children, className = '' }) {
  return (
    <article className={`phone-frame ${className}`}>
      <div className="phone-status"><span>9:41</span><span>▴ ▰</span></div>
      {children}
      <PhoneNav />
    </article>
  );
}

function TopMiniBar({ title, right }) {
  return <div className="phone-topbar"><strong>{title}</strong><span>{right}</span></div>;
}

function PhoneNav({ active = 'discover' }) {
  const items = ['Discover', 'Map', 'Events', 'Saved', 'Profile'];
  return <nav className="phone-nav">{items.map((item) => <span className={active.toLowerCase() === item.toLowerCase() ? 'active' : ''} key={item}>{item}</span>)}</nav>;
}

function DiscoverPhone() {
  return (
    <PhoneFrame className="discover-phone">
      <TopMiniBar title={<><span className="tiny-logo">H</span> HERE</>} right={<><span>♧</span><img src={peopleImages[0]} alt="User" /></>} />
      <p className="phone-greeting">Good morning, Alex</p>
      <h1>Find art<br />where you are</h1>
      <SearchField text="Search for art, places, artists, events..." />
      <FeatureCard image={artImages[0]} title="Reflections" subtitle="Brick Lane, London" />
      <SectionTitle title="Explore by category" action="View all" />
      <div className="category-grid">
        {['Murals', 'Galleries', 'Events', 'Hidden Gems'].map((item, index) => <div key={item}><img src={artImages[index + 1]} alt="" /><span>{item}</span></div>)}
      </div>
      <SectionTitle title="Featured this week" action="See more" />
      <div className="thumb-row">{artImages.slice(1, 4).map((image, i) => <img src={image} alt="Featured art" key={image + i} />)}</div>
    </PhoneFrame>
  );
}

function MapPhone() {
  return (
    <PhoneFrame className="map-phone">
      <TopMiniBar title="Map" right="☷" />
      <SearchField text="Search this area" />
      <div className="mock-map">
        {peopleImages.concat(artImages.slice(0, 3)).map((image, index) => <span className={`map-pin pin-${index + 1}`} key={image}><img src={image} alt="Map pin" /></span>)}
        <i className="map-center" />
      </div>
      <div className="map-preview-card">
        <img src={artImages[2]} alt="Selected art" />
        <div><strong>Silent Witness</strong><span>Shoreditch, London</span></div>
        <em>♡</em>
      </div>
    </PhoneFrame>
  );
}

function EventPhone() {
  return (
    <PhoneFrame className="event-phone">
      <div className="event-image"><img src={artImages[1]} alt="Street art event" /></div>
      <section className="event-panel">
        <span className="label">Event</span>
        <h2>Shoreditch Street<br />Art Walk</h2>
        <InfoLine icon="▣" text="Sat, 24 May 2025" />
        <InfoLine icon="○" text="2:00 PM – 5:00 PM" />
        <InfoLine icon="●" text="Shoreditch, London" link="Open in Maps" />
        <p>Explore iconic murals and hidden gems with local artists. A guided walk through the stories behind Shoreditch’s vibrant street art scene.</p>
        <div className="host-card"><img src={peopleImages[2]} alt="Host" /><div><strong>Alex Mercer</strong><span>Street Artist & Curator</span></div><a>View profile</a></div>
        <div className="event-actions"><button>♡ Save</button><button>Open location</button></div>
      </section>
    </PhoneFrame>
  );
}

function ProfilePhone() {
  return (
    <PhoneFrame className="profile-phone">
      <TopMiniBar title="" right="•••" />
      <header className="profile-header"><img src={peopleImages[1]} alt="Artist" /><div><h2>Drew Merritt</h2><p>@drew.merritt</p><span>London, UK</span><a>drewmerritt.com</a></div></header>
      <div className="stats"><span><strong>36</strong>Artworks</span><span><strong>12</strong>Events</span><span><strong>8</strong>Journeys</span><span><strong>1.2K</strong>Followers</span></div>
      <div className="follow-row"><button>Follow</button><button>✉</button></div>
      <p className="bio">Visual storyteller. Creating bold murals and immersive installations that explore identity, nature and the human experience.</p>
      <div className="tabs"><span className="active">Artworks</span><span>Events</span><span>Journeys</span></div>
      <div className="profile-grid">{artImages.slice(0, 6).map((image) => <img src={image} alt="Artist work" key={image} />)}</div>
    </PhoneFrame>
  );
}

function SavedPhone() {
  return (
    <PhoneFrame className="saved-phone">
      <TopMiniBar title={<><img src={peopleImages[0]} alt="" /> My Space</>} right="⚙" />
      <SectionTitle title="Saved Places" action="See all" />
      <div className="saved-cards">{artImages.slice(0, 3).map((image, i) => <SavedTile image={image} title={['Graffiti Lane', 'Rutland Lane', 'The Hidden Wall'][i]} subtitle={['Dublin', 'Dublin', 'Belfast'][i]} key={image} />)}</div>
      <SectionTitle title="Saved Art" action="See all" />
      <div className="saved-cards">{artImages.slice(1, 4).map((image, i) => <SavedTile image={image} title={['Reflections', 'Urban Eye', 'Quiet Wall'][i]} subtitle="Saved" key={image} />)}</div>
      <SectionTitle title="My Check-ins" action="See all" />
      <div className="check-row">{artImages.slice(2, 6).map((image, i) => <span key={image}><img src={image} alt="Check-in" /><small>{['Brick Lane', 'Shoreditch', 'Camden', 'Belfast'][i]}</small></span>)}</div>
    </PhoneFrame>
  );
}

function SearchField({ text }) { return <div className="search-field"><span>⌕</span><em>{text}</em></div>; }
function FeatureCard({ image, title, subtitle }) { return <div className="feature-card"><img src={image} alt="Featured artwork" /><button>♡</button><div><span>Featured Artwork</span><strong>{title}</strong><small>{subtitle}</small></div></div>; }
function SectionTitle({ title, action }) { return <div className="section-title"><strong>{title}</strong><span>{action}</span></div>; }
function InfoLine({ icon, text, link }) { return <div className="info-row"><span>{icon}</span><strong>{text}</strong>{link && <a>{link}</a>}</div>; }
function SavedTile({ image, title, subtitle }) { return <article className="saved-tile-card"><img src={image} alt="Saved art" /><strong>{title}</strong><span>{subtitle}</span></article>; }
function BoardCaption({ number, title, text }) { return <div className="board-caption"><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div></div>; }

export default App;
