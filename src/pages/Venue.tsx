import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarField from "@/components/StarField";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Train, Car, Plane, Hotel } from "lucide-react";
import venueRockets from "@/assets/venue-rockets.jpg";
import venueExterior from "@/assets/venue-exterior.jpg";
import venuePlanetarium from "@/assets/venue-planetarium.jpg";
import venueEventSpace from "@/assets/venue-event-space.jpg";

const Venue = () => {
  return (
    <div className="min-h-screen relative">
      <StarField />
      <Navigation />

      <main className="pt-32 pb-20 relative z-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              The <span className="text-accent">Venue</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              An inspiring location for an inspiring event
            </p>
          </div>

          {/* Venue Info */}
          <Card className="mb-16 bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-4xl font-bold mb-6">National Space Center</h2>
                  <div className="space-y-4 text-foreground/80">
                    <p className="text-lg">
                      The National Space Center in Leicester is the UK's largest attraction dedicated to space 
                      science and astronomy. It's the perfect venue for exploring the future of AI!
                    </p>
                    <p>
                      With state-of-the-art facilities, inspiring exhibitions, and a truly unique atmosphere, 
                      the National Space Center provides an unforgettable backdrop for our event.
                    </p>
                    <div className="pt-4">
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-accent mt-1" />
                        <div>
                          <p className="font-semibold">Address</p>
                          <p className="text-muted-foreground">
                            Exploration Drive<br />
                            Leicester LE4 5NS<br />
                            United Kingdom
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden h-[400px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2421.9721234567!2d-1.1385!3d52.6547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4877616b6b6b6b6b%3A0x1234567890abcdef!2sNational%20Space%20Centre!5e0!3m2!1sen!2suk!4v1234567890123"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="National Space Center Location"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Venue Photo Gallery */}
          <div className="mb-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Rockets */}
              <div className="relative overflow-hidden rounded-lg aspect-square group">
                <img 
                  src={venueRockets} 
                  alt="PGM 17 THOR rocket display at National Space Center" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-sm font-semibold">Iconic Space Exhibits</p>
                </div>
              </div>

              {/* Exterior */}
              <div className="relative overflow-hidden rounded-lg aspect-square group">
                <img 
                  src={venueExterior} 
                  alt="National Space Center exterior building" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-sm font-semibold">UK's Largest Space Attraction</p>
                </div>
              </div>

              {/* Planetarium */}
              <div className="relative overflow-hidden rounded-lg aspect-square group">
                <img 
                  src={venuePlanetarium} 
                  alt="Planetarium theater at National Space Center" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-sm font-semibold">Immersive Planetarium Experience</p>
                </div>
              </div>

              {/* Event Space */}
              <div className="relative overflow-hidden rounded-lg aspect-square group">
                <img 
                  src={venueEventSpace} 
                  alt="Event space at National Space Center featuring Innovation Challenge" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-sm font-semibold">World-Class Event Facilities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Getting There */}
          <h2 className="text-4xl font-bold text-center mb-12">Getting There</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                  <Train className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">By Train</h3>
                <p className="text-muted-foreground text-sm">
                  Leicester Railway Station is approximately 3 miles from the venue. 
                  Regular trains from London St Pancras (1 hour).
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                  <Car className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">By Car</h3>
                <p className="text-muted-foreground text-sm">
                  Free parking available on-site. Easy access from M1 motorway (Junction 21, 
                  approximately 15 minutes).
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                  <Plane className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">By Air</h3>
                <p className="text-muted-foreground text-sm">
                  Birmingham Airport (40 miles) and East Midlands Airport (20 miles) both offer 
                  excellent connections.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                  <Hotel className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Accommodation</h3>
                <p className="text-muted-foreground text-sm">
                  Numerous hotels available in Leicester city center, with excellent transport 
                  links to the venue.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Facilities */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-8 text-center">Venue Facilities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">✓</span>
                  <p>State-of-the-art conference facilities</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">✓</span>
                  <p>Multiple workshop and breakout rooms</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">✓</span>
                  <p>High-speed WiFi throughout</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">✓</span>
                  <p>Full catering services</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">✓</span>
                  <p>Accessible facilities</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-accent text-2xl">✓</span>
                  <p>On-site café and restaurant</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Venue;
