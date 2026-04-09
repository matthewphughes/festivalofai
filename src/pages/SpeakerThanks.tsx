import { Button } from "@/components/ui/button";
import { CheckCircle2, Youtube, Linkedin, Instagram } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const SpeakerThanks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Application Submitted | Festival of AI</title>
      </Helmet>
      <Navigation />
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <CheckCircle2 className="h-20 w-20 text-primary mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Thank You for <span className="text-primary">Applying</span>
          </h1>
          <div className="bg-card border border-border rounded-lg p-8 mb-8">
            <p className="text-xl text-foreground mb-6">Your speaker application has been successfully submitted!</p>
            <p className="text-muted-foreground mb-8">
              We've received your application and our team will review it carefully.
              You'll receive an email regarding the status of your application.
            </p>
            <div className="border-t border-border pt-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">While you wait...</h2>
              <p className="text-muted-foreground mb-6">Follow us on social media for the latest updates and speaker announcements.</p>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <Button variant="outline" size="lg" asChild>
                  <a href="https://youtube.com/@festivalofai" target="_blank" rel="noopener noreferrer"><Youtube className="h-5 w-5 mr-2" />YouTube</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="https://linkedin.com/company/festivalofai" target="_blank" rel="noopener noreferrer"><Linkedin className="h-5 w-5 mr-2" />LinkedIn</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="https://instagram.com/festivalofai" target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5 mr-2" />Instagram</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="https://tiktok.com/@festivalofai" target="_blank" rel="noopener noreferrer"><SiTiktok className="h-5 w-5 mr-2" />TikTok</a>
                </Button>
              </div>
            </div>
          </div>
          <Link to="/"><Button size="lg">Return to Homepage</Button></Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SpeakerThanks;
