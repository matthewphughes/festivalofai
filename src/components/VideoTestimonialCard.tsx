import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import VideoModal from "@/components/VideoModal";

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
  thumbnailUrl,
  videoUrl 
}: VideoTestimonialCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate thumbnail from video URL if not provided
  const getVideoThumbnail = (url?: string): string => {
    if (thumbnailUrl) return thumbnailUrl;
    if (!url) return "/placeholder.svg";

    // Vimeo thumbnail (with or without privacy hash)
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
    }

    // YouTube thumbnail
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
    }

    return "/placeholder.svg";
  };

  const handleClick = () => {
    if (videoUrl) {
      setIsModalOpen(true);
    }
  };

  const thumbnail = getVideoThumbnail(videoUrl);

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm border-border hover:border-primary transition-all group">
        <CardContent className="p-0">
          {/* Video Thumbnail */}
          <div 
            className={`relative aspect-video bg-muted/30 overflow-hidden rounded-t-lg ${videoUrl ? 'cursor-pointer' : ''}`}
            onClick={handleClick}
          >
            <img 
              src={thumbnail} 
              alt={`${author} testimonial`}
              className="w-full h-full object-cover"
            />
            {/* Play Button Overlay */}
            {videoUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/40 group-hover:bg-background/20 transition-all">
                <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
                </div>
              </div>
            )}
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

      {videoUrl && (
        <VideoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          videoUrl={videoUrl}
          title={`${author} testimonial`}
        />
      )}
    </>
  );
};

export default VideoTestimonialCard;
