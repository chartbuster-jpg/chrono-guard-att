import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlayCircle, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tutorial {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  display_order: number;
  created_at: string;
}

// Convert YouTube/Vimeo URLs into an embeddable form; fall back to the raw URL.
const toEmbedUrl = (url: string): string => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    /* ignore */
  }
  return url;
};

const youtubeThumb = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
    if (u.hostname === "youtu.be") {
      return `https://img.youtube.com/vi/${u.pathname.slice(1)}/hqdefault.jpg`;
    }
  } catch {
    /* ignore */
  }
  return null;
};

const VideoTutorials = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === "admin";

  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState<Tutorial | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", video_url: "", thumbnail_url: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tutorials")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Failed to load tutorials", description: error.message, variant: "destructive" });
    else setTutorials((data || []) as Tutorial[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.video_url.trim()) {
      return toast({ title: "Title and video URL are required", variant: "destructive" });
    }
    setSaving(true);
    const { error } = await supabase.from("tutorials").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      video_url: form.video_url.trim(),
      thumbnail_url: form.thumbnail_url.trim() || youtubeThumb(form.video_url.trim()),
      display_order: tutorials.length,
    });
    setSaving(false);
    if (error) return toast({ title: "Failed to add tutorial", description: error.message, variant: "destructive" });
    setForm({ title: "", description: "", video_url: "", thumbnail_url: "" });
    setShowForm(false);
    toast({ title: "Tutorial added" });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tutorial?")) return;
    const { error } = await supabase.from("tutorials").delete().eq("id", id);
    if (error) return toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    toast({ title: "Tutorial deleted" });
    load();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Video Tutorials</h1>
          <p className="text-muted-foreground">Learn how to use the attendance system.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm((s) => !s)} variant="hero">
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? "Cancel" : "Add Tutorial"}
          </Button>
        )}
      </div>

      {isAdmin && showForm && (
        <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-custom-md space-y-4">
          <h3 className="text-lg font-semibold">New Tutorial</h3>
          <Input
            placeholder="Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            placeholder="Video URL (YouTube, Vimeo, or MP4) *"
            value={form.video_url}
            onChange={(e) => setForm({ ...form, video_url: e.target.value })}
          />
          <Input
            placeholder="Thumbnail URL (optional — auto-detected for YouTube)"
            value={form.thumbnail_url}
            onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
          />
          <Textarea
            placeholder="Short description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Button onClick={handleAdd} disabled={saving} className="w-full" variant="hero">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Tutorial
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : tutorials.length === 0 ? (
        <div className="bg-gradient-card rounded-xl border border-border p-10 text-center text-muted-foreground">
          No tutorials yet.{isAdmin ? " Click 'Add Tutorial' to post the first one." : " Check back soon."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((t) => {
            const thumb = t.thumbnail_url || youtubeThumb(t.video_url);
            return (
              <div key={t.id} className="bg-gradient-card rounded-xl border border-border p-4 shadow-custom-md flex flex-col">
                <button
                  type="button"
                  onClick={() => setPlaying(t)}
                  className="aspect-video bg-muted rounded-lg overflow-hidden mb-4 relative group"
                >
                  {thumb ? (
                    <img src={thumb} alt={t.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlayCircle className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="w-14 h-14 text-white" />
                  </div>
                </button>
                <h3 className="font-semibold text-foreground mb-1">{t.title}</h3>
                {t.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{t.description}</p>
                )}
                <div className="mt-auto flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setPlaying(t)}>
                    <PlayCircle className="w-4 h-4 mr-2" /> Watch
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {playing && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPlaying(null)}
        >
          <div
            className="w-full max-w-4xl bg-background rounded-xl overflow-hidden shadow-custom-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{playing.title}</h3>
              <div className="flex items-center gap-2">
                <a href={playing.video_url} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                <Button variant="ghost" onClick={() => setPlaying(null)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="aspect-video bg-black">
              {/\.(mp4|webm|ogg)($|\?)/i.test(playing.video_url) ? (
                <video src={playing.video_url} controls autoPlay className="w-full h-full" />
              ) : (
                <iframe
                  src={toEmbedUrl(playing.video_url)}
                  title={playing.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
            {playing.description && (
              <div className="p-4 text-sm text-muted-foreground">{playing.description}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoTutorials;
