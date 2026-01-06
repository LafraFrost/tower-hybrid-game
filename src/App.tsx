import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { HeroProvider } from "./context/HeroContext";
import { Toaster } from "./components/ui/toaster";

// Pages
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPageSupabase";
import AdminPanel from "./pages/AdminPanel";
import HeroSelection from "./pages/HeroSelection";
import MainMenu from "./pages/MainMenu";
import ModeMenu from "./pages/ModeMenu";
import CampaignMap from "./pages/TacticalScreen";
import HomeDashboard from "./pages/HomeDashboard";
import TabletopSession from "./pages/TabletopSession";
import RoomDashboard from "./pages/RoomDashboard";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HeroProvider>
        <Switch>
          {/* Authentication & Setup */}
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/hero-selection" component={HeroSelection} />
          <Route path="/main-menu" component={MainMenu} />
          
          {/* Game Mode Selection */}
          <Route path="/mode" component={ModeMenu} />
          
          {/* Solo Campaign */}
          <Route path="/home" component={HomeDashboard} />
          <Route path="/solo" component={CampaignMap} />
          
          {/* Tabletop Multiplayer */}
          <Route path="/tabletop" component={TabletopSession} />
          <Route path="/tabletop/join/:roomCode" component={TabletopSession} />
          
          {/* Tactical Dashboard (Host Control) */}
          <Route path="/tactical" component={RoomDashboard} />
          
          {/* 404 */}
          <Route>
            <div className="min-h-screen bg-black flex items-center justify-center text-white text-2xl">
              404 - Pagina non trovata
            </div>
          </Route>
        </Switch>
        <Toaster />
      </HeroProvider>
    </QueryClientProvider>
  );
}

