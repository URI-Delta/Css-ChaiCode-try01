import { useEffect, useMemo, useRef } from 'react';

/* The preview never executes in the main origin: we assemble a full HTML doc
 * and hand it to a sandboxed iframe with:
 *  - no same-origin privileges (allow-same-origin omitted)
 *  - no scripts→parent communication, no cookies/storage access
 *  - CSP that blocks everything except inline styles the user writes and
 *    an allowlist for https:// images. Network fetch/XHR is denied.
 */

const CSP = [
  "default-src 'none'",
  "img-src https: data:",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "media-src https: data:",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

export default function SandboxPreview({ html = '', css = '', js = '', className, onError, onReady }) {
  const iframeRef = useRef(null);

  const doc = useMemo(() => {
    const userJs = js
      ? {
          prelude: 'try {',
          epilogue:
            '} catch (e) { parent.postMessage({ source: "css-visual-preview", type: "error", message: String(e && e.message || e) }, "*"); }',
        }
      : null;

    // Bridge runtime errors so the UI can show useful feedback — done via a
    // small inline script loaded INSIDE the sandbox, not evaluated by React.
    const runtime = `
<script>
window.addEventListener('error', function (e) {
  parent.postMessage({ source: 'css-visual-preview', type: 'error', message: String(e.message || e.error) }, '*');
});
</script>
<script>${userJs ? userJs.prelude : ''}
${js}
${userJs ? userJs.epilogue : ''}
</script>`.trim();

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="${CSP}" />
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; padding: 12px; background: #fff; color: #111; font-family: system-ui, -apple-system, sans-serif; }
  html[data-theme="dark"] body { background: #151610; color: #eee8d8; }
</style>
<style>${css}</style>
</head>
<body>
${html}
${runtime}
</body>
</html>`;
  }, [html, css, js]);

  // Re-keying the iframe on every doc change is the simplest reliable "reload".
  const key = useMemo(() => doc.length, [doc]);

  useEffect(() => {
    if (!onReady) return undefined;
    const onMsg = (e) => {
      if (e.data?.source === 'css-visual-preview') {
        if (e.data.type === 'error') onError?.(e.data.message);
        if (e.data.type === 'ready') onReady?.();
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [onReady, onError]);

  return (
    <iframe
      ref={iframeRef}
      key={key}
      className={className}
      title="User code preview"
      sandbox="allow-scripts" /* no allow-same-origin: origin access is denied */
      csp={CSP}
      srcDoc={doc}
      style={{ borderRadius: 10, width: '100%', height: '100%', border: '1px solid var(--border)', background: '#fff' }}
    />
  );
}
