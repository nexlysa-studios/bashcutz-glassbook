import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { BookingProvider } from "./context/BookingContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { RequireAdmin } from "./components/auth/RequireAdmin";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMerchOrders from "./pages/AdminMerchOrders";
import AdminLogin from "./pages/AdminLogin";
import MerchCatalog from "./pages/MerchCatalog";
import MerchProduct from "./pages/MerchProduct";
import NotFound from "./pages/NotFound";
import BookingSuccess from "./pages/BookingSuccess";
import MerchSuccess from "./pages/MerchSuccess";

const queryClient = new QueryClient();

const INTRO_VIDEO_SRC = "/Video_of_Flying_Scissors_and_Hair_Machines.mp4";
const MOBILE_BREAKPOINT = 768;

type IntroVideoProps = {
  onDone: () => void;
};

const IntroVideo = ({ onDone }: IntroVideoProps) => (
  <div className="fixed inset-0 z-[9999] bg-black">
    <video
      className="h-full w-full object-cover"
      src={INTRO_VIDEO_SRC}
      autoPlay
      muted
      playsInline
      onEnded={onDone}
    />
    <button
      type="button"
      onClick={onDone}
      className="absolute right-6 top-6 rounded-full border border-white/30 bg-black/40 px-4 py-2 text-sm text-white/90 backdrop-blur transition hover:border-white/60 hover:text-white"
      aria-label="Skip intro video"
    >
      Skip
    </button>
  </div>
);

const App = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setShowIntro(false);
    }
  }, [isMobile]);

  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <TooltipProvider>
          <BookingProvider>
            <Toaster />
            <Sonner />
            {showIntro && !isMobile ? (
              <IntroVideo onDone={() => setShowIntro(false)} />
            ) : (
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/merch" element={<MerchCatalog />} />
                  <Route path="/merch/:productId" element={<MerchProduct />} />
                  <Route path="/booking/success" element={<BookingSuccess />} />
                  <Route path="/merch/success" element={<MerchSuccess />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route
                    path="/admin"
                    element={
                      <RequireAdmin>
                        <AdminDashboard />
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/admin/merch-orders"
                    element={
                      <RequireAdmin>
                        <AdminMerchOrders />
                      </RequireAdmin>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            )}
          </BookingProvider>
        </TooltipProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
