import { useEffect, useState } from 'react';
import api, { errMessage } from '../../services/api.js';
import { Skeleton, Badge, Modal } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { useUIStore } from '../../store/uiStore.js';
import { Table, th, td, AdminError } from './shared.jsx';

const emptyLesson = { title: '', trackId: '', order: 99, description: '', content: '', accessLevel: 'free', status: 'draft', estimatedMinutes: 15, difficulty: 'beginner' };

export default function AdminCourses() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // lesson draft
  const [tab, setTab] = useState('lessons');
  const toast = useUIStore((s) => s.toast);

  const load = () => api.get('/api/v1/admin/content').then(({ data }) => setData(data)).catch((err) => setError(errMessage(err)));
  useEffect(() => { load(); /* eslint-disable-line */ }, []);

  const patchTrack = async (id, patch) => {
    try {
      await api.patch(`/api/v1/admin/tracks/${id}`, patch);
      toast('Track updated', 'success');
      load();
    } catch (err) { toast(errMessage(err), 'error'); }
  };

  const saveLesson = async () => {
    try {
      const body = { ...editing, trackId: editing.trackId || data.tracks[0]._id };        if (body._id) await api.patch(`/api/v1/admin/lessons/${body._id}`, body);
        else await api.post('/api/v1/admin/lessons', body);
      toast('Lesson saved', 'success');
      setEditing(null);
      load();
    } catch (err) { toast(errMessage(err), 'error'); }
  };

  const toggleStatus = async (lesson) => {
    try {
      const patch = lesson.status === 'published' ? 'draft' : 'published';
      if (lesson._id) await api.patch(`/api/v1/admin/lessons/${lesson._id}`, { status: patch });
      toast(`Lesson ${patch}`, 'success');
      load();
    } catch (err) { toast(errMessage(err), 'error'); }
  };

  const toggleAccess = async (lesson) => {
    try {
      if (lesson._id) await api.patch(`/api/v1/admin/lessons/${lesson._id}`, { accessLevel: lesson.accessLevel === 'pro' ? 'free' : 'pro' });
      load();
    } catch (err) { toast(errMessage(err), 'error'); }
  };

  const move = async (lesson) => {
    try {
      if (lesson._id) await api.post('/api/v1/admin/lessons/reorder', { items: [{ id: lesson._id, order: Math.max(1, lesson.order - 1) }] });
      load();
    } catch (err) { toast(errMessage(err), 'error'); }
  };

  if (error) return <AdminError message={error} />;

  return (
    <div className="grid gap-3">
      <div className="flex gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => setTab('tracks')}>Tracks</Button>
        <Button size="sm" variant="ghost" onClick={() => setTab('lessons')}>Lessons</Button>
        <Button size="sm" className="ml-auto" onClick={() => setEditing({ ...emptyLesson, trackId: data?.tracks?.[0]?._id })}>+ New lesson</Button>
      </div>

      {!data && <Skeleton className="h-72" />}

      {data && tab === 'tracks' && (
        <Table head={<tr>{['#', 'Track', 'Slug', 'Lessons', 'Access', 'Published', 'Actions'].map((h, i) => th(h, i))}</tr>}>
          {data.tracks.map((t) => (
            <tr key={t._id}>
              {td(t.order, 'o', 'font-mono text-xs')}
              {td(<span>{t.emoji} {t.title}</span>, 't')}
              {td(<code className="font-mono text-[11px] text-muted">{t.slug}</code>, 's')}
              {td(t.lessonsCount, 'l')}
              {td(
                <Button size="sm" variant="ghost" onClick={() => patchTrack(t._id, { accessLevel: t.accessLevel === 'pro' ? 'free' : 'pro' })}>
                  <Badge tone={t.accessLevel === 'pro' ? 'pro' : 'default'}>{t.accessLevel}</Badge>
                </Button>, 'a'
              )}
              {td(t.published ? <Badge tone="success">yes</Badge> : <Badge>draft</Badge>, 'p')}
              {td(
                <Button size="sm" variant="secondary" onClick={() => patchTrack(t._id, { published: !t.published })}>
                  {t.published ? 'Unpublish' : 'Publish'}
                </Button>, 'act'
              )}
            </tr>
          ))}
        </Table>
      )}

      {data && tab === 'lessons' && (
        <Table head={<tr>{['Order', 'Title', 'Track', 'Status', 'Access', 'Difficulty', 'Actions'].map((h, i) => th(h, i))}</tr>}>
          {data.lessons.map((l) => {
            const track = data.tracks.find((t) => t._id === l.trackId);
            return (
              <tr key={l._id} className="hover:bg-elevated/40">
                {td(l.order, 'o', 'font-mono text-xs')}
                {td(
                  <button className="font-medium hover:text-brand" onClick={() => setEditing({ ...emptyLesson, ...l })}>{l.title}</button>
                  , 't'
                )}
                {td(track ? `${track.emoji} ${track.title}` : '—', 'tr', 'text-xs text-muted')}
                {td(<Badge tone={l.status === 'published' ? 'success' : 'default'}>{l.status}</Badge>, 's')}
                {td(l.accessLevel, 'a', l.accessLevel === 'pro' ? 'text-pro' : 'text-muted')}
                {td(l.difficulty, 'd', 'text-xs text-muted')}
                {td(
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => toggleStatus(l)}>{l.status === 'published' ? 'Unpublish' : 'Publish'}</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleAccess(l)}>{l.accessLevel === 'pro' ? 'To free' : 'To pro'}</Button>
                    <Button size="sm" variant="ghost" onClick={() => move(l)} title="Decrease order number">↑</Button>
                  </div>,
                  'act'
                )}
              </tr>
            );
          })}
        </Table>
      )}

      {editing && (
        <Modal open onClose={() => setEditing(null)} title={editing._id ? 'Edit lesson' : 'New lesson'} wide
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveLesson}>Save lesson</button>
            </>
          }
        >
          <div className="grid gap-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-muted">Title</span>
                <input className="input-base" value={editing.title || ''} onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))} />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted">Track</span>
                <select className="input-base" value={editing.trackId} onChange={(e) => setEditing((s) => ({ ...s, trackId: e.target.value }))}>
                  {data?.tracks.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted">Order</span>
                <input type="number" className="input-base" value={editing.order ?? 0} onChange={(e) => setEditing((s) => ({ ...s, order: Number(e.target.value) }))} />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted">Estimated minutes</span>
                <input type="number" className="input-base" value={editing.estimatedMinutes} onChange={(e) => setEditing((s) => ({ ...s, estimatedMinutes: Number(e.target.value) }))} />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted">Status</span>
                <select className="input-base" value={editing.status} onChange={(e) => setEditing((s) => ({ ...s, status: e.target.value }))}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted">Access</span>
                <select className="input-base" value={editing.accessLevel} onChange={(e) => setEditing((s) => ({ ...s, accessLevel: e.target.value }))}>
                  <option value="free">free</option>
                  <option value="pro">pro</option>
                </select>
              </label>
            </div>
            <label className="grid gap-1">
              <span className="text-xs text-muted">Description</span>
              <input className="input-base" value={editing.description || ''} onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))} />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-muted">Content (Markdown)</span>
              <textarea className="input-base min-h-56 font-mono text-xs" value={editing.content || ''} onChange={(e) => setEditing((s) => ({ ...s, content: e.target.value }))} />
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}
