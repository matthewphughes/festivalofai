import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

interface VideoTestimonialCardProps {
  quote: string;
  author: string;
  year: string;
  thumbnailUrl?: string;
  videoUrl?: string;
}

const VideoTestimonialCard = ({ 
  quote, 
  author, 
  year,
  thumbnailUrl = "/placeholder.svg",
  videoUrl 
}: VideoTestimonialCardProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all group">
      <CardContent className="p-0">
        {/* Video Thumbnail */}
        <div className="relative aspect-video bg-muted/30 overflow-hidden rounded-t-lg">
          <img 
            src={thumbnailUrl} 
            alt={`${author} testimonial`}
            className="w-full h-full object-cover"
          />
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 group-hover:bg-background/20 transition-all">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
              <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>
          {/* Year Badge */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-accent text-accent-foreground font-semibold">
              {year}
            </Badge>
          </div>
        </div>

        {/* Quote & Author */}
        <div className="p-4">
          <p className="text-sm italic text-foreground/80 mb-3 line-clamp-3">
            "{quote}"
          </p>
          <p className="text-sm font-semibold text-accent">
            — {author}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoTestimonialCard;
