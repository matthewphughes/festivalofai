import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

const claimSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(1, "Phone number is required").max(20, "Phone number must be less than 20 characters"),
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
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('discountBannerCollapsed') === 'true');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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

  // No longer need CSS variable for height since we're using side panel

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
    setIsCollapsed(true); // Close the panel
    setDialogOpen(true);
  };

  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    localStorage.setItem('discountBannerCollapsed', String(newCollapsedState));
    
    trackEvent(newCollapsedState ? "discount_banner_collapsed" : "discount_banner_expanded", {
      campaign_id: campaign?.id,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = claimSchema.safeParse({ name, email, phone });
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
          phone: validation.data.phone,
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
          phone: validation.data.phone,
        },
      });

      if (emailError) throw emailError;

      toast.success("Discount code sent! Check your email.");
      setDialogOpen(false);
      setName("");
      setEmail("");
      setPhone("");
    } catch (error: any) {
      console.error("Error claiming discount:", error);
      toast.error("Failed to send discount code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!campaign || !timeLeft) return null;

  return (
    <>
      {isCollapsed ? (
        // Collapsed tab peeking from right side with pulsing glow
        <div 
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[60] bg-primary text-primary-foreground rounded-l-lg shadow-lg cursor-pointer hover:bg-primary/90 transition-all hover:pr-1 group animate-pulse-glow"
          onClick={handleToggleCollapse}
          style={{
            boxShadow: '0 0 20px 5px hsl(var(--primary) / 0.5), 0 0 40px 10px hsl(var(--primary) / 0.3)'
          }}
        >
          <div className="flex flex-col items-center gap-2 px-3 py-6">
            <span className="text-xs font-bold tracking-wider [writing-mode:vertical-lr] rotate-180">
              SPECIAL OFFER
            </span>
            <div className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </div>
          </div>
        </div>
      ) : (
        // Expanded side panel
        <div 
          ref={bannerRef}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[60] bg-primary text-primary-foreground rounded-l-xl shadow-2xl w-[90vw] max-w-md animate-slide-in-right"
        >
          <div className="p-6">
            {/* Header with close button */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{campaign.banner_message}</h3>
                <p className="text-xs opacity-80">Limited time only!</p>
              </div>
              <Button
                onClick={handleToggleCollapse}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary-foreground/20 -mt-1"
              >
                <ChevronUp className="h-4 w-4 rotate-90" />
              </Button>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex flex-col items-center min-w-[70px] bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-3 py-3 border border-primary-foreground/20">
                <span className="text-3xl font-bold font-mono leading-none">{timeLeft.days}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">Days</span>
              </div>
              <span className="text-2xl font-bold opacity-50">:</span>
              <div className="flex flex-col items-center min-w-[70px] bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-3 py-3 border border-primary-foreground/20">
                <span className="text-3xl font-bold font-mono leading-none">{timeLeft.hours}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">Hours</span>
              </div>
              <span className="text-2xl font-bold opacity-50">:</span>
              <div className="flex flex-col items-center min-w-[70px] bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-3 py-3 border border-primary-foreground/20">
                <span className="text-3xl font-bold font-mono leading-none">{timeLeft.minutes}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">Mins</span>
              </div>
              <span className="text-2xl font-bold opacity-50">:</span>
              <div className="flex flex-col items-center min-w-[70px] bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-3 py-3 border border-primary-foreground/20">
                <span className="text-3xl font-bold font-mono leading-none">{timeLeft.seconds}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">Secs</span>
              </div>
            </div>

            {/* Claim button */}
            <Button
              onClick={handleClaimClick}
              variant="secondary"
              size="lg"
              className="w-full font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              Claim Your Discount
            </Button>
          </div>
        </div>
      )}

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
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 1234 567890"
                required
                maxLength={20}
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
