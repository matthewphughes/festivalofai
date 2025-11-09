import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const sponsorRequestSchema = z.object({
  company_name: z.string().trim().min(1, { message: "Company name is required" }).max(100, { message: "Company name must be less than 100 characters" }),
  contact_name: z.string().trim().min(1, { message: "Contact name is required" }).max(100, { message: "Contact name must be less than 100 characters" }),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  phone: z.string().trim().max(50, { message: "Phone must be less than 50 characters" }).optional(),
  message: z.string().trim().max(1000, { message: "Message must be less than 1000 characters" }).optional()
});

type SponsorRequestFormData = z.infer<typeof sponsorRequestSchema>;

const Sponsors = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SponsorRequestFormData>({
    resolver: zodResolver(sponsorRequestSchema)
  });

  const onSubmit = async (data: SponsorRequestFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send-sponsor-request', {
        body: data
      });

      if (error) throw error;

      toast.success("Sponsor pack request sent successfully! We'll be in touch soon.");
      reset();
    } catch (error) {
      console.error('Error sending sponsor request:', error);
      toast.error("Failed to send request. Please try emailing us directly at hello@festivalof.ai");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sponsors - Festival of AI 2026</title>
        <meta name="description" content="Join leading companies in supporting the Festival of AI. Explore sponsorship opportunities and connect with the AI community." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="pt-20">
          {/* Sponsor Request Section */}
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Become a Sponsor
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    Join us in shaping the future of AI. Get in touch to receive our sponsor pack.
                  </p>
                </div>

                <Card className="p-8">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="company_name">Company Name *</Label>
                        <Input
                          id="company_name"
                          {...register("company_name")}
                          placeholder="Your Company Ltd"
                          className={errors.company_name ? "border-destructive" : ""}
                        />
                        {errors.company_name && (
                          <p className="text-sm text-destructive">{errors.company_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact_name">Contact Name *</Label>
                        <Input
                          id="contact_name"
                          {...register("contact_name")}
                          placeholder="John Smith"
                          className={errors.contact_name ? "border-destructive" : ""}
                        />
                        {errors.contact_name && (
                          <p className="text-sm text-destructive">{errors.contact_name.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          placeholder="john@company.com"
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone (Optional)</Label>
                        <Input
                          id="phone"
                          {...register("phone")}
                          placeholder="+44 123 456 7890"
                          className={errors.phone ? "border-destructive" : ""}
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Additional Information (Optional)</Label>
                      <Textarea
                        id="message"
                        {...register("message")}
                        placeholder="Tell us about your sponsorship interests..."
                        rows={4}
                        className={errors.message ? "border-destructive" : ""}
                      />
                      {errors.message && (
                        <p className="text-sm text-destructive">{errors.message.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Request Sponsor Pack"}
                    </Button>
                  </form>
                </Card>

                <div className="mt-8 text-center">
                  <p className="text-muted-foreground">
                    Or email us directly at{" "}
                    <a href="mailto:hello@festivalof.ai" className="text-primary hover:text-primary/80">
                      hello@festivalof.ai
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Sponsors;
