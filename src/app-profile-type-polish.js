function polishProfileTypeOptions() {
  document.querySelectorAll('select option[value="street_artist"]').forEach((option) => {
    option.value = 'artist';
    option.textContent = 'Artist';
  });
}

function installProfileTypePolish() {
  polishProfileTypeOptions();

  const root = document.getElementById('root') || document.body;
  if (!root || root.dataset.hereProfileTypePolish === 'true') return;

  root.dataset.hereProfileTypePolish = 'true';

  const observer = new MutationObserver(() => polishProfileTypeOptions());
  observer.observe(root, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installProfileTypePolish);
} else {
  installProfileTypePolish();
}
