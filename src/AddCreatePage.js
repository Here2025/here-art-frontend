import React, { useMemo, useState } from 'react';

const starter = {
  artwork: {
    title: '',
    artist: '',
    category: 'Mural',
    address: '',
    city: 'Raleigh',
    state: 'NC',
    description: '',
    imageUrl: '',
    lat: '',
    lng: '',
  },
  event: {
    title: '',
    mainCategory: 'Performing Arts',
    localLabel: '',
    eventType: 'Performing Arts',
    venueName: '',
    address: '',
    city: 'Raleigh',
    region: 'NC',
    country: 'United States',
    startsAt: '',
    endsAt: '',
    priceLabel: '',
    description: '',
    imageUrl: '',
    ticketUrl: '',
  },
  profile: {
    displayName: '',
    handle: '',
    profileType: 'explorer',
    city: '',
    region: '',
    country: '',
    website: '',
    bio: '',
    photoName: '',
    photoPreview: '',
  },
};

const eventCategories = [
  'Performing Arts',
  'Fashion',
  'Visual Art',
  'Street Art',
  'Galleries & Exhibitions',
  'Music',
  'Film & Screenings',
  'Creative Markets',
  'Festivals',
  'Workshops & Classes',
  'Hidden Gems',
  'Journeys / Art Walks',
];

const profileTypes = [
  { value: 'explorer', label: 'Explorer' },
  { value: 'artist', label: 'Artist' },
  { value: 'designer', label: 'Designer / Fashion Brand' },
  { value: 'musician', label: 'Musician / Performer' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'venue', label: 'Venue' },
  { value: 'collective', label: 'Collective' },
  { value: 'curator', label: 'Curator / Host' },
];

