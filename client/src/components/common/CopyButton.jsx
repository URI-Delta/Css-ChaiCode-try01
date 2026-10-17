import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useUIStore } from '../../store/uiStore.js';

export default function CopyButton({ text, small }) {
  const [copied, setCopied] = useState(false);
  const toast = useUIStore((s) => s.toast);
  return (
    <button
      className={`btn btn-ghost ${small ? 'btn-sm !p-1' : 'btn-sm'}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast('Clipboard unavailable', 'warn');
        }
      }}
      aria-label="Copy code"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}
