export function loadAnalyticsScripts() {
  if (import.meta.env.DEV) {
    return;
  }

  const contentsquareScript = document.createElement('script');
  contentsquareScript.src = 'https://t.contentsquare.net/uxa/c5cf445629bd2.js';
  contentsquareScript.async = true;
  document.head.appendChild(contentsquareScript);
}
