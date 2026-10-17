import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SandboxPreview from './SandboxPreview.jsx';
import CodeEditor from '../../components/editor/CodeEditor.jsx';
import api, { errMessage } from '../../services/api.js';
import { Spinner, EmptyState } from '../../components/common/ui.jsx';
import { Share2 } from 'lucide-react';

export default function SharedPlayground() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, project: null, error: null });

  useEffect(() => {
    api
      .get(`/api/v1/projects/shared/${slug}`)
      .then(({ data }) => setState({ loading: false, project: data.project, error: null }))
      .catch((err) => setState({ loading: false, project: null, error: errMessage(err) }));
  }, [slug]);

  if (state.loading) {
    return <div className="grid min-h-[60vh] place-items-center"><Spinner className="h-8 w-8" /></div>;
  }
  if (state.error) {
    return <EmptyState icon="🔍" title="Shared project not found" description={state.error} />;
  }
  const p = state.project;
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-3 flex items-center gap-2">
        <Share2 size={16} className="text-brand" aria-hidden />
        <h1 className="text-lg font-semibold">{p.title}</h1>
        <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">read-only shared view</span>
        <Link to="/playground" className="btn btn-secondary btn-sm ml-auto">Make your own</Link>
      </div>
      <div className="grid h-[calc(100vh-9rem)] gap-3 md:grid-cols-2">
        <div className="card-surface overflow-hidden">
          {[['css', p.files?.css], ['html', p.files?.html], ['js', p.files?.js]].filter(([, v]) => v).map(([lang, code]) => (
            <div key={lang} className="border-b border-line last:border-b-0" style={{ height: '33.3%', minHeight: 0 }}>
              <div className="px-3 pt-1.5 font-mono text-[10px] uppercase text-muted">{lang}</div>
              <div style={{ height: 'calc(100% - 22px)' }}>
                <CodeEditor value={code} language={lang === 'js' ? 'js' : lang === 'css' ? 'css' : 'html'} readOnly height="100%" />
              </div>
            </div>
          ))}
        </div>
        <div className="card-surface min-h-0">
          <SandboxPreview html={p.files?.html || ''} css={p.files?.css || ''} js={p.files?.js || ''} className="h-full" />
        </div>
      </div>
    </div>
  );
}
