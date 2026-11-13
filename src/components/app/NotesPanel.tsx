import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileText, Paperclip, Trash2, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { addNote, deleteFile, deleteNote, getActivityExtras, recordFile } from "@/lib/api.functions";
import { errMsg, who } from "@/lib/ui";
import { selectClass, type Data } from "./parts";

const fmtSize = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
const fmtDate = (s: string) => new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Comments, documents and "let them know" heads-ups for one activity (doctor visits, teacher meetings…). */
export function NotesPanel({ data, activityId }: { data: Data; activityId: string }) {
  const q = useQuery({ queryKey: ["extras", activityId], queryFn: () => getActivityExtras({ data: { id: activityId } }) });
  const add = useServerFn(addNote);
  const delN = useServerFn(deleteNote);
  const rec = useServerFn(recordFile);
  const delF = useServerFn(deleteFile);
  const others = data.members.filter((m) => m.id !== data.me.id);
  const [body, setBody] = useState("");
  const [notify, setNotify] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mem = (id: string | null) => who(data.members.find((m) => m.id === id));

  const post = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      await add({ data: { activityId, body, notifyMemberId: notify || null } });
      toast.success(notify ? `Saved — ${mem(notify)} will see it in their notifications` : "Note saved");
      setBody(""); setNotify(""); await q.refetch();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 20e6) { toast.error(`${file.name} is larger than 20 MB`); continue; }
        const path = `${data.household.id}/${activityId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error } = await supabase.storage.from("activity-docs").upload(path, file);
        if (error) throw error;
        await rec({ data: { activityId, name: file.name, path, size: file.size } });
      }
      toast.success("Document added"); await q.refetch();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const open = async (path: string) => {
    const { data: s, error } = await supabase.storage.from("activity-docs").createSignedUrl(path, 300);
    if (error || !s) { toast.error("Couldn't open this file"); return; }
    window.open(s.signedUrl, "_blank", "noopener");
  };

  return (
    <section className="space-y-6 rounded-3xl border bg-card p-5 shadow-soft">
      <div>
        <h2 className="text-xl font-bold">Notes & documents</h2>
        <p className="text-sm text-muted-foreground">What the doctor said, what the teacher asked for, forms to sign…</p>
      </div>

      <div className="space-y-3">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} placeholder="e.g. Dr. Lee wants a follow-up in 3 weeks. Bring the vaccine card." className="min-h-24 rounded-2xl" />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <BellRing className="h-4 w-4 text-primary" /> Let someone know
            <select className={selectClass + " h-10 w-auto"} value={notify} onChange={(e) => setNotify(e.target.value)}>
              <option value="">No one</option>
              {others.map((m) => <option key={m.id} value={m.id}>{who(m)}</option>)}
            </select>
          </label>
          <Button onClick={post} disabled={busy || !body.trim()} className="ml-auto">{notify ? `Save & tell ${mem(notify)}` : "Save note"}</Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Documents</h3>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}><Paperclip className="h-4 w-4" />Add file</Button>
          <input ref={fileRef} type="file" multiple className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" onChange={(e) => upload(e.target.files)} />
        </div>
        {q.data?.files.length ? (
          <ul className="divide-y rounded-2xl border">
            {q.data.files.map((f) => (
              <li key={f.id} className="flex items-center gap-3 p-3">
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <button className="min-w-0 flex-1 truncate text-left font-semibold hover:underline" onClick={() => open(f.path)}>{f.name}</button>
                <span className="text-xs text-muted-foreground">{fmtSize(f.size)} · {mem(f.uploaded_by_member_id)}</span>
                <Button size="icon" variant="ghost" aria-label="Remove file" onClick={async () => { try { await delF({ data: { id: f.id } }); await q.refetch(); } catch (e) { toast.error(errMsg(e)); } }}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">No documents yet.</p>}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Notes</h3>
        {q.data?.notes.length ? (
          <ul className="space-y-2">
            {q.data.notes.map((n) => (
              <li key={n.id} className="rounded-2xl bg-secondary p-3">
                <p className="whitespace-pre-wrap">{n.body}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{mem(n.author_member_id)} · {fmtDate(n.created_at)}{n.notify_member_id ? ` · told ${mem(n.notify_member_id)}` : ""}</span>
                  {n.author_member_id === data.me.id && <button className="ml-auto font-semibold hover:text-attention" onClick={async () => { try { await delN({ data: { id: n.id } }); await q.refetch(); } catch (e) { toast.error(errMsg(e)); } }}>Delete</button>}
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">No notes yet.</p>}
      </div>
    </section>
  );
}
