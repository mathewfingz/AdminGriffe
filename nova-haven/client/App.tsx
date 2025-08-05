import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/analytics" element={<Index />} />
          <Route path="/orders" element={<PlaceholderPage title="Orders" />} />
          <Route path="/products" element={<PlaceholderPage title="Products" />} />
          <Route path="/customers" element={<PlaceholderPage title="Customers" />} />
          <Route path="/content" element={<PlaceholderPage title="Content" />} />
          <Route path="/finances" element={<PlaceholderPage title="Finances" />} />
          <Route path="/marketing" element={<PlaceholderPage title="Marketing" />} />
          <Route path="/discounts" element={<PlaceholderPage title="Discounts" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
