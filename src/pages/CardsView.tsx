import { useHand, usePlayCard } from "@/hooks/use-game";
import { GameCard } from "@/components/Card";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function CardsView({ gameId }: { gameId: number }) {
  const { data: cards, isLoading } = useHand(gameId);
  const { mutate: playCard, isPending } = usePlayCard();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-secondary animate-spin" />
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-lg border-2 border-dashed border-white/20 mb-4 flex items-center justify-center">
          <span className="text-2xl font-display text-white/20">0</span>
        </div>
        <h3 className="text-xl font-display text-muted-foreground">Deck Empty</h3>
        <p className="text-sm text-white/40 mt-2">Wait for next turn to draw cards.</p>
      </div>
    );
  }

  return (
    <div className="h-full p-6 overflow-y-auto">
      <h2 className="text-2xl font-display font-bold text-secondary mb-6 neon-text-secondary">
        Battle Deck
      </h2>

      <div className="grid grid-cols-2 gap-4 pb-20">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GameCard 
              card={card}
              onPlay={(id) => playCard({ cardId: id })}
              disabled={isPending}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
