import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function Settings() {
  const { toast } = useToast();
  const { data: settingsData, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const [form, setForm] = useState({
    siteName: "scholr",
    siteTagline: "Your Next Opportunity is One Click Away",
    defaultWhatsappNumber: "+1234567890",
    contactEmail: "help@scholr.io",
    postsPerPage: "24",
  });

  useEffect(() => {
    if (settingsData) {
      setForm(prev => ({
        siteName: settingsData.siteName || prev.siteName,
        siteTagline: settingsData.siteTagline || prev.siteTagline,
        defaultWhatsappNumber: settingsData.defaultWhatsappNumber || prev.defaultWhatsappNumber,
        contactEmail: settingsData.contactEmail || prev.contactEmail,
        postsPerPage: settingsData.postsPerPage ? String(settingsData.postsPerPage) : prev.postsPerPage,
      }));
    }
  }, [settingsData]);

  const handleSave = () => {
    updateSettings.mutate(
      { data: { siteName: form.siteName, siteTagline: form.siteTagline, defaultWhatsappNumber: form.defaultWhatsappNumber, contactEmail: form.contactEmail, postsPerPage: parseInt(form.postsPerPage) || 24 } },
      {
        onSuccess: () => {
          toast({ title: "Settings saved", description: "Your settings have been updated." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Configure your scholr platform.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 mb-4 space-y-6" data-testid="settings-site">
        <h2 className="font-serif text-xl font-bold">Site Information</h2>

        <div className="space-y-2">
          <Label htmlFor="siteName">Site Name</Label>
          <Input
            id="siteName"
            value={form.siteName}
            onChange={e => setForm(f => ({ ...f, siteName: e.target.value }))}
            className="rounded-xl"
            data-testid="input-site-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="siteTagline">Tagline</Label>
          <Input
            id="siteTagline"
            value={form.siteTagline}
            onChange={e => setForm(f => ({ ...f, siteTagline: e.target.value }))}
            className="rounded-xl"
            data-testid="input-site-tagline"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            type="email"
            value={form.contactEmail}
            onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
            className="rounded-xl"
            data-testid="input-contact-email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postsPerPage">Opportunities Per Page</Label>
          <Input
            id="postsPerPage"
            type="number"
            min="6"
            max="48"
            value={form.postsPerPage}
            onChange={e => setForm(f => ({ ...f, postsPerPage: e.target.value }))}
            className="rounded-xl"
            data-testid="input-posts-per-page"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-6" data-testid="settings-whatsapp">
        <h2 className="font-serif text-xl font-bold">WhatsApp Integration</h2>
        <p className="text-muted-foreground text-sm">
          The default WhatsApp number will be used for opportunity inquiries when no specific number is set on a listing.
        </p>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">Default WhatsApp Number</Label>
          <Input
            id="whatsapp"
            placeholder="+1234567890"
            value={form.defaultWhatsappNumber}
            onChange={e => setForm(f => ({ ...f, defaultWhatsappNumber: e.target.value }))}
            className="rounded-xl"
            data-testid="input-whatsapp-number"
          />
          <p className="text-xs text-muted-foreground">Include country code, e.g. +1234567890</p>
        </div>

        {form.defaultWhatsappNumber && (
          <div className="p-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20">
            <p className="text-sm font-medium text-[#25D366] mb-1">WhatsApp Link Preview</p>
            <a
              href={`https://wa.me/${form.defaultWhatsappNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:underline break-all"
            >
              {`https://wa.me/${form.defaultWhatsappNumber.replace(/\D/g, "")}`}
            </a>
          </div>
        )}
      </div>

      <Button
        onClick={handleSave}
        size="lg"
        className="rounded-xl gap-2 font-semibold"
        disabled={updateSettings.isPending}
        data-testid="button-save-settings"
      >
        {updateSettings.isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Saving...</>
        ) : (
          <><Save size={16} /> Save Settings</>
        )}
      </Button>
    </div>
  );
}
