# ⛏️ Sistema di Progressione Miniera - 4 Fasi

## 📋 Overview
Sistema di progressione phygital per la **Miniera** che segue 4 fasi rigorose: invisibilità iniziale → sblocco post-Goblin → navigazione mappa 22 → ricostruzione con risorse.

---

## 🎯 Le 4 Fasi

### **FASE 1: Invisibile** 🔒
**Condizione Database:**
```sql
is_unlocked = false
is_built = false
mine_map_completed = false
```

**Comportamento:**
- ❌ **Miniera completamente INVISIBILE** sulla mappa
- ❌ Non renderizzata (filtro `Boolean(loc.is_unlocked)` blocca rendering)
- ❌ Non cliccabile
- 🎮 **Trigger per FASE 2**: Goblin attaccano il villaggio

**Codice:**
```typescript
// Filter in rendering loop
locations.filter((loc) => loc.name === 'Miniera' && Boolean(loc.is_unlocked))
// Se is_unlocked = false → array vuoto → nessun rendering
```

---

### **FASE 2: Triangolo Giallo** 🔺
**Condizione Database:**
```sql
is_unlocked = true  -- Sbloccato dopo vittoria Goblin
is_built = false
mine_map_completed = false
```

**Comportamento:**
- ✅ **Triangolo giallo appare** sulla montagna (coordinate: `top: 25%, left: 18%`)
- ✅ Animazione `animate-bounce` con badge "ESPLORA MINIERA"
- ✅ **Cliccabile** (cursor: pointer)
- ✅ **z-index: 1500** per essere sopra overlay
- ✅ `pointerEvents: 'auto'` per garantire click
- 🎮 **Trigger per FASE 3**: Click sul triangolo

**Sblocco Automatico:**
```typescript
// In completeDefense() dopo vittoria Goblin
const allDefended = locations
  .filter((l) => Boolean(l.is_built) && normalizeBuildingType(l) !== 'mine')
  .every((l) => updatedDefended.includes(l.name));

if (allDefended) {
  await supabase
    .from('game_locations')
    .update({ is_unlocked: true })
    .eq('id', mineLoc.id);
  
  showToast('success', '⛏️ Miniera sbloccata! Ricostruiscila per accedere all\'estrazione.');
}
```

**Codice Rendering:**
```tsx
{!isMapCompleted && !isBuilt && (
  <div className="flex flex-col items-center animate-bounce">
    <div className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-md shadow-lg border-2 border-black">
      ESPLORA MINIERA
    </div>
    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-yellow-500"></div>
  </div>
)}
```

---

### **FASE 3: Navigazione Mappa 22** 🗺️
**Condizione Trigger:**
- User clicca sul **Triangolo Giallo** (FASE 2)

**Comportamento:**
- 🔄 **Navigazione a `/map/22`** tramite router wouter
- 🎮 Carica **CampaignMap** con `mapId = 22`
- 🏔️ Mappa speciale "Miniera" con Boss finale
- ⚠️ **IMPORTANTE**: Nessun blocco da overlay `isDefending` o `isGoblinAttackActive`

**Click Handler:**
```typescript
const handleMineClick = (e: React.MouseEvent) => {
  e.stopPropagation(); // Previene interferenze
  
  if (isBuilt) return;
  
  if (!isMapCompleted) {
    // FASE 3: Navigazione
    console.log('🗺️ FASE 3: Navigating to Mine map (22)...');
    setLocation('/map/22'); // Router wouter
  } else {
    // FASE 4: Rebuild popup
    setShowMineRebuildPopup(true);
  }
};
```

**Overlay Fix:**
```tsx
// PRIMA (bloccava click):
<div className="absolute inset-0 pointer-events-auto">

// DOPO (permette click su Mine):
<div className="absolute inset-0 pointer-events-none">
  <div className="... pointer-events-auto"> {/* Solo il popup centrale */}
```

**Routing:**
```tsx
// In App.tsx
<Route path="/map/:mapId" component={CampaignMap} />
```

---

### **FASE 4: Martello (Rudder State)** 🔨
**Condizione Database:**
```sql
is_unlocked = true
is_built = false
mine_map_completed = true  -- Settato dopo vittoria Boss 22
```

**Comportamento:**
- ✅ **Martello dorato** al posto del triangolo
- ✅ Animazione `animate-pulse` con badge "RICOSTRUISCI"
- ✅ **Cliccabile** → Apre popup ricostruzione
- 💰 **Costo ricostruzione**: 100 Pietra + 50 Oro
- 🎮 **Trigger completamento**: Pagamento risorse → `is_built = true`

