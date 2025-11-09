import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Menu, X, User, Video, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import logoWhite from "@/assets/logo-white.png";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [archiveDropdownOpen, setArchiveDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email || "");
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
    setUserEmail(session?.user?.email || "");
    if (session?.user) {
      await checkAdminStatus(session.user.id);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();
    
    setIsAdmin(!!data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  const eventLinks = [
    { name: "Venue", path: "/venue" },
    { name: "Accommodation", path: "/accommodation" },
  ];

  const archiveLinks = [
    { name: "Replays", path: "/buy-replays" },
  ];
  
  const isActive = (path: string) => location.pathname === path;
  const isEventActive = eventLinks.some(link => location.pathname === link.path);
  const isArchiveActive = archiveLinks.some(link => location.pathname === link.path);

  return (
    <nav className={cn("fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border transition-shadow", scrolled && "shadow-lg")}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24 py-2">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img 
              src={logoWhite} 
              alt="Festival of AI" 
              className="h-16 w-auto transition-transform group-hover:scale-105" 
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-4">
              <Link to="/" className={cn("text-foreground/80 hover:text-accent transition-colors font-medium px-2", isActive("/") && "text-accent font-semibold")}>
                Home
              </Link>

              <Link to="/speakers" className={cn("text-foreground/80 hover:text-accent transition-colors font-medium px-2", isActive("/speakers") && "text-accent font-semibold")}>
                Speakers
              </Link>

              <Link to="/schedule" className={cn("text-foreground/80 hover:text-accent transition-colors font-medium px-2", isActive("/schedule") && "text-accent font-semibold")}>
                Schedule
              </Link>

              <Link to="/sponsors" className={cn("text-foreground/80 hover:text-accent transition-colors font-medium px-2", isActive("/sponsors") && "text-accent font-semibold")}>
                Sponsors
              </Link>

              <DropdownMenu open={eventDropdownOpen} onOpenChange={setEventDropdownOpen}>
                <DropdownMenuTrigger 
                  className={cn("px-2 py-2 font-medium text-foreground/80 hover:text-accent focus:outline-none inline-flex items-center", isEventActive && "text-accent font-semibold")}
                  onMouseEnter={() => setEventDropdownOpen(true)}
                  onMouseLeave={() => setEventDropdownOpen(false)}
                >
                  Event <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="w-56 bg-background border border-border rounded-md shadow-lg z-50"
                  onMouseEnter={() => setEventDropdownOpen(true)}
                  onMouseLeave={() => setEventDropdownOpen(false)}
                >
                  <DropdownMenuItem asChild>
                    <Link to="/venue" className="cursor-pointer">Venue</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/accommodation" className="cursor-pointer">Accommodation</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu open={archiveDropdownOpen} onOpenChange={setArchiveDropdownOpen}>
                <DropdownMenuTrigger 
                  className={cn("px-2 py-2 font-medium text-foreground/80 hover:text-accent focus:outline-none inline-flex items-center", isArchiveActive && "text-accent font-semibold")}
                  onMouseEnter={() => setArchiveDropdownOpen(true)}
                  onMouseLeave={() => setArchiveDropdownOpen(false)}
                >
                  2025 <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="w-56 bg-background border border-border rounded-md shadow-lg z-50"
                  onMouseEnter={() => setArchiveDropdownOpen(true)}
                  onMouseLeave={() => setArchiveDropdownOpen(false)}
                >
                  <DropdownMenuItem asChild>
                    <Link to="/buy-replays" className="cursor-pointer">Replays</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/contact" className={cn("text-foreground/80 hover:text-accent transition-colors font-medium px-2", isActive("/contact") && "text-accent font-semibold")}>
                Contact
              </Link>
            </div>

            <Button asChild variant="default" className="bg-primary hover:bg-primary/90 ml-2">
              <Link to="/tickets">Get Tickets</Link>
            </Button>

            {isLoggedIn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background z-50">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {userEmail}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/my-account" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/replays" className="cursor-pointer">
                      <Video className="mr-2 h-4 w-4" />
                      Replays
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-foreground/80 hover:text-accent transition-colors font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              
              <Link
                to="/speakers"
                className="text-foreground/80 hover:text-accent transition-colors font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Speakers
              </Link>

              <Link
                to="/schedule"
                className="text-foreground/80 hover:text-accent transition-colors font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Schedule
              </Link>

              <Link
                to="/sponsors"
                className="text-foreground/80 hover:text-accent transition-colors font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Sponsors
              </Link>
              
              <div className="flex flex-col gap-2">
                <div className="text-foreground font-semibold py-2">Event</div>
                {eventLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="text-foreground/80 hover:text-accent transition-colors font-medium py-2 pl-4"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-foreground font-semibold py-2">2025</div>
                {archiveLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="text-foreground/80 hover:text-accent transition-colors font-medium py-2 pl-4"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <Link
                to="/contact"
                className="text-foreground/80 hover:text-accent transition-colors font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>

              <Button asChild variant="default" className="bg-primary hover:bg-primary/90 mt-2">
                <Link to="/tickets" onClick={() => setIsOpen(false)}>
                  Get Tickets
                </Link>
              </Button>

              {isLoggedIn && (
                <>
                  <Link
                    to="/my-account"
                    className="text-foreground/80 hover:text-accent transition-colors font-medium py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    My Account
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-foreground/80 hover:text-accent transition-colors font-medium py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="mt-2"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
