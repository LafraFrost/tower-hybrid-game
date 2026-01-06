import { useProfile, useDailyQuests, useCompleteQuest } from "@/hooks/use-profile";
import { StatDisplay } from "@/components/StatDisplay";
import { CyberButton } from "@/components/CyberButton";
import { Loader2, Trophy, Activity, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ProfileView() {
  const { data: user, isLoading: profileLoading } = useProfile();
  const { data: quests, isLoading: questsLoading } = useDailyQuests();
  const { mutate: completeQuest, isPending: isCompleting } = useCompleteQuest();

  if (profileLoading || questsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-8">
      
      {/* Profile Header */}
      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-primary p-1 bg-black shadow-[0_0_15px_rgba(0,255,255,0.3)]">
             <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary font-display font-bold text-xl">
               {user.username.slice(0, 2).toUpperCase()}
             </div>
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white glitch" data-text={user.username}>
              {user.username}
            </h1>
            <p className="text-primary font-mono text-sm tracking-wider">LEVEL {Math.floor((user.xp || 0) / 100) + 1} OPERATIVE</p>
          </div>
        </div>

        {/* Permanent Bonus Stats */}
        <div className="cyber-panel p-4 grid grid-cols-3 gap-2">
          <StatDisplay label="Bonus HP" value={`+${user.bonusHp}`} color="green" />
          <StatDisplay label="Bonus PA" value={`+${user.bonusPa}`} color="cyan" />
          <StatDisplay label="Bonus R2" value={`+${user.bonusR2}`} color="magenta" />
        </div>
      </section>

      {/* Daily Quests */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-secondary" />
            Daily Log
          </h2>
          <span className="text-xs font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded border border-white/10">
            {new Date().toLocaleDateString()}
          </span>
        </div>

        <div className="space-y-3">
          {quests?.map((quest, i) => (
            <motion.div 
              key={quest.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group",
                quest.isCompleted 
                  ? "bg-primary/5 border-primary/30 opacity-70" 
                  : "bg-card border-white/10 hover:border-secondary/50"
              )}
            >
              {/* Progress Line for visual flair */}
              {!quest.isCompleted && (
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-secondary to-transparent" />
              )}

              <div className="flex justify-between items-start mb-2">
                <h3 className={cn("font-bold font-body", quest.isCompleted && "text-primary")}>
                  {quest.description}
                </h3>
                {quest.isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <Circle className="w-5 h-5 text-white/20" />
                )}
              </div>

              <div className="flex justify-between items-center mt-3">
                <div className="flex gap-2 text-xs font-mono">
                  <span className="text-yellow-400 flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> {quest.rewardXp} XP
                  </span>
                  {quest.rewardStatValue && (
                    <span className="text-secondary flex items-center gap-1">
                      + {quest.rewardStatValue} {quest.rewardStatType}
                    </span>
                  )}
                </div>
                
                {!quest.isCompleted && (
                  <CyberButton 
                    variant="secondary" 
                    className="text-xs py-1 px-3 h-8"
                    onClick={() => completeQuest(quest.id)}
                    disabled={isCompleting}
                  >
                    Complete
                  </CyberButton>
                )}
              </div>
            </motion.div>
          ))}
          
          {(!quests || quests.length === 0) && (
             <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-muted-foreground">
               No missions available. Syncing...
             </div>
          )}
        </div>
      </section>
    </div>
  );
}
