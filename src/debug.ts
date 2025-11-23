// Debug helper - log API key status on load
console.log('[Gemini Debug] API Key present:', !!import.meta.env.VITE_GEMINI_API_KEY);
console.log('[Gemini Debug] Window fallback present:', !!(window as any).__GEMINI_API_KEY__);

// If neither is set, show a clear error
if (!import.meta.env.VITE_GEMINI_API_KEY && !(window as any).__GEMINI_API_KEY__) {
  console.error(
    '%c[Gemini] NO API KEY FOUND!',
    'color: red; font-size: 16px; font-weight: bold',
    '\n\nExpected one of:\n',
    '- VITE_GEMINI_API_KEY in .env.local\n',
    '- window.__GEMINI_API_KEY__ set manually'
  );
}

export {};
