import { useState, useEffect } from "react";
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
      <div className="bg-primary text-primary-foreground py-3 px-4 relative">
        <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <p className="font-semibold text-sm md:text-base truncate">{campaign.banner_message}</p>
            <div className="flex items-center gap-2 text-xs md:text-sm font-mono">
              <span className="bg-primary-foreground text-primary px-2 py-1 rounded">
                {timeLeft.days}d
              </span>
              <span className="bg-primary-foreground text-primary px-2 py-1 rounded">
                {timeLeft.hours}h
              </span>
              <span className="bg-primary-foreground text-primary px-2 py-1 rounded">
                {timeLeft.minutes}m
              </span>
              <span className="bg-primary-foreground text-primary px-2 py-1 rounded">
                {timeLeft.seconds}s
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setDialogOpen(true)}
              variant="secondary"
              size="sm"
              className="whitespace-nowrap"
            >
              Claim Your Discount
            </Button>
            <Button
              onClick={() => setDismissed(true)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
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
