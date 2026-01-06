import { Switch, Route, Redirect } from "wouter";
import { Navigation } from "@/components/Navigation";
import ProfileScreen from "@/pages/ProfileScreen";
import TacticalScreen from "@/pages/TacticalScreen";
import DeckScreen from "@/pages/DeckScreen";
import ShopScreen from "@/pages/ShopScreen";
import CombatScreen from "@/pages/CombatScreen";

export default function PlayerHUD() {
  return (
    <div className="min-h-screen bg-black pb-20 font-body text-gray-200">
      <Switch>
        <Route path="/hud/profile" component={ProfileScreen} />
        <Route path="/hud/tactical" component={TacticalScreen} />
        <Route path="/hud/deck" component={DeckScreen} />
        <Route path="/hud/shop" component={ShopScreen} />
        <Route path="/hud/combat" component={CombatScreen} />
        <Route path="/hud">
          <Redirect to="/hud/tactical" />
        </Route>
      </Switch>
      <Navigation />
    </div>
  );
}