**Sblocco FASE 4:**
```typescript
// In TacticalScreen.tsx dopo Boss 22 sconfitto
const setMineMapCompleted = async () => {
  const { data: mineData, error: mineErr } = await supabase
    .from('game_locations')
    .select('id, name, mine_map_completed')
    .eq('user_id', 1)
    .eq('name', 'Miniera')
    .maybeSingle();

  if (mineData && !mineData.mine_map_completed) {
    const { error: updateErr } = await supabase
      .from('game_locations')
      .update({ mine_map_completed: true })
      .eq('id', mineData.id);
    
    console.log('✅ Mine map completed flag set in DB');
  }
};

// Chiamato in finishBattle() dopo vittoria Boss node 22
if (node.id === 22) {
  await setMineMapCompleted();
}
```

**Codice Rendering:**
```tsx
{isMapCompleted && !isBuilt && (
  <div className="flex flex-col items-center animate-pulse">
    <img
      src={hammerIcon}
      alt="Ricostruisci Miniera"
      className="w-16 h-16 object-contain drop-shadow-xl"
      style={{ filter: 'drop-shadow(0 0 10px gold)' }}
    />
    <div className="bg-amber-600 text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-lg border-2 border-amber-800 mt-1">
      RICOSTRUISCI
    </div>
  </div>
)}
```

**Popup Ricostruzione:**
```tsx
{showMineRebuildPopup && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[4500]">
    <div className="bg-gradient-to-b from-slate-900 to-gray-800 border-3 border-amber-500 rounded-2xl p-6 w-[520px]">
      <h3 className="text-2xl font-black mb-2">Miniera Scoperta!</h3>
      <p className="text-yellow-200 mb-4">
        Hai sconfitto il Boss della Miniera! Ora puoi ricostruirla.
      </p>
      
      {/* Costo */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-amber-900/15 p-2 rounded border-2 border-amber-500">
          🪨 {mineRebuildCost.stone} Pietra
        </div>
        <div className="flex-1 bg-amber-900/15 p-2 rounded border-2 border-amber-500">
          💰 {mineRebuildCost.gold} Oro
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleConfirmMineRebuild}>Ricostruisci</button>
        <button onClick={() => setShowMineRebuildPopup(false)}>Annulla</button>
      </div>
    </div>
  </div>
)}
```

---

## 🔄 Diagramma di Stato

```
┌─────────────────────────────────────────────────────────────────┐
│                         FASE 1: INVISIBILE                       │
│  is_unlocked = false, is_built = false, mine_map_completed = false │
│                    🔒 Miniera non visibile                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Goblin attaccano + Difesa vittoriosa
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FASE 2: TRIANGOLO GIALLO                      │
│   is_unlocked = true, is_built = false, mine_map_completed = false │
│          🔺 Triangolo cliccabile sulla montagna                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Click su triangolo → setLocation('/map/22')
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FASE 3: MAPPA 22 (BOSS)                        │
│              🗺️ CampaignMap caricata con mapId=22               │
│                  Boss finale da sconfiggere                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Boss sconfitto → mine_map_completed = true
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FASE 4: MARTELLO                             │
│    is_unlocked = true, is_built = false, mine_map_completed = true │
│       🔨 Martello cliccabile + Popup ricostruzione               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Pagamento 100🪨 + 50💰 → is_built = true
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ✅ MINIERA COMPLETATA                          │
│        is_unlocked = true, is_built = true                       │
│              Sprite edificio completo visibile                   │
│                 Produzione risorse attiva                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementazione Tecnica

### **Database Schema** ([shared/schema.ts](../shared/schema.ts))
```typescript
export const gameLocations = pgTable("game_locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(), // "Miniera"
  buildingType: text("building_type"), // "mine"
  is_built: boolean("is_built").default(false),
  is_unlocked: boolean("is_unlocked").default(true), // FALSE per Miniera iniziale
  mine_map_completed: boolean("mine_map_completed").default(false), // TRUE dopo Boss 22
  coordinateX: doublePrecision("coordinate_x").notNull(), // 18.0
  coordinateY: doublePrecision("coordinate_y").notNull(), // 25.0
  requiredWood: integer("required_wood").default(0),
  requiredStone: integer("required_stone").default(0),
  requiredGold: integer("required_gold").default(0),
});
```

### **Migration SQL**
```sql
-- migrations/add_mine_progression_fields.sql
ALTER TABLE game_locations 
  ADD COLUMN IF NOT EXISTS mine_map_completed BOOLEAN DEFAULT false;

-- Imposta Miniera come bloccata inizialmente
UPDATE game_locations 
SET is_unlocked = false 
WHERE name = 'Miniera';
```

---

## ⚙️ Fix Implementati

### **1. Overlay Blocking Click**
**Problema:** Overlay `pointer-events-auto` bloccava click sul triangolo  
**Soluzione:**
```tsx
// Container overlay: pointer-events-none
<div className="absolute inset-0 pointer-events-none">
  {/* Solo popup centrale cliccabile */}
  <div className="... pointer-events-auto">
