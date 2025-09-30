
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/pages/HomePage";
import DatabasePage from "@/pages/DatabasePage";
import ToursPage from "@/pages/ToursPage";
import NewTourPage from "@/pages/NewTourPage";
import ChatbotPage from "@/pages/ChatbotPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/database" component={DatabasePage} />
      <Route path="/tours" component={ToursPage} />
      <Route path="/new" component={NewTourPage} />
      <Route path="/chatbot" component={ChatbotPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
