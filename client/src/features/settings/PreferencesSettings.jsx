import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { Card } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { useUIStore as UI } from '../../store/uiStore.js';

export default function PreferencesSettings() {
  const user = useAuthStore((s) => s.user);
  const updatePrefs = useAuthStore((s) => s.updatePrefs);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const reduced = useUIStore((s) => s.reducedMotion);
  const setReduced = useUIStore((s) => s.setReducedMotion);

  const themes = ['dark', 'light', 'system'];
  const fonts = [12, 13, 14, 16];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Preferences</h1>
      <p className="mt-1 text-sm text-muted">Saved to your account — they follow you across devices.</p>

      <Card className="mt-5 grid gap-5">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Theme</div>
          <div className="flex gap-1.5">
            {themes.map((t) => (
              <button
                key={t}
                className={`btn btn-sm ${theme === t ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setTheme(t);
                  updatePrefs({ theme: t }).catch(() => {});
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Editor font size</div>
          <div className="flex gap-1.5">
            {fonts.map((f) => (
              <button
                key={f}
                className={`btn btn-sm ${user?.preferences?.editorFontSize === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => updatePrefs({ editorFontSize: f }).catch(() => {})}
              >
                {f}px
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">Reduced motion</div>
            <p className="text-xs text-muted">Minimize animations. Automatically on if your OS sets it.</p>
          </div>
          <button
            role="switch"
            aria-checked={reduced}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${reduced ? 'bg-brand' : 'bg-elevated border border-line'}`}
            onClick={() => {
              const next = !reduced;
              setReduced(next);
              updatePrefs({ reducedMotion: next }).catch(() => {});
            }}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${reduced ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
      </Card>
    </div>
  );
}
