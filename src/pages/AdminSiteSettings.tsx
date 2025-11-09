import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Upload, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const AdminSiteSettings = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState({
    site_title: "",
    site_description: "",
    site_logo_url: "",
    site_share_image_url: "",
    stripe_test_mode: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      if (error) throw error;

      const settingsMap = data.reduce((acc, item) => {
        acc[item.setting_key] = item.setting_value || "";
        return acc;
      }, {} as Record<string, string>);

      setSettings({
        site_title: settingsMap.site_title || "",
        site_description: settingsMap.site_description || "",
        site_logo_url: settingsMap.site_logo_url || "",
        site_share_image_url: settingsMap.site_share_image_url || "",
        stripe_test_mode: settingsMap.stripe_test_mode === "true",
      });
    } catch (error: any) {
      toast.error("Failed to fetch settings: " + error.message);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({
            setting_key: key,
            setting_value: typeof value === "boolean" ? String(value) : value,
          }, {
            onConflict: "setting_key"
          });

        if (error) throw error;
      }

      toast.success("Site settings updated successfully");
    } catch (error: any) {
      toast.error("Failed to update settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, settingKey: string) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("event-assets")
        .getPublicUrl(filePath);

      setSettings((prev) => ({
        ...prev,
        [settingKey]: data.publicUrl,
      }));

      toast.success("File uploaded successfully");
    } catch (error: any) {
      toast.error("Failed to upload file: " + error.message);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24 max-w-4xl">
        <div className="flex items-center gap-2 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      <h1 className="text-3xl font-bold mb-8">Site Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Manage your site's title, description, logo, and share image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="site_title">Site Title</Label>
            <Input
              id="site_title"
              value={settings.site_title}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, site_title: e.target.value }))
              }
              placeholder="Festival of AI 2026"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_description">Site Description</Label>
            <Textarea
              id="site_description"
              value={settings.site_description}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, site_description: e.target.value }))
              }
              placeholder="Join us for the premier AI conference..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <div className="flex gap-2">
              <Input
                id="logo_url"
                value={settings.site_logo_url}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, site_logo_url: e.target.value }))
                }
                placeholder="https://example.com/logo.png"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("logo-upload")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <input
                id="logo-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "site_logo_url");
                }}
              />
            </div>
            {settings.site_logo_url && (
              <img
                src={settings.site_logo_url}
                alt="Logo preview"
                className="mt-2 h-16 object-contain"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="share_image_url">Share Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="share_image_url"
                value={settings.site_share_image_url}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, site_share_image_url: e.target.value }))
                }
                placeholder="https://example.com/share-image.png"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("share-image-upload")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <input
                id="share-image-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "site_share_image_url");
                }}
              />
            </div>
            {settings.site_share_image_url && (
              <img
                src={settings.site_share_image_url}
                alt="Share image preview"
                className="mt-2 max-w-md object-contain"
              />
            )}
          </div>

          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="stripe_test_mode">Stripe Test Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use Stripe test keys for payments (no real charges)
              </p>
            </div>
            <Switch
              id="stripe_test_mode"
              checked={settings.stripe_test_mode}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, stripe_test_mode: checked }))
              }
            />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminSiteSettings;
