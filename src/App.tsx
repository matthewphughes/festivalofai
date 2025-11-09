import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./contexts/CartContext";
import ErrorBoundary from "./components/ErrorBoundary";
import AppContent from "./components/AppContent";
import Index from "./pages/Index";
import About from "./pages/About";
import Speakers from "./pages/Speakers";
import SpeakerProfile from "./pages/SpeakerProfile";
import Agenda from "./pages/Agenda";
import PreviousEvents from "./pages/PreviousEvents";
import Venue from "./pages/Venue";
import Tickets from "./pages/Tickets";
import ThankYou from "./pages/ThankYou";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MyAccount from "./pages/MyAccount";
import OrderHistory from "./pages/OrderHistory";
import Replays from "./pages/Replays";
import PublicReplays from "./pages/PublicReplays";
import Admin from "./pages/Admin";
import AdminSessions from "./pages/AdminSessions";
import AdminAgendaBuilder from "./pages/AdminAgendaBuilder";
import AdminUsers from "./pages/AdminUsers";
import AdminSpeakers from "./pages/AdminSpeakers";
import NotFound from "./pages/NotFound";
import Accommodation from "./pages/Accommodation";
import Contact from "./pages/Contact";
import Sponsors from "./pages/Sponsors";
import AdminContacts from "./pages/AdminContacts";
import AdminSponsorRequests from "./pages/AdminSponsorRequests";
import AdminSiteSettings from "./pages/AdminSiteSettings";
import AdminStripeProducts from "./pages/AdminStripeProducts";
import AdminCoupons from "./pages/AdminCoupons";
import AdminOrders from "./pages/AdminOrders";
import AdminEmailSettings from "./pages/AdminEmailSettings";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminDiscountCampaigns from "./pages/AdminDiscountCampaigns";
import Checkout from "./pages/Checkout";
import LaunchOffer from "./pages/LaunchOffer";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CartProvider>
            <BrowserRouter>
              <AppContent />
              <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/launch-offer" element={<LaunchOffer />} />
          <Route path="/about" element={<About />} />
          <Route path="/speakers" element={<Speakers />} />
          <Route path="/speakers/:slug" element={<SpeakerProfile />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/admin/sessions" element={<AdminSessions />} />
          <Route path="/admin/agenda-builder" element={<AdminAgendaBuilder />} />
          <Route path="/previous-events" element={<PreviousEvents />} />
          <Route path="/venue" element={<Venue />} />
          <Route path="/accommodation" element={<Accommodation />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/buy-replays" element={<PublicReplays />} />
          <Route path="/replays" element={<Replays />} />
          <Route path="/admin" element={<Admin />} />
          
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/speakers" element={<AdminSpeakers />} />
          <Route path="/admin/contacts" element={<AdminContacts />} />
          <Route path="/admin/sponsor-requests" element={<AdminSponsorRequests />} />
          <Route path="/admin/site-settings" element={<AdminSiteSettings />} />
          <Route path="/admin/stripe-products" element={<AdminStripeProducts />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/email-settings" element={<AdminEmailSettings />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/discount-campaigns" element={<AdminDiscountCampaigns />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/thank-you" element={<ThankYou />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
