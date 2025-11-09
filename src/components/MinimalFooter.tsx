import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const MinimalFooter = () => {
  return (
    <footer className="bg-background/50 backdrop-blur-sm border-t border-border/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            &copy; {new Date().getFullYear()} Festival of AI. All rights reserved.
          </p>
          
          {/* Social Links */}
          <div className="flex gap-4">
            <a 
              href="https://facebook.com/festivalofai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-accent transition-colors" 
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </a>
            <a 
              href="https://twitter.com/festivalofai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-accent transition-colors" 
              aria-label="Twitter"
            >
              <Twitter size={18} />
            </a>
            <a 
              href="https://linkedin.com/company/festivalofai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-accent transition-colors" 
              aria-label="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
            <a 
              href="https://instagram.com/festivalofai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-accent transition-colors" 
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
          </div>

          {/* Links */}
          <div className="flex gap-4 text-sm">
            <Link to="/contact" className="text-muted-foreground hover:text-accent transition-colors">
              Contact
            </Link>
            <Link to="/tickets" className="text-muted-foreground hover:text-accent transition-colors">
              Tickets
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MinimalFooter;
