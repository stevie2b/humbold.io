import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/layout/layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Explore from "@/pages/explore";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/profile" component={() => <div>Profile Coming Soon</div>} />
      <Route path="/itineraries" component={() => <div>My Itineraries Coming Soon</div>} />
      <Route path="/explore" component={Explore} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Router />
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;