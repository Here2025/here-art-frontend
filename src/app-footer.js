import './hereLocalPrototypeStore';
import './app-profile-type-polish';

const footerTopics = {
  about: {
    title: 'About HERE',
    body: 'HERE is part gallery, part city guide, part artist platform, and part creative event discovery engine. It helps people find art where they are and helps local creative maps grow.',
  },
  terms: {
    title: 'Terms & Conditions',
    body: 'Draft placeholder: HERE users should only post content they have the right to share, respect artists and locations, and use the app responsibly. Final terms will be added before public launch.',
  },
  privacy: {
    title: 'Privacy Policy',
    body: 'Draft placeholder: HERE will need clear privacy language for accounts, profiles, saved places, check-ins, uploads, analytics, location use, and account deletion before public launch.',
  },
  guidelines: {
    title: 'Community Guidelines',
    body: 'Draft placeholder: HERE is for respectful discovery of art, culture, artists, galleries, venues, and creative places. Harmful content, harassment, unsafe sharing, and unauthorized use of creative work should not be allowed.',
  },
  contact: {
    title: 'Contact',
    body: 'Draft placeholder: before launch, HERE should include a support email, content reporting pathway, and partnership contact.',
  },
};

function showFooterPanel(topicKey) {
  const topic = footerTopics[topicKey] || footerTopics.about;
  let panel = document.querySelector('[data-here-footer-panel]');
  if (!panel) {
    panel = document.createElement('section');
    panel.setAttribute('data-here-footer-panel', 'true');
    panel.className = 'here-footer-panel';
    document.body.appendChild(panel);
  }
  panel.innerHTML = `
    <div class="here-footer-panel-card" role="dialog" aria-modal="true" aria-label="${topic.title}">
      <button class="here-footer-close" type="button" aria-label="Close">×</button>
      <p>HERE information</p>
      <h2>${topic.title}</h2>
      <p>${topic.body}</p>
      <small>This is placeholder product copy for the build and should be replaced with final launch-ready language.</small>
    </div>
  `;
  panel.classList.add('show');
  panel.querySelector('.here-footer-close')?.addEventListener('click', () => panel.classList.remove('show'));
}

function installHereFooter() {
  if (document.querySelector('[data-here-footer]')) return;
  const root = document.getElementById('root');
  if (!root) return;
  const footer = document.createElement('footer');
  footer.setAttribute('data-here-footer', 'true');
  footer.className = 'here-public-footer';
  footer.innerHTML = `
    <div class="here-footer-brand-block">
      <button class="here-footer-brand" type="button" data-topic="about"><span>H</span><strong>HERE</strong></button>
      <p>Art around you. A living map for creative places, profiles, events, and journeys.</p>
    </div>
    <nav aria-label="HERE footer links">
      <button type="button" data-topic="about">About HERE</button>
      <button type="button" data-topic="terms">Terms & Conditions</button>
      <button type="button" data-topic="privacy">Privacy Policy</button>
      <button type="button" data-topic="guidelines">Community Guidelines</button>
      <button type="button" data-topic="contact">Contact</button>
    </nav>
  `;
  root.insertAdjacentElement('afterend', footer);
  footer.querySelectorAll('[data-topic]').forEach((button) => {
    button.addEventListener('click', () => showFooterPanel(button.getAttribute('data-topic')));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installHereFooter);
} else {
  installHereFooter();
}