export default function AddCreatePage({ api, onNotice }) {
  const [mode, setMode] = useState('profile');
  const [profileReady, setProfileReady] = useState(false);
  const [forms, setForms] = useState(starter);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const active = forms[mode];

  const title = useMemo(
    () =>
      ({
        artwork: 'Add artwork or place',
        event: 'Add creative event',
        profile: 'Create or claim profile',
      }[mode]),
    [mode]
  );

  const subtitle = useMemo(
    () =>
      ({
        artwork: 'Pin a mural, gallery, installation, hidden gem, or creative place.',
        event:
          'Share a performance, fashion show, opening, pop-up, walk, screening, market, or creative gathering.',
        profile:
          'Create the profile that owns your posts. After this, you can add artwork, places, events, or both in any order.',
      }[mode]),
    [mode]
  );

  function chooseMode(nextMode) {
    if ((nextMode === 'artwork' || nextMode === 'event') && !profileReady) {
      setMode('profile');
      setStatus(
        'Create or claim a profile first. Then Artwork / Place and Event become available as posting options.'
      );
      return;
    }

    setStatus('');
    setMode(nextMode);
  }

  function update(field, value) {
    setForms((current) => ({
      ...current,
      [mode]: {
        ...current[mode],
        [field]: value,
      },
    }));
  }

  function updateProfilePhoto(file) {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setForms((current) => ({
      ...current,
      profile: {
        ...current.profile,
        photoName: file.name,
        photoPreview: previewUrl,
      },
    }));
  }

  function validate() {
    if ((mode === 'artwork' || mode === 'event') && !profileReady) {
      return 'Create or claim a profile first. Then Artwork / Place and Event become available as posting options.';
    }

    if (mode === 'artwork' && !active.title.trim()) {
      return 'Add a title for the artwork or place.';
    }

    if (mode === 'event' && !active.title.trim()) {
      return 'Add an event title.';
    }

    if (mode === 'profile' && !active.displayName.trim()) {
      return 'Add a profile name.';
    }

    return '';
  }

  async function postSubmission(path, payload) {
    const response = await fetch(`${api}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Unable to submit to ${path}`);
    }

    return response.json().catch(() => ({}));
  }

  async function submit(event) {
    event.preventDefault();
    setStatus('');

    const error = validate();

    if (error) {
      setStatus(error);
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'artwork') {
        await postSubmission('/api/artworks', {
          title: active.title.trim(),
          artist: active.artist.trim(),
          category: active.category,
          description: active.description.trim(),
          address: active.address.trim(),
          city: active.city.trim(),
          state: active.state.trim(),
          imageUrl: active.imageUrl.trim(),
          latitude: active.lat ? Number(active.lat) : null,
          longitude: active.lng ? Number(active.lng) : null,
          lat: active.lat ? Number(active.lat) : null,
          lng: active.lng ? Number(active.lng) : null,
        });

        setStatus('Artwork/place submitted. You can add another artwork/place or switch to Event.');
      } else if (mode === 'event') {
        const displayType = active.localLabel.trim() || active.mainCategory;

        await postSubmission('/api/events', {
          title: active.title.trim(),
          mainCategory: active.mainCategory,
          main_category: active.mainCategory,
          localLabel: active.localLabel.trim(),
          local_label: active.localLabel.trim(),
          eventType: displayType,
          event_type: displayType,
          venueName: active.venueName.trim(),
          venue_name: active.venueName.trim(),
          address: active.address.trim(),
          city: active.city.trim(),
          region: active.region.trim(),
          state: active.region.trim(),
          country: active.country.trim(),
          startsAt: active.startsAt,
          starts_at: active.startsAt,
          endsAt: active.endsAt,
          ends_at: active.endsAt,
          priceLabel: active.priceLabel.trim(),
          price_label: active.priceLabel.trim(),
          description: active.description.trim(),
          imageUrl: active.imageUrl.trim(),
          image_url: active.imageUrl.trim(),
          ticketUrl: active.ticketUrl.trim(),
          ticket_url: active.ticketUrl.trim(),
        });

        setStatus('Event submitted. You can add another event or switch to Artwork / Place.');
      } else {
        await postSubmission('/api/profiles', {
          displayName: active.displayName.trim(),
          handle: active.handle.trim(),
          profileType: active.profileType,
          profile_type: active.profileType,
          city: active.city.trim(),
          region: active.region.trim(),
          state: active.region.trim(),
          country: active.country.trim(),
          website: active.website.trim(),
          bio: active.bio.trim(),
          imageUrl: active.photoPreview || '',
          image_url: active.photoPreview || '',
        });

        setProfileReady(true);
        setStatus(
          'Profile created. Artwork / Place and Event are now available. Choose either option, or add both in any order.'
        );
      }

      setForms((current) => ({
        ...current,
        [mode]: starter[mode],
      }));

      onNotice?.('Submission received. Refresh content after backend review/approval is connected.');
    } catch (submitError) {
      console.warn(submitError);

      if (mode === 'profile') {
        setProfileReady(true);
        setStatus(
          'Profile step saved locally for now. Artwork / Place and Event are now available as posting options. Backend profile saving still needs final connection.'
        );
        onNotice?.(
          'Profile step completed locally for this session. Backend profile route still needs final connection.'
        );
      } else {
        setStatus('Saved as a prototype submission. Backend posting for this type still needs to be finalized.');
        onNotice?.('The form works. Next step is finalizing the matching backend create route.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page add-create-page">
      <div className="add-create-intro">
        <p className="small-kicker">Create on HERE</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>

        {!profileReady && (
          <div className="create-gate-note">
            <strong>Profile first</strong>
            <span>Create or claim a profile before adding artwork, places, or events.</span>
          </div>
        )}

        {profileReady && (
          <div className="create-gate-note ready">
            <strong>Posting options unlocked</strong>
            <span>Add artwork/place, add an event, or add both in any order.</span>
          </div>
        )}

        <div className="create-mode-tabs">
          <button
            className={`${mode === 'artwork' ? 'active' : ''} ${!profileReady ? 'locked' : ''}`}
            onClick={() => chooseMode('artwork')}
            type="button"
            disabled={!profileReady}
          >
            Artwork / Place
          </button>

          <button
            className={`${mode === 'event' ? 'active' : ''} ${!profileReady ? 'locked' : ''}`}
            onClick={() => chooseMode('event')}
            type="button"
            disabled={!profileReady}
          >
            Event
          </button>

          <button
            className={mode === 'profile' ? 'active' : ''}
            onClick={() => chooseMode('profile')}
            type="button"
          >
            Profile
          </button>
        </div>
      </div>

      <form className="create-form-panel" onSubmit={submit}>
        {mode === 'artwork' && <ArtworkFields value={active} update={update} />}
        {mode === 'event' && <EventFields value={active} update={update} />}
        {mode === 'profile' && (
          <ProfileFields
            value={active}
            update={update}
            updateProfilePhoto={updateProfilePhoto}
          />
        )}

        {status && <div className="create-status">{status}</div>}

        <div className="create-form-actions">
          <button
            type="button"
            onClick={() =>
              setForms((current) => ({
                ...current,
                [mode]: starter[mode],
              }))
            }
          >
            Clear
          </button>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : mode === 'profile' ? 'Create profile' : 'Submit'}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, children, wide }) {
  return (
    <label className={wide ? 'wide' : ''}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function ArtworkFields({ value, update }) {
  return (
    <>
      <Field label="Title">
        <input
          value={value.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="Example: Color Story Wall"
        />
      </Field>

      <Field label="Artist / host">
        <input
          value={value.artist}
          onChange={(e) => update('artist', e.target.value)}
          placeholder="Artist, gallery, or unknown"
        />
      </Field>

      <Field label="Category">
        <select value={value.category} onChange={(e) => update('category', e.target.value)}>
          <option>Mural</option>
          <option>Street Art</option>
          <option>Gallery</option>
          <option>Installation</option>
          <option>Exhibition</option>
          <option>Hidden Gem</option>
        </select>
      </Field>

      <Field label="Image URL">
        <input
          value={value.imageUrl}
          onChange={(e) => update('imageUrl', e.target.value)}
          placeholder="Image upload comes next"
        />
      </Field>

      <Field label="Address" wide>
        <input
          value={value.address}
          onChange={(e) => update('address', e.target.value)}
          placeholder="Street, landmark, or neighborhood"
        />
      </Field>

      <Field label="City">
        <input value={value.city} onChange={(e) => update('city', e.target.value)} />
      </Field>

      <Field label="State">
        <input value={value.state} onChange={(e) => update('state', e.target.value)} />
      </Field>

      <Field label="Latitude">
        <input
          value={value.lat}
          onChange={(e) => update('lat', e.target.value)}
          placeholder="35.7796"
        />
      </Field>

      <Field label="Longitude">
        <input
          value={value.lng}
          onChange={(e) => update('lng', e.target.value)}
          placeholder="-78.6382"
        />
      </Field>

      <Field label="Description" wide>
        <textarea
          value={value.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="What should people notice about this place?"
        />
      </Field>
    </>
  );
}

function EventFields({ value, update }) {
  return (
    <>
      <Field label="Event title">
        <input
          value={value.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="Example: Fashion week showcase, Hamilton, local stage play, gallery opening"
        />
      </Field>

      <Field label="Main category">
        <select value={value.mainCategory} onChange={(e) => update('mainCategory', e.target.value)}>
          {eventCategories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </Field>

      <Field label="Local label">
        <input
          value={value.localLabel}
          onChange={(e) => update('localLabel', e.target.value)}
          placeholder="Runway, street style, Broadway, West End, Kabuki, Opera..."
        />
      </Field>

      <Field label="Venue / host">
        <input
          value={value.venueName}
          onChange={(e) => update('venueName', e.target.value)}
          placeholder="Venue, gallery, host, theater, designer, or collective"
        />
      </Field>

      <Field label="Price">
        <input
          value={value.priceLabel}
          onChange={(e) => update('priceLabel', e.target.value)}
          placeholder="Free, $10, RSVP, ticketed, etc."
        />
      </Field>

      <Field label="Starts">
        <input
          type="datetime-local"
          value={value.startsAt}
          onChange={(e) => update('startsAt', e.target.value)}
        />
      </Field>

      <Field label="Ends">
        <input
          type="datetime-local"
          value={value.endsAt}
          onChange={(e) => update('endsAt', e.target.value)}
        />
      </Field>

      <Field label="Address" wide>
        <input
          value={value.address}
          onChange={(e) => update('address', e.target.value)}
          placeholder="Event location"
        />
      </Field>

      <Field label="City">
        <input
          value={value.city}
          onChange={(e) => update('city', e.target.value)}
          placeholder="New York, London, Cairo, Tokyo..."
        />
      </Field>

      <Field label="Region / State / Province">
        <input
          value={value.region}
          onChange={(e) => update('region', e.target.value)}
          placeholder="Optional"
        />
      </Field>

      <Field label="Country">
        <input
          value={value.country}
          onChange={(e) => update('country', e.target.value)}
          placeholder="Country"
        />
      </Field>

      <Field label="Image URL">
        <input
          value={value.imageUrl}
          onChange={(e) => update('imageUrl', e.target.value)}
          placeholder="Event image"
        />
      </Field>

      <Field label="Website / tickets">
        <input
          value={value.ticketUrl}
          onChange={(e) => update('ticketUrl', e.target.value)}
          placeholder="Optional external link"
        />
      </Field>

      <Field label="Description" wide>
        <textarea
          value={value.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="What will people experience?"
        />
      </Field>
    </>
  );
}

function ProfileFields({ value, update, updateProfilePhoto }) {
  return (
    <>
      <Field label="Profile name">
        <input
          value={value.displayName}
          onChange={(e) => update('displayName', e.target.value)}
          placeholder="Your name, artist name, designer, gallery, venue, band, or host name"
        />
      </Field>

      <Field label="Handle">
        <input
          value={value.handle}
          onChange={(e) => update('handle', e.target.value)}
          placeholder="example-name"
        />
      </Field>

      <Field label="Profile type">
        <select value={value.profileType} onChange={(e) => update('profileType', e.target.value)}>
          {profileTypes.map((type) => (
            <option value={type.value} key={type.value}>{type.label}</option>
          ))}
        </select>
      </Field>

      <Field label="Website">
        <input
          value={value.website}
          onChange={(e) => update('website', e.target.value)}
          placeholder="Optional website"
        />
      </Field>

      <Field label="City">
        <input
          value={value.city}
          onChange={(e) => update('city', e.target.value)}
          placeholder="Lusaka, London, Tokyo, Raleigh..."
        />
      </Field>

      <Field label="Region / State / Province">
        <input
          value={value.region}
          onChange={(e) => update('region', e.target.value)}
          placeholder="Optional"
        />
      </Field>

      <Field label="Country">
        <input
          value={value.country}
          onChange={(e) => update('country', e.target.value)}
          placeholder="Country"
        />
      </Field>

      <div className="profile-photo-upload wide">
        <span>Upload profile photo</span>
        <div className="profile-photo-upload-box">
          <div className="profile-photo-preview">
            {value.photoPreview ? (
              <img src={value.photoPreview} alt="Profile preview" />
            ) : (
              <strong>{value.displayName ? value.displayName.slice(0, 1).toUpperCase() : 'H'}</strong>
            )}
          </div>

          <div>
            <label className="upload-button">
              Choose photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => updateProfilePhoto(e.target.files?.[0])}
              />
            </label>

            <p>{value.photoName || 'No photo selected yet.'}</p>
            <small>
              This preview works now. Permanent image storage will be connected when we build
              uploads.
            </small>
          </div>
        </div>
      </div>

      <Field label="Bio" wide>
        <textarea
          value={value.bio}
          onChange={(e) => update('bio', e.target.value)}
          placeholder="Tell people how you use HERE, what kind of art you love, or who this profile represents."
        />
      </Field>
    </>
  );
}
