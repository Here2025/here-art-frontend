let refreshTimer;

function shouldRefreshForCreate(detail) {
  return ['artworks', 'events', 'profiles'].includes(detail?.type);
}

function scheduleCreatedContentRefresh(event) {
  if (!shouldRefreshForCreate(event?.detail)) return;

  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    window.location.reload();
  }, 750);
}

if (typeof window !== 'undefined' && !window.__HERE_AUTO_REFRESH_CREATED_CONTENT__) {
  window.__HERE_AUTO_REFRESH_CREATED_CONTENT__ = true;
  window.addEventListener('here-local-content-saved', scheduleCreatedContentRefresh);
}
