import { useHero, GAME_DATA } from "@/context/HeroContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChevronLeft, Coins, ShoppingBag } from "lucide-react";
import { Redirect, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { NeonButton } from "@/components/NeonButton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ShopCard {
  id: string;
  name: string;
  type: string;
  paCost: number;
  description: string;
  price: number;
}

interface SessionData {
  id: number;
  credits: number;
  deckCards: string[];
}

interface PurchaseResult {
  newCredits: number;
  deckCards: string[];
}

export default function ShopScreen() {
  const { playerState, isInitialized } = useHero();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [credits, setCredits] = useState(100);
  const [purchasedCards, setPurchasedCards] = useState<string[]>([]);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  // Get session data
  const sessionQuery = useQuery({
    queryKey: ['/api/hero-session', playerState?.heroName],
    enabled: !!playerState
  });

  useEffect(() => {
    if (sessionQuery.data) {
      const data = sessionQuery.data as SessionData;
      setSessionData(data);
      setCredits(data.credits || 100);
      setPurchasedCards((data.deckCards || []) as string[]);
    }
  }, [sessionQuery.data]);

  // Generate 3 random cards from BASE_CARDS with descriptions
  const shopCards = useMemo((): ShopCard[] => {
    const cardDescriptions: Record<string, string> = {
      'card_1': 'Attacco veloce, infligge 3 danni.',
      'card_2': 'Attacco base, infligge 4 danni.',
      'card_3': 'Aumenta DEF di 2 per questo turno.',
      'card_4': 'Cura 4 HP.',
      'card_5': 'Muovi di 2 caselle.',
      'card_6': 'Muovi di 3 caselle in diagonale.',
      'card_7': 'Scarta 1 carta, pesca 2 carte.',
      'card_8': 'Assorbi il prossimo colpo.'
    };
    
    const allCards = GAME_DATA.BASE_CARDS;
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3).map(card => ({
      id: card.id,
      name: card.name,
      type: card.type,
      paCost: card.paCost,
      description: cardDescriptions[card.id] || 'Carta speciale.',
      price: card.paCost * 15 + Math.floor(Math.random() * 10) + 10
    }));
  }, []);

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async ({ cardId, cost }: { cardId: string; cost: number }) => {
      if (!sessionData?.id) throw new Error('No session');
      const res = await apiRequest('POST', `/api/hero-session/${sessionData.id}/purchase`, { cardId, cost });
      return await res.json() as PurchaseResult;
    },
    onSuccess: (data) => {
      setCredits(data.newCredits);
      setPurchasedCards(data.deckCards);
      toast({
        title: 'Carta acquistata!',
        description: `Aggiunta al tuo mazzo. Crediti rimanenti: ${data.newCredits}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Acquisto fallito',
        description: error.message || 'Crediti insufficienti',
        variant: 'destructive'
      });
    }
  });

  const handlePurchase = (card: ShopCard) => {
    if (credits < card.price) {
      toast({
        title: 'Crediti insufficienti',
        description: `Ti servono ${card.price} crediti, ne hai ${credits}`,
        variant: 'destructive'
      });
      return;
    }
    purchaseMutation.mutate({ cardId: card.id, cost: card.price });
  };

  const handleBack = () => {
    setLocation('/hud/tactical');
  };

  if (!isInitialized || !playerState) {
    return <Redirect to="/" />;
  }

  const { heroName, heroClass } = playerState;
  const colors = GAME_DATA.CLASS_COLORS[heroClass];

  return (
    <div className="min-h-screen pb-4 relative overflow-hidden flex flex-col bg-gradient-to-b from-purple-950/50 via-black to-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-3 border-b border-purple-500/30 bg-black/80 backdrop-blur">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-purple-400 hover:text-purple-300 gap-1"
          data-testid="button-back-shop"
        >
          <ChevronLeft className="w-4 h-4" />
          BACK
        </Button>
        <div className="text-center">
          <h1 className="text-sm font-display text-purple-400 uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Mercante
          </h1>
        </div>
        <div className="flex items-center gap-1 text-amber-400">
          <Coins className="w-4 h-4" />
          <span className="font-mono text-sm">{credits}</span>
        </div>
      </div>

      {/* Merchant greeting */}
      <div className="mx-4 mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
        <p className="text-purple-300 text-sm italic text-center">
          "Benvenuto, {heroName}... Ho carte rare per chi sa pagare."
        </p>
      </div>

      {/* Shop Cards */}
      <div className="flex-1 px-4 mt-4 space-y-3">
        {shopCards.map((card, index) => {
          const isPurchased = purchasedCards.includes(card.id);
          const canAfford = credits >= card.price;
          
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-4 rounded-lg border backdrop-blur",
                isPurchased 
                  ? "bg-green-900/20 border-green-500/30" 
                  : "bg-gray-900/50 border-purple-500/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-display font-bold",
                      isPurchased ? "text-green-400" : "text-white"
                    )}>
                      {card.name}
                    </span>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded border",
                      card.type === 'Attack' ? "text-red-400 border-red-500/30 bg-red-500/10" :
                      card.type === 'Defense' ? "text-blue-400 border-blue-500/30 bg-blue-500/10" :
                      "text-green-400 border-green-500/30 bg-green-500/10"
                    )}>
                      {card.type}
                    </span>
                    <span className="text-[10px] text-yellow-400 font-mono">
                      {card.paCost} PA
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{card.description}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Coins className="w-3 h-3" />
                    <span className="font-mono text-sm">{card.price}</span>
                  </div>
                  
                  {isPurchased ? (
                    <span className="text-[10px] text-green-400 uppercase">Acquistata</span>
                  ) : (
                    <Button
                      size="sm"
                      variant={canAfford ? "default" : "outline"}
                      disabled={!canAfford || purchaseMutation.isPending}
                      onClick={() => handlePurchase(card)}
                      className={cn(
                        "text-xs",
                        canAfford ? "bg-purple-600 hover:bg-purple-500" : ""
                      )}
                      data-testid={`button-buy-${card.id}`}
                    >
                      {purchaseMutation.isPending ? "..." : "Compra"}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mx-4 mt-4 p-3 bg-black/60 border border-purple-500/20 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Carte nel mazzo:</span>
          <span className="text-purple-400 font-mono">{GAME_DATA.BASE_CARDS.length + purchasedCards.length}</span>
        </div>
      </div>

      {/* Continue Button */}
      <div className="mx-4 mt-3">
        <NeonButton 
          variant="secondary" 
          className="w-full"
          onClick={handleBack}
          data-testid="button-continue-shop"
        >
          Continua l'esplorazione
        </NeonButton>
      </div>
    </div>
  );
}
