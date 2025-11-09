import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

const claimSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
});

interface Campaign {
  id: string;
  discount_code: string;
  countdown_end_date: string;
  banner_message: string;
  email_subject: string;
  email_content: string;
}

const DiscountBanner = () => {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  const { data: campaign } = useQuery({
    queryKey: ["active-discount-campaign"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_campaigns")
        .select("*")
        .eq("is_active", true)
        .gte("countdown_end_date", new Date().toISOString())
        .order("countdown_end_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Campaign | null;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  useEffect(() => {
    if (!campaign) return;

    const calculateTimeLeft = () => {
      const difference = new Date(campaign.countdown_end_date).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [campaign]);

  // Update CSS variable for banner height
  const visible = Boolean(campaign && !dismissed && timeLeft);
  
  useEffect(() => {
    const updateHeight = () => {
      const height = visible && bannerRef.current ? bannerRef.current.offsetHeight : 0;
      document.documentElement.style.setProperty('--discount-banner-height', `${height}px`);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      document.documentElement.style.setProperty('--discount-banner-height', '0px');
      window.removeEventListener('resize', updateHeight);
    };
  }, [visible]);

  const trackEvent = (eventName: string, metadata?: Record<string, any>) => {
    console.log(`[Analytics] ${eventName}`, {
      ...metadata,
      timestamp: new Date().toISOString(),
      page_url: window.location.pathname,
    });
  };

  const handleClaimClick = () => {
    trackEvent("discount_banner_claim_clicked", {
      campaign_id: campaign?.id,
    });
    setDialogOpen(true);
  };

  const handleDismiss = () => {
    trackEvent("discount_banner_dismissed", {
      campaign_id: campaign?.id,
    });
    setDismissed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = claimSchema.safeParse({ name, email });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSubmitting(true);

    try {
      // Create claim record
      const { error: claimError } = await supabase
        .from("discount_claims")
        .insert({
          campaign_id: campaign!.id,
          name: validation.data.name,
          email: validation.data.email,
        });

      if (claimError) throw claimError;

      // Track successful claim
      trackEvent("discount_code_claimed", {
        campaign_id: campaign!.id,
        email: validation.data.email,
      });

      // Send discount email
      const { error: emailError } = await supabase.functions.invoke("send-discount-email", {
        body: {
          campaignId: campaign!.id,
          name: validation.data.name,
          email: validation.data.email,
        },
      });

      if (emailError) throw emailError;

      toast.success("Discount code sent! Check your email.");
      setDialogOpen(false);
      setName("");
      setEmail("");
    } catch (error: any) {
      console.error("Error claiming discount:", error);
      toast.error("Failed to send discount code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!campaign || dismissed || !timeLeft) return null;

  return (
    <>
      <div ref={bannerRef} className="fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground py-4 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 flex-1">
              <p className="font-semibold text-sm md:text-base text-center md:text-left">{campaign.banner_message}</p>
              
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center min-w-[60px] bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-primary-foreground/20">
                  <span className="text-2xl font-bold font-mono leading-none">{timeLeft.days}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">Days</span>
                </div>
                <span className="text-xl font-bold opacity-50">:</span>
                <div className="flex flex-col items-center min-w-[60px] bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-primary-foreground/20">
                  <span className="text-2xl font-bold font-mono leading-none">{timeLeft.hours}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">Hours</span>
                </div>
                <span className="text-xl font-bold opacity-50">:</span>
                <div className="flex flex-col items-center min-w-[60px] bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-primary-foreground/20">
                  <span className="text-2xl font-bold font-mono leading-none">{timeLeft.minutes}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">Mins</span>
                </div>
                <span className="text-xl font-bold opacity-50">:</span>
                <div className="flex flex-col items-center min-w-[60px] bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-primary-foreground/20">
                  <span className="text-2xl font-bold font-mono leading-none">{timeLeft.seconds}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">Secs</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleClaimClick}
                variant="secondary"
                size="sm"
                className="whitespace-nowrap font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                Claim Your Discount
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Your Discount</DialogTitle>
            <DialogDescription>
              Enter your details to receive your exclusive discount code via email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                maxLength={255}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending..." : "Get Discount Code"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DiscountBanner;