```

### **2. Z-Index Insufficiente**
**Problema:** Triangolo sotto altri elementi  
**Soluzione:**
```tsx
style={{
  zIndex: 1500, // Era 50, aumentato a 1500
  pointerEvents: 'auto' // Esplicito per garantire click
}}
```

### **3. Navigazione non Funzionante**
**Problema:** `window.location.href` non usava router  
**Soluzione:**
```typescript
import { useLocation } from 'wouter';

const [, setLocation] = useLocation();

// In handleMineClick
setLocation('/map/22'); // Invece di window.location.href
```

### **4. Event Propagation**
**Problema:** Click poteva interferire con handler della mappa  
**Soluzione:**
```typescript
const handleMineClick = (e: React.MouseEvent) => {
  e.stopPropagation(); // Previene bubble up
  // ... resto della logica
};
```

---

## 🧪 Testing Checklist

### **FASE 1 → FASE 2**
- [ ] Miniera invisibile all'avvio (DB: `is_unlocked = false`)
- [ ] Goblin attaccano villaggio
- [ ] Difesa vittoriosa (tutti edifici salvati)
- [ ] Toast "⛏️ Miniera sbloccata!"
- [ ] Triangolo giallo appare sulla montagna
- [ ] `is_unlocked` aggiornato a `true` in DB

### **FASE 2 → FASE 3**
- [ ] Triangolo cliccabile (cursor: pointer)
- [ ] Click non bloccato da overlay Goblin
- [ ] Navigazione a `/map/22` funzionante
- [ ] CampaignMap caricata con mappa corretta
- [ ] Boss finale renderizzato (node 22)

### **FASE 3 → FASE 4**
- [ ] Boss 22 sconfitto
- [ ] `setMineMapCompleted()` chiamato
- [ ] DB aggiornato: `mine_map_completed = true`
- [ ] Ritorno a villaggio mostra martello invece del triangolo
- [ ] Badge "RICOSTRUISCI" visibile

### **FASE 4 → Completamento**
- [ ] Click su martello apre popup
- [ ] Costo mostrato: 100🪨 + 50💰
- [ ] Pagamento risorse funzionante
- [ ] DB aggiornato: `is_built = true`
- [ ] Sprite edificio completo appare
- [ ] Miniera attiva (tooltip "Miniera Attiva")

---

## 📊 Query Utili

### **Verifica Stato Miniera**
```sql
SELECT 
  name,
  is_unlocked,
  is_built,
  mine_map_completed,
  CASE 
    WHEN NOT is_unlocked THEN 'FASE 1: Invisibile'
    WHEN is_unlocked AND NOT mine_map_completed AND NOT is_built THEN 'FASE 2: Triangolo'
    WHEN is_unlocked AND mine_map_completed AND NOT is_built THEN 'FASE 4: Martello'
    WHEN is_built THEN 'COMPLETATA'
  END as stato
FROM game_locations
WHERE name = 'Miniera'
  AND user_id = 1;
```

### **Reset Progressione Miniera**
```sql
-- Torna a FASE 1
UPDATE game_locations 
SET 
  is_unlocked = false,
  is_built = false,
  mine_map_completed = false
WHERE name = 'Miniera'
  AND user_id = 1;
```

### **Sblocca Triangolo (Skip a FASE 2)**
```sql
UPDATE game_locations 
SET is_unlocked = true
WHERE name = 'Miniera'
  AND user_id = 1;
```

### **Completa Mappa 22 (Skip a FASE 4)**
```sql
UPDATE game_locations 
SET 
  is_unlocked = true,
  mine_map_completed = true
WHERE name = 'Miniera'
  AND user_id = 1;
```

---

## 🎯 Prossimi Passi

- [ ] Animazione transizione triangolo → martello
- [ ] Sound effect per sblocco Miniera
- [ ] Particle effect quando appare triangolo
- [ ] Cutscene intro mappa 22
- [ ] Boss fight speciale (meccaniche uniche)
- [ ] Reward unico dopo ricostruzione (es. boost produzione)

---

## 📝 Change Log

### v2.0.0 - 2026-01-11
- ✅ **Fix critico**: Overlay non blocca più click triangolo
- ✅ **Fix critico**: Navigazione usa router wouter invece di `window.location.href`
- ✅ **Fix critico**: Z-index aumentato a 1500 per visibilità
- ✅ **Miglioramento**: Event propagation gestito con `stopPropagation()`
- ✅ **Miglioramento**: `pointerEvents: 'auto'` esplicito sul triangolo
- ✅ **Documentazione**: Aggiunti commenti FASE 1-4 nel codice
- ✅ **Build verificato**: 5.57s, 671.61 kB

### v1.0.0 - 2026-01-10
- ✅ Implementata progressione 4-fasi
- ✅ Sblocco automatico dopo vittoria Goblin
- ✅ Popup ricostruzione con costi
- ✅ Integrazione con TacticalScreen per Boss 22
