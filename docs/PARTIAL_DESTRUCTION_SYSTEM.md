# 🏚️ Sistema di Distruzione Parziale

## 📋 Overview
Sistema che gestisce la distruzione degli edifici distinguendo tra **edifici di produzione** (che diventano ruderi visibili) e **edifici di difesa** (che scompaiono completamente).

---

## 🎯 Regole di Distruzione

### **Edifici di Produzione** (Production Buildings)
Quando distrutti (`is_built = false` ma `is_unlocked = true`), gli edifici di produzione:

✅ **Rimangono visibili** con effetto "rudere"  
✅ **Mostrano sprite in grayscale + brightness(0.5)**  
✅ **Icona martello sovrapposta** con animazione pulse  
✅ **Badge "🔥 RUDERE"** rosso sotto l'edificio  
✅ **Produzione di risorse ferma** (se implementata)

**Edifici Inclusi:**
- `sawmill` - Segheria
- `mine` - Miniera
- `farm` - Orto
- `blacksmith` - Fucina
- `warehouse` - Magazzino
- `bridge` - Ponte

---

### **Edifici di Difesa** (Defense Buildings)
Quando distrutti, gli edifici di difesa:

❌ **Scompaiono completamente** dalla mappa  
❌ **Non lasciano ruderi**  
❌ **Devono essere ricostruiti da zero**

**Edifici Inclusi:**
- `tower` - Torri
- `wall` - Mura
- `defense` - Strutture difensive generiche

---

## 🔧 Implementazione Tecnica

### **Helper Functions** ([HomeDashboard.tsx](../src/pages/HomeDashboard.tsx))

```typescript
// Verifica se un edificio è di produzione
const isProductionBuilding = (buildingType: string | undefined): boolean => {
  if (!buildingType) return false;
  return ['sawmill', 'mine', 'farm', 'blacksmith', 'warehouse', 'bridge'].includes(buildingType);
};

// Verifica se un edificio è di difesa
const isDefenseBuilding = (buildingType: string | undefined): boolean => {
  if (!buildingType) return false;
  return ['tower', 'wall', 'defense'].includes(buildingType);
};
```

### **Sprite Selector**
```typescript
const getBuildingSprite = (loc: any) => {
  const bt = normalizeBuildingType(loc);
  const isBuilt = Boolean(loc.is_built);
  const isUnlocked = Boolean(loc.is_unlocked);
  
  // Production buildings in Rudder state: show their sprite
  if (!isBuilt && isUnlocked && isProductionBuilding(bt)) {
    return bt ? (buildingAssets[bt] || '/assets/magazzino.png') : '/assets/magazzino.png';
  }
  
  // Not built and not unlocked: show hammer
  if (!isBuilt) return hammerIcon;
  
  // Built: show normal sprite
  return bt ? (buildingAssets[bt] || '/assets/magazzino.png') : '/assets/magazzino.png';
};
```

### **Rendering Logic**
```typescript
// Filtra gli edifici da renderizzare
locations.filter((loc) => {
  const bt = normalizeBuildingType(loc);
  const isBuilt = Boolean(loc.is_built);
  const isUnlocked = Boolean(loc.is_unlocked);
  
  // Skip Mine (gestita separatamente)
  if (bt === 'mine') return false;
  
  // Defense buildings: nascondi completamente se distrutti
  if (isDefenseBuilding(bt) && !isBuilt && isUnlocked) return false;
  
  return true;
})
```

### **Stato Rudder Rendering**
```tsx
{isRudderState ? (
  <div className="relative flex flex-col items-center">
    {/* Building sprite in grayscale (effetto rudere) */}
    <img
      src={getBuildingSprite(loc)}
      style={{
        filter: 'grayscale(100%) brightness(0.5)',
        opacity: 0.6,
      }}
    />
    {/* Hammer icon overlay */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse">
      <img src={hammerIcon} className="w-12 h-12" />
    </div>
    {/* Rudder State badge */}
    <div className="absolute -bottom-6 bg-red-700 text-white text-[9px] font-bold px-3 py-1">
      🔥 RUDERE
    </div>
  </div>
) : (
  // Sprite normale per edifici attivi
)}
```

---

## 🎮 User Experience

### **Edificio Produzione Distrutto**
1. **Sprite grayscale** al 50% luminosità (effetto rovina)
2. **Martello animato** al centro (pulse)
3. **Badge "RUDERE"** rosso sotto
4. **Click attivo** per aprire popup di ricostruzione
5. **Tooltip** con nome edificio

### **Edificio Difesa Distrutto**
1. **Edificio scompare completamente**
2. **Nessun marker visibile**
3. **Deve essere sbloccato nuovamente** (se meccanica implementata)

---

## 📊 Database Schema

### **game_locations Table**
```sql
- is_built: BOOLEAN (default false) -- Edificio costruito
- is_unlocked: BOOLEAN (default true) -- Edificio sbloccato
- buildingType: TEXT -- Tipologia edificio
```

### **Stato Rudder Condition**
```sql
WHERE is_built = false 
  AND is_unlocked = true 
  AND buildingType IN ('sawmill', 'mine', 'farm', 'blacksmith', 'warehouse', 'bridge')
```

---

## ⚙️ Produzione Risorse

### **Controllo Stato Rudder**
```typescript
// Esempio di logica di produzione (da implementare lato server)
const canProduce = (location: GameLocation): boolean => {
  // Edifici in stato Rudder NON producono
  if (!location.is_built && location.is_unlocked && isProductionBuilding(location.buildingType)) {
    return false;
  }
  
  // Edifici sotto attacco NON producono
  if (location.is_under_attack) {
    return false;
  }
  
  return location.is_built;
};
```

---

## 🔄 Stati Possibili

### **Edificio di Produzione**
| `is_built` | `is_unlocked` | Stato Visivo | Produzione |
|------------|---------------|--------------|------------|
| ❌ `false` | ❌ `false`   | 🔒 Bloccato (icona lucchetto) | ❌ No |
| ❌ `false` | ✅ `true`    | 🏚️ **RUDERE** (grayscale + martello) | ❌ No |
| ✅ `true`  | ✅ `true`    | ✅ Attivo (sprite normale) | ✅ Sì |

### **Edificio di Difesa**
| `is_built` | `is_unlocked` | Stato Visivo | Funzionamento |
|------------|---------------|--------------|---------------|
| ❌ `false` | ❌ `false`   | 👻 Invisibile | ❌ No |
| ❌ `false` | ✅ `true`    | 👻 **Invisibile** (distrutto) | ❌ No |
| ✅ `true`  | ✅ `true`    | ✅ Attivo | ✅ Sì |

---

## 🎯 Prossimi Passi

- [ ] Implementare logica di produzione lato server
- [ ] Aggiungere edifici di difesa (tower, wall)
- [ ] Creare sprite ruin separati (opzionale)
- [ ] Animazione di distruzione (edificio → rudere)
- [ ] Sound effects per distruzione/ricostruzione
- [ ] Costo di ricostruzione differenziato (attualmente 50% costo originale per Mine)

---

## 📝 Change Log

### v1.0.0 - 2026-01-11
- ✅ Implementato sistema distruzione parziale
- ✅ Differenziazione edifici produzione vs difesa
- ✅ Effetto grayscale + martello per ruderi
- ✅ Badge "RUDERE" rosso
- ✅ Helper functions `isProductionBuilding` e `isDefenseBuilding`
- ✅ Filtro rendering per nascondere difese distrutte
- ✅ Build verificato: 4.05s, 671.49 kB
