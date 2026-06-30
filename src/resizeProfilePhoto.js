export function resizeProfilePhoto(file, callback, fail) {
  if (!file) return;

  const reader = new FileReader();

  reader.onerror = function () {
    fail?.('The photo could not be read.');
  };

  reader.onload = function () {
    const image = new Image();

    image.onerror = function () {
      fail?.('The photo could not be prepared.');
    };

    image.onload = function () {
      const maxSide = 420;
      const largest = Math.max(image.width || maxSide, image.height || maxSide);
      const ratio = Math.min(1, maxSide / largest);
      const width = Math.max(1, Math.round((image.width || maxSide) * ratio));
      const height = Math.max(1, Math.round((image.height || maxSide) * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.72));
    };

    image.src = String(reader.result || '');
  };

  reader.readAsDataURL(file);
}
