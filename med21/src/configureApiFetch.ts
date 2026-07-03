const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

if (apiBaseUrl && !isLocalHost) {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('/api')) {
      return nativeFetch(`${apiBaseUrl}${input}`, init);
    }

    if (input instanceof Request) {
      const url = new URL(input.url);
      if (url.origin === window.location.origin && url.pathname.startsWith('/api')) {
        return nativeFetch(new Request(`${apiBaseUrl}${url.pathname}${url.search}`, input), init);
      }
    }

    return nativeFetch(input, init);
  };
}
