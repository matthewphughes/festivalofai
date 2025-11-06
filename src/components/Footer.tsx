import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Mail, LogIn } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">Festival of AI</h3>
            <p className="text-muted-foreground text-sm">
              Discover practical AI that actually moves the needle for your business.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-accent transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link to="/speakers" className="text-muted-foreground hover:text-accent transition-colors text-sm">
                  Speakers
                </Link>
              </li>
              <li>
                <Link to="/schedule" className="text-muted-foreground hover:text-accent transition-colors text-sm">
                  Schedule
                </Link>
              </li>
              <li>
                <Link to="/venue" className="text-muted-foreground hover:text-accent transition-colors text-sm">
                  Venue
                </Link>
              </li>
            </ul>
          </div>

          {/* Event Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">Event Info</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>📅 October 16th, 2026</li>
              <li>📍 National Space Center</li>
              <li>🏙️ Leicester, UK</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-lg font-bold mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" aria-label="Email">
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Festival of AI. All rights reserved.
            </p>
            <Link 
              to="/auth" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              <LogIn size={16} />
              <span>Login</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
