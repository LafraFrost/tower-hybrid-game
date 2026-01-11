# Sistema di Progressione Miniera a 4 Stati

## Panoramica
Implementato sistema progressivo per la Miniera con 4 stati distinti basati su campi del database.

## Stati della Miniera

### STATO 0: Invisibile (Pre-Goblin)
- **Condizione**: `is_unlocked = false`
- **Visualizzazione**: Nessun rendering sulla mappa
- **Trigger Unlock**: Vittoria nel mini-combat Goblin → `handleMiniCombatVictory()` setta `is_unlocked = true`

### STATO 1: Triangolo Esplorativo (Post-Goblin)
- **Condizione**: `is_unlocked = true` && `mine_map_completed = false` && `is_built = false`
- **Visualizzazione**: 
  - Triangolo giallo animato (bounce)
  - Etichetta: "ESPLORA MINIERA"
  - Posizione: top: 25%, left: 18%
- **Azione Click**: Naviga a `/map/22` (Mappa della Miniera)
- **File**: [HomeDashboard.tsx:1456-1510](../src/pages/HomeDashboard.tsx#L1456-L1510)

### STATO 2: Martello Ricostruttivo (Post-Mappa 22)
- **Condizione**: `is_unlocked = true` && `mine_map_completed = true` && `is_built = false`
- **Visualizzazione**: 
  - Icona martello (animate-pulse)
  - Glow dorato (drop-shadow)
  - Etichetta: "RICOSTRUISCI"
- **Azione Click**: Apre popup pagamento risorse (`setShowMineRebuildPopup(true)`)
- **Trigger Unlock**: Vittoria Boss Nodo 22 → `finishBattle()` chiama `setMineMapCompleted()`
- **File**: [TacticalScreen.tsx:729-752](../src/pages/TacticalScreen.tsx#L729-L752)

### STATO 3: Edificio Completo (Costruita)
- **Condizione**: `is_unlocked = true` && `is_built = true`
- **Visualizzazione**: 
  - Sprite `/assets/miniera_edificio.png`
  - Tooltip: "Miniera Attiva"
  - Drop shadow XL
- **Azione Click**: Nessuna (edificio attivo)
- **Trigger**: `confirmMineRebuild()` → paga risorse → setta `is_built = true`

## Campi Database (game_locations)

```sql
CREATE TABLE game_locations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  -- Campi di progressione Mine:
  is_unlocked BOOLEAN DEFAULT true,           -- False solo per Miniera
  mine_map_completed BOOLEAN DEFAULT false,   -- True dopo vittoria nodo 22
  is_built BOOLEAN DEFAULT false,             -- True dopo pagamento risorse
  is_under_attack BOOLEAN DEFAULT false,      -- Future feature
  -- Altri campi...
);
```

## Flusso di Gioco Completo

1. **Inizio Gioco**: Miniera invisibile (`is_unlocked: false` in baseLocations)
2. **Difesa Villaggio**: Player vince mini-combat Goblin
3. **Unlock STATO 1**: `handleMiniCombatVictory()` setta `is_unlocked: true`
4. **Appare Triangolo**: Player vede triangolo giallo "ESPLORA MINIERA"
5. **Click Triangolo**: Redirect a `/map/22` (routing aggiunto in App.tsx)
6. **Completa Mappa 22**: Player sconfigge Boss
7. **Unlock STATO 2**: `finishBattle()` chiama `setMineMapCompleted()` → `mine_map_completed: true`
8. **Appare Martello**: Player vede martello dorato "RICOSTRUISCI"
9. **Click Martello**: Apre popup con costo risorse
10. **Paga Risorse**: `confirmMineRebuild()` setta `is_built: true`
11. **STATO 3 Attivo**: Edificio miniera visualizzato, produzione attiva

## File Modificati

### 1. shared/schema.ts
- Aggiunti campi `is_unlocked`, `mine_map_completed`, `is_under_attack` a `gameLocations`
- Defaults: `is_unlocked: true` (tranne Miniera), `mine_map_completed: false`, `is_under_attack: false`

### 2. src/pages/HomeDashboard.tsx (linee 1456-1510)
- Rendering condizionale basato su 3 stati
- Handler `handleMineClick()` con logica if/else:
  - Se `!isMapCompleted` → naviga a `/map/22`
  - Se `isMapCompleted && !isBuilt` → apre popup
  - Se `isBuilt` → nessuna azione

### 3. src/pages/TacticalScreen.tsx
- **Linee 729-752**: `finishBattle()` chiama `setMineMapCompleted()` dopo vittoria nodo 22
- **Linee 880-915**: Nuova funzione `setMineMapCompleted()`:
  ```typescript
  await fetch(`${url}/rest/v1/game_locations?user_id=eq.1&name=eq.Miniera`, {
    method: "PATCH",
    body: JSON.stringify({ mine_map_completed: true }),
  });
  ```

### 4. src/App.tsx (linea 39)
- Aggiunto route: `<Route path="/map/:mapId" component={CampaignMap} />`
- Supporta navigazione diretta a mappe specifiche (es. `/map/22`)

### 5. migrations/add_mine_progression_fields.sql
- Script SQL per aggiungere i 3 nuovi campi al database Supabase
- Include UPDATE per settare `is_unlocked: false` su Miniera esistenti
- Commenti per documentazione

## Migrazione Database

Per applicare i cambiamenti al database Supabase, eseguire nella dashboard SQL Editor:

```sql
-- Vedi migrations/add_mine_progression_fields.sql per lo script completo
ALTER TABLE game_locations 
ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_under_attack BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mine_map_completed BOOLEAN DEFAULT false;

UPDATE game_locations 
SET is_unlocked = false 
WHERE name = 'Miniera';
```

## Testing Checklist

- [ ] Miniera invisibile all'avvio (STATO 0)
- [ ] Triangolo appare dopo vittoria Goblin (STATO 1)
- [ ] Click triangolo porta a `/map/22`
- [ ] Martello appare dopo vittoria Boss Nodo 22 (STATO 2)
- [ ] Click martello apre popup ricostruzione
- [ ] Edificio appare dopo pagamento (STATO 3)
- [ ] Console logs confermano transizioni di stato
- [ ] Database aggiorna correttamente `mine_map_completed`

## Debug Logs

Il sistema include logging estensivo:
```typescript
console.log('🔍 Mine filter check:', { isMine, isUnlocked, ... });
console.log('🏔️ Mine state:', { is_unlocked, mine_map_completed, is_built });
console.log('🗺️ Navigating to Mine map (22)...');
console.log('✅ Mine STATO 2: mine_map_completed = true');
```

## Note Implementative

1. **100% DB-Driven**: Nessun localStorage, tutti gli stati provengono da Supabase
2. **Atomic Transitions**: Ogni stato è mutuamente esclusivo
3. **UI Responsive**: Tailwind CSS con animazioni (bounce, pulse)
4. **Error Handling**: Try/catch su tutte le chiamate fetch
5. **User Feedback**: Toast notifications per ogni transizione

## Future Enhancements

- [ ] Animazione di transizione tra stati (fade in/out)
- [ ] Particle effects su unlock
- [ ] Sound effects per ogni fase
- [ ] Tooltip con requisiti mancanti
- [ ] Mini-cutscene per Boss victory
- [ ] Utilizzo di `is_under_attack` per eventi dinamici
