/**
 * Design system: Analist Masası — dark editorial finance terminal with silver data layers.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import XProDashboard from "./pages/XProDashboard";
import XProMethodology from "./pages/XProMethodology";
import XProProviderSettings from "./pages/XProProviderSettings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/x-pro" component={XProDashboard} />
      <Route path="/x-pro/methodology" component={XProMethodology} />
      <Route path="/x-pro/data-providers" component={XProProviderSettings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
