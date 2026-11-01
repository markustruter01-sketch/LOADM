import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Film, Play, Trash2, Upload } from "lucide-react";
import type { TrainingModuleVideo } from "@shared/schema";
import { del, upload } from "@/lib/api";
import { keys } from "@/lib/keys";
import { useToast } from "@/hooks/use-toast";
import { EmptyState, formatDate } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "./ConfirmDialog";

const MAX_BYTES = 200 * 1024 * 1024;
const ACCEPT = "video/mp4,video/webm";

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/** Uploaded videos for a module: list, play, upload (field `video`), delete. */
export function ModuleVideos({ moduleId, videos }: { moduleId: number; videos: TrainingModuleVideo[] }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [playing, setPlaying] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<TrainingModuleVideo | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: keys.training.module(moduleId) });
    qc.invalidateQueries({ queryKey: keys.training.all });
  };

  const send = useMutation({
    mutationFn: (fd: FormData) => upload<TrainingModuleVideo>(`/api/training/modules/${moduleId}/videos`, fd),
    onSuccess: () => {
      invalidate();
      toast({ title: "Video uploaded" });
      setFile(null);
      setTitle("");
      setDescription("");
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Upload failed", description: e.message }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => del<{ id: number }>(`/api/training/videos/${id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Video deleted" });
      setDeleting(null);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Could not delete video", description: e.message }),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast({ variant: "destructive", title: "File too large", description: "Videos must be 200 MB or smaller." });
      return;
    }
    const fd = new FormData();
    fd.append("video", file);
    fd.append("title", title.trim() || file.name.replace(/\.[^.]+$/, ""));
    if (description.trim()) fd.append("description", description.trim());
    send.mutate(fd);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-2">
        {videos.length === 0 ? (
          <EmptyState title="No videos uploaded" description="MP4 or WebM, up to 200 MB." icon={<Film className="h-8 w-8" />} />
        ) : (
          videos.map((v) => (
            <Card key={v.id} className="border-border/60 bg-card/60">
              <CardContent className="space-y-3 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{v.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.fileName} · {formatSize(v.fileSize)} · {formatDate(v.createdAt)}
                    </div>
                    {v.description && <p className="mt-1 text-sm text-muted-foreground">{v.description}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => setPlaying(playing === v.id ? null : v.id)} aria-label={playing === v.id ? `Hide ${v.title}` : `Play ${v.title}`}>
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(v)} aria-label={`Delete ${v.title}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {playing === v.id && <video src={`/api/training/videos/${v.id}/stream`} controls className="w-full rounded-md bg-black" preload="metadata" />}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-4">
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="text-sm font-medium">Upload a video</div>
            <div className="space-y-1">
              <Label htmlFor="video-file">File</Label>
              <Input id="video-file" ref={fileRef} type="file" accept={ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="video-title">Title</Label>
              <Input id="video-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Defaults to the file name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="video-description">Description</Label>
              <Textarea id="video-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={!file || send.isPending}>
              <Upload className="h-4 w-4" /> {send.isPending ? "Uploading…" : "Upload"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.title ?? ""}"?`}
        description="The file is removed from the server. This cannot be undone."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
