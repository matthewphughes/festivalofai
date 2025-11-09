import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

interface EmailSetting {
  setting_key: string;
  setting_value: string;
  label: string;
  description: string;
}

const emailSettings: EmailSetting[] = [
  {
    setting_key: "email_notify_new_orders",
    setting_value: "true",
    label: "New Order Notifications",
    description: "Receive email when a new order is placed",
  },
  {
    setting_key: "email_notify_sponsor_requests",
    setting_value: "true",
    label: "Sponsor Request Notifications",
    description: "Receive email when a new sponsor request is submitted",
  },
  {
    setting_key: "email_notify_contact_submissions",
    setting_value: "true",
    label: "Contact Form Notifications",
    description: "Receive email when someone submits the contact form",
  },
  {
    setting_key: "email_notify_new_users",
    setting_value: "false",
    label: "New User Registrations",
    description: "Receive email when a new user registers",
  },
];

const AdminEmailSettings = () => {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("email_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const settingsMap: Record<string, boolean> = {};
      emailSettings.forEach((setting) => {
        const dbSetting = data?.find((s) => s.setting_key === setting.setting_key);
        settingsMap[setting.setting_key] = dbSetting?.setting_value === "true";
      });

      setSettings(settingsMap);
    } catch (error: any) {
      toast.error("Failed to load email settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (settingKey: string, newValue: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("email_settings")
        .upsert({
          setting_key: settingKey,
          setting_value: newValue.toString(),
        }, {
          onConflict: "setting_key",
        });

      if (error) throw error;

      setSettings((prev) => ({ ...prev, [settingKey]: newValue }));
      toast.success("Email notification setting updated");
    } catch (error: any) {
      toast.error("Failed to update setting: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center gap-2 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Email Notification Settings</h1>
          <p className="text-muted-foreground">
            Control which events trigger email notifications to administrators
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Enable or disable email notifications for different types of events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {emailSettings.map((setting) => (
              <div
                key={setting.setting_key}
                className="flex items-center justify-between space-x-4 p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <Label htmlFor={setting.setting_key} className="text-base font-medium">
                    {setting.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {setting.description}
                  </p>
                </div>
                <Switch
                  id={setting.setting_key}
                  checked={settings[setting.setting_key] || false}
                  onCheckedChange={(checked) => handleToggle(setting.setting_key, checked)}
                  disabled={saving}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default AdminEmailSettings;
