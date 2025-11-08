import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const hotels = [
  {
    name: "Novotel Leicester",
    description: "A new hotel in the heart of the city, slightly higher priced than the others but a more modern and luxurious experience too.",
    image: "https://festivalof.ai/wp-content/uploads/2025/07/a9p4_ho_00_p_2048x1536-1024x768.jpg",
    bookingUrl: "https://www.novotelleicester.com/",
    distance: "Less than 10 minutes by taxi",
    category: "Premium"
  },
  {
    name: "Holiday Inn Leicester by IHG",
    description: "A modern Leicester hotel near the city centre with an open lobby, meeting facilities and spacious bedrooms. There's parking available next door to this hotel.",
    image: "https://festivalof.ai/wp-content/uploads/2025/07/2024-07-17.jpg",
    bookingUrl: "https://www.ihg.com/holidayinn/hotels/gb/en/leicester/lctuk/hoteldetail",
    distance: "Less than 10 minutes by taxi",
    category: "Mid-Range"
  },
  {
    name: "Travelodge Leicester Central",
    description: "Travelodge are a staple hotel chain in the UK's cities, these are standard, straight to the point, cheap and cheerful hotels right in the heart of the city.",
    image: "https://festivalof.ai/wp-content/uploads/2025/07/2021-07-05.jpg",
    bookingUrl: "https://www.travelodge.co.uk/hotels/261/Leicester-Central-hotel",
    distance: "Less than 10 minutes by taxi",
    category: "Budget"
  }
];

const Accommodation = () => {
  return (
    <>
      <Helmet>
        <title>Hotels & Accommodation - Festival of AI 2026</title>
        <meta name="description" content="Find convenient accommodation near the Festival of AI venue in Leicester. Book hotels within walking distance of the event." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="relative py-20 bg-gradient-to-b from-primary/5 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Hotels & Accommodation
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Stay close to the action with our recommended hotels, all a short taxi ride from the venue in Leicester.
                </p>
              </div>
            </div>
          </section>

          {/* Hotels Section */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto space-y-8">
                {hotels.map((hotel, index) => (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="relative h-64 md:h-auto">
                        <img
                          src={hotel.image}
                          alt={hotel.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                            {hotel.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">{hotel.name}</h3>
                          <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 bg-accent rounded-full"></span>
                            {hotel.distance} from venue
                          </p>
                          <p className="text-foreground/80 mb-6">
                            {hotel.description}
                          </p>
                        </div>
                        <Button asChild className="w-full md:w-auto">
                          <a href={hotel.bookingUrl} target="_blank" rel="noopener noreferrer">
                            Book Now
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Travel Information */}
              <div className="max-w-4xl mx-auto mt-16">
                <Card className="p-8">
                  <h2 className="text-2xl font-bold mb-4">Getting to Leicester</h2>
                  <div className="space-y-4 text-foreground/80">
                    <p>
                      Leicester is well connected to major UK cities via train and road networks.
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Direct trains from London St Pancras (1 hour 10 minutes)</li>
                      <li>Easy access from Birmingham, Nottingham, and other major cities</li>
                      <li>Close to M1 motorway for those driving</li>
                      <li>Leicester train station is a 10-minute walk from all recommended hotels</li>
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Accommodation;
