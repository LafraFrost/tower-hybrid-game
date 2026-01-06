import { ILocalPlayerState } from '@/data/GameData';

export interface TurnResult {
  turnPA: number;
  damageMultiplier: number;
  diceRoll: number;
  healAmount?: number;
  effectMessage: string;
}

/**
 * Gestisce l'inizio di un turno di combattimento con lancio del dado
 * 
 * Risultati del dado (d6):
 * - 1: Malus PA (2 invece di 3)
 * - 2-3: Normale (3 PA)
 * - 4: Bonus PA (4 PA)
 * - 5: Bonus Danno (x1.5 danni)
 * - 6: Guarigione (+2 HP)
 */
export const handleStartTurn = (playerState: ILocalPlayerState): TurnResult => {
  const diceRoll = Math.floor(Math.random() * 6) + 1;
  let turnPA = 3; // PA base per turno
  let damageMultiplier = 1;
  let healAmount: number | undefined;
  let effectMessage = '';

  switch(diceRoll) {
    case 1:
      turnPA = 2;
      effectMessage = '⚠️ Malus! Inizi con solo 2 PA questo turno';
      break;
    
    case 2:
    case 3:
      turnPA = 3;
      effectMessage = '🎲 Turno normale - 3 PA disponibili';
      break;
    
    case 4:
      turnPA = 4;
      effectMessage = '⚡ Bonus PA! Hai 4 azioni questo turno';
      break;
    
    case 5:
      turnPA = 3;
      damageMultiplier = 1.5;
      effectMessage = '💥 Bonus Danno! I tuoi attacchi fanno +50% danni';
      break;
    
    case 6:
      turnPA = 3;
      healAmount = 2;
      effectMessage = '❤️ Guarigione! Recuperi 2 HP';
      break;
  }

  return {
    turnPA,
    damageMultiplier,
    diceRoll,
    healAmount,
    effectMessage
  };
};

/**
 * Applica il risultato del turno allo stato del giocatore
 */
export const applyTurnResult = (
  playerState: ILocalPlayerState, 
  turnResult: TurnResult
): ILocalPlayerState => {
  const newState = { ...playerState };
  
  // Applica PA del turno
  newState.currentPA = turnResult.turnPA;
  
  // Applica guarigione se presente
  if (turnResult.healAmount) {
    newState.currentHP = Math.min(
      newState.currentHP + turnResult.healAmount,
      newState.maxHP
    );
  }
  
  return newState;
};

/**
 * Calcola il danno totale considerando il moltiplicatore del turno
 */
export const calculateDamage = (
  baseDamage: number,
  damageMultiplier: number
): number => {
  return Math.floor(baseDamage * damageMultiplier);
};

/**
 * Verifica se il giocatore può giocare una carta
 */
export const canPlayCard = (
  cardCost: number,
  currentPA: number
): boolean => {
  return currentPA >= cardCost;
};

/**
 * Consuma PA per giocare una carta
 */
export const consumePA = (
  currentPA: number,
  cardCost: number
): number => {
  return Math.max(0, currentPA - cardCost);
};
