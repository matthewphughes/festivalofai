import { Link } from "react-router-dom";

const MinimalFooter = () => {
  return (
    <footer className="bg-background/50 backdrop-blur-sm border-t border-border/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            &copy; {new Date().getFullYear()} Festival of AI. All rights reserved.
          </p>

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
