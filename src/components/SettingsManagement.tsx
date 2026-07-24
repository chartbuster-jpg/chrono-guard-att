import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSettings, updateSettings, getCurrentPosition, type AppSettings } from "@/lib/settings";

const SettingsManagement = () => {
  const [s, setS] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getSettings().then(setS);
  }, []);

  if (!s) {
    return <p className="text-muted-foreground">Loading settings…</p>;
  }

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setS({ ...s, school_lat: pos.coords.latitude, school_lng: pos.coords.longitude });
      toast({ title: "Location captured", description: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}` });
    } catch (e) {
      toast({ title: "Location denied", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    setSaving(true);
    const { error } = await updateSettings({
      school_name: s.school_name,
      school_lat: s.school_lat,
      school_lng: s.school_lng,
      geofence_radius_m: s.geofence_radius_m,
      qr_expiry_seconds: s.qr_expiry_seconds,
    });
    setSaving(false);
    if (error) toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    else toast({ title: "Settings saved" });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">System Settings</h1>
        <p className="text-muted-foreground">Geofencing coordinates and QR configuration used across the app.</p>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <Label>School Name</Label>
          <Input value={s.school_name} onChange={(e) => setS({ ...s, school_name: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Latitude</Label>
            <Input
              type="number"
              step="any"
              value={s.school_lat ?? ""}
              onChange={(e) => setS({ ...s, school_lat: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
          <div>
            <Label>Longitude</Label>
            <Input
              type="number"
              step="any"
              value={s.school_lng ?? ""}
              onChange={(e) => setS({ ...s, school_lng: e.target.value ? parseFloat(e.target.value) : null })}
            />
          </div>
        </div>

        <Button variant="outline" onClick={useMyLocation} disabled={locating}>
          {locating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
          Use my current location
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Geofence Radius (meters)</Label>
            <Input
              type="number"
              value={s.geofence_radius_m}
              onChange={(e) => setS({ ...s, geofence_radius_m: parseInt(e.target.value || "0") })}
            />
          </div>
          <div>
            <Label>QR Expiry (seconds)</Label>
            <Input
              type="number"
              value={s.qr_expiry_seconds}
              onChange={(e) => setS({ ...s, qr_expiry_seconds: parseInt(e.target.value || "0") })}
            />
          </div>
        </div>

        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </Card>
    </div>
  );
};

export default SettingsManagement;
