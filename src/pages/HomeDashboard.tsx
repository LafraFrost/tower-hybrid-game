import React, { useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Swords } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const buildingAssets: Record<string, string> = {
  sawmill: '/assets/segheria.png',
  mine: '/assets/miniera.png',
  warehouse: '/assets/magazzino.png',
  farm: '/assets/orto.png',
  blacksmith: '/assets/fucina.png',
  bridge: '/assets/ponte.png',
};

const hammerIcon = '/assets/martello.png';
const DISABLE_BUILDING_DRAG = true;

console.log('🏗️ HomeDashboard caricato - DISABLE_BUILDING_DRAG:', DISABLE_BUILDING_DRAG);

const normalizeBuildingType = (loc: any) => {
  if (loc.buildingType) return loc.buildingType;
  if (loc.building_type) return loc.building_type;
  const n = (loc.name || '').toLowerCase();
  if (n.includes('magazz')) return 'warehouse';
  if (n.includes('segh') || n.includes('sawmill')) return 'sawmill';
  if (n.includes('minier') || n.includes('mine')) return 'mine';
  if (n.includes('orto') || n.includes('farm')) return 'farm';
  if (n.includes('fucin') || n.includes('forge')) return 'blacksmith';
  if (n.includes('pont') || n.includes('bridge')) return 'bridge';
  return undefined;
};

// Sprite selector: returns ruin sprite if building is ruined, normal sprite otherwise (or hammer if not built)
const getBuildingSprite = (loc: any, ruinedBuildings: string[]) => {
  const bt = normalizeBuildingType(loc);
  const isBuilt = Boolean(loc.is_built);
  if (!isBuilt) return hammerIcon;
  if (bt && ruinedBuildings.includes(loc.name)) {
    return `/assets/buildings/${bt}_ruin.png`;
  }
  return bt ? (buildingAssets[bt] || '/assets/magazzino.png') : '/assets/magazzino.png';
};

const ResourceBar = ({ resources }: { resources: any }) => (
  <div style={{
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: '10px 25px',
    borderRadius: '30px',
    border: '2px solid #DAA520',
    zIndex: 2000,
    color: 'white',
    fontWeight: 'bold',
    boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
  }}>
    <div title="Legno">🪵 {resources.wood || 0}</div>
    <div title="Pietra">🪨 {resources.stone || 0}</div>
    <div title="Oro">💰 {resources.gold || 0}</div>
  </div>
);

const MenuButton = () => (
  <button
    onClick={() => { window.location.href = '/'; }}
    style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      padding: '10px 15px',
      backgroundColor: '#444',
      color: 'white',
      border: '1px solid #777',
      borderRadius: '8px',
      cursor: 'pointer',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    }}
  >
    🏠 Menu
  </button>
);

const DevTriggerButton = ({ isActive, onToggle }: { isActive: boolean; onToggle: () => void }) => (
  <button 
    onClick={onToggle}
    style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      opacity: 0.9,
      fontSize: '12px',
      padding: '8px 12px',
      backgroundColor: isActive ? '#dc2626' : '#ff6b00',
      color: 'white',
      border: '2px solid ' + (isActive ? '#991b1b' : '#b45309'),
      borderRadius: '4px',
      cursor: 'pointer',
      zIndex: 9999,
      transition: 'all 0.3s',
      fontWeight: 'bold',
      pointerEvents: 'auto',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.boxShadow = '0 0 15px ' + (isActive ? 'rgba(220, 38, 38, 0.8)' : 'rgba(255, 107, 0, 0.8)');
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = '0.9';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    {isActive ? '❌ ATTACCO ON' : '✓ ATTACCO OFF'}
  </button>
);



const HomeDashboard = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [resources, setResources] = useState<any>({ wood: 0, stone: 0, gold: 0 });
  const [isMineUnlocked, setIsMineUnlocked] = useState(false);
  const [mapImage, setMapImage] = useState('/assets/casa.jpg');
  const [isGoblinAttackActive, setIsGoblinAttackActive] = useState(false);
  const [goblinAttackMessage, setGoblinAttackMessage] = useState('');
  const [isDefending, setIsDefending] = useState(false);
  const [defendedBuildings, setDefendedBuildings] = useState<string[]>([]);
  const [ruinedBuildings, setRuinedBuildings] = useState<string[]>([]);
  const [showCampPopup, setShowCampPopup] = useState(false);
  const [showRepairPopup, setShowRepairPopup] = useState(false);
  const [repairTarget, setRepairTarget] = useState<any>(null);
  const [repairCost, setRepairCost] = useState<{ wood: number; stone: number; gold: number }>({ wood: 0, stone: 0, gold: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  type Toast = { id: number; type: 'success' | 'error' | 'warning' | 'info'; message: string; persistent?: boolean; duration?: number };
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [goblinToastId, setGoblinToastId] = useState<number | null>(null);
  const showToast = (type: Toast['type'], message: string, options?: { duration?: number; persistent?: boolean }) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const duration = options?.duration ?? 3000;
    const persistent = options?.persistent ?? false;
    setToasts((prev) => [{ id, type, message, persistent, duration }, ...prev]);
    if (!persistent && duration > 0) {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  };
  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const prevResRef = useRef<{ wood: number; stone: number; gold: number }>({ wood: 0, stone: 0, gold: 0 });
  const firstResLoadRef = useRef(true);
  const initTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    const prev = prevResRef.current;
    if (firstResLoadRef.current) {
      firstResLoadRef.current = false;
    } else {
      // Skip resource toasts for 2 seconds after page load
      const elapsed = Date.now() - initTimeRef.current;
      if (elapsed > 2000) {
        const dw = (resources.wood ?? 0) - (prev.wood ?? 0);
        const ds = (resources.stone ?? 0) - (prev.stone ?? 0);
        const dg = (resources.gold ?? 0) - (prev.gold ?? 0);
        if (dw !== 0) showToast(dw > 0 ? 'success' : 'error', `🪵 ${dw > 0 ? '+' : ''}${dw}`, { duration: 2000 });
        if (ds !== 0) showToast(ds > 0 ? 'success' : 'error', `🪨 ${ds > 0 ? '+' : ''}${ds}`, { duration: 2000 });
        if (dg !== 0) showToast(dg > 0 ? 'success' : 'error', `💰 ${dg > 0 ? '+' : ''}${dg}`, { duration: 2000 });
      }
    }
    prevResRef.current = { wood: resources.wood ?? 0, stone: resources.stone ?? 0, gold: resources.gold ?? 0 };
  }, [resources]);

  const loadLocations = React.useCallback(async () => {
    console.log('🔍 Loading locations from database...');
    
    // Locations con coordinate salvate (martelli per non costruiti, edifici dopo pagamento)
    const baseLocations = [
      { id: 1, name: 'Magazzino', buildingType: 'warehouse', coordinateX: 35.0, coordinateY: 42.0, is_built: false, requiredWood: 100, requiredStone: 50, requiredGold: 20 },
      { id: 2, name: 'Orto', buildingType: 'farm', coordinateX: 40.0, coordinateY: 48.0, is_built: true, requiredWood: 80, requiredStone: 30, requiredGold: 10 },
      { id: 3, name: 'Fucina', buildingType: 'blacksmith', coordinateX: 30.0, coordinateY: 55.0, is_built: false, requiredWood: 120, requiredStone: 80, requiredGold: 50 },
      { id: 4, name: 'Ponte', buildingType: 'bridge', coordinateX: 60.0, coordinateY: 50.0, is_built: false, requiredWood: 150, requiredStone: 100, requiredGold: 30 },
      { id: 5, name: 'Miniera', buildingType: 'mine', coordinateX: 52.0, coordinateY: 38.0, is_built: false, requiredWood: 90, requiredStone: 120, requiredGold: 40 },
      { id: 6, name: 'Segheria', buildingType: 'sawmill', coordinateX: 20.0, coordinateY: 45.0, is_built: false, requiredWood: 60, requiredStone: 40, requiredGold: 15 },
    ];

    // Try to load from Supabase if available, otherwise use baseLocations
    try {
      // First, check if RLS is blocking by testing the query
      const { data, error, count } = await supabase
        .from('game_locations')
        .select('*', { count: 'exact' })
        .order('id');

      console.log('📊 Supabase query result:', { 
        data, 
        error, 
        dataLength: data?.length, 
        count,
        errorDetails: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        } : null
      });

      if (error) {
        console.error('❌ Supabase error:', error);
        console.warn('⚠️ POSSIBILE PROBLEMA RLS: Vai su Supabase Dashboard → Authentication → Policies e disabilita RLS per game_locations o aggiungi policy SELECT per anon');
        alert(`Errore caricamento database: ${error.message}\n\nControlla le Row Level Security policies su Supabase!`);
        setLocations(baseLocations);
        return;
      }

      if (data && data.length > 0) {
        console.log('✅ Locations loaded from Supabase:', data);
        setLocations(
          data.map((loc: any) => {
            const buildingType = normalizeBuildingType(loc);
            const cxRaw = loc.coordinateX ?? loc.coordinate_x ?? 50;
            const cyRaw = loc.coordinateY ?? loc.coordinate_y ?? 50;
            const isBuilt = Boolean(loc.is_built);
            console.log(`  - ${loc.name}: is_built=${loc.is_built} -> ${isBuilt}`);
            return {
              ...loc,
              is_built: isBuilt,
              buildingType,
              coordinateX: Number(cxRaw),
              coordinateY: Number(cyRaw),
            };
          })
        );
      } else {
        console.warn('⚠️ No data in Supabase, using default locations. Error:', error);
        setLocations(baseLocations);
      }
    } catch (err) {
      console.error('❌ Error loading from Supabase, using defaults:', err);
      setLocations(baseLocations);
    }
  }, []);

  // Cambia sfondo in base all'ora (solo locale per evitare crash RPC)
  useEffect(() => {
    let timer: number | undefined;
    const pickImage = () => {
      // Optional override via query param: ?theme=day or ?theme=night
      const params = new URLSearchParams(window.location.search);
      const themeOverride = params.get('theme');
      if (themeOverride === 'day' || themeOverride === 'night') {
        const forced = themeOverride === 'day' ? '/assets/casa.jpg' : '/assets/casa_notte.jpg';
        console.log('🎛️ Theme override:', themeOverride, '→', forced);
        setMapImage(forced);
        return;
      }
      const hour = new Date().getHours();
      const isDay = hour >= 8 && hour < 20;
      const nextImg = isDay ? '/assets/casa.jpg' : '/assets/casa_notte.jpg';
      console.log('🖼️ Background set to:', nextImg);
      setMapImage(nextImg);
    };
    pickImage();
    timer = window.setInterval(pickImage, 60_000);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, []);

  const toggleGoblinAttack = async () => {
    try {
      console.log('Toggling goblin attack:', !isGoblinAttackActive);

      const newStatus = !isGoblinAttackActive;

      // Aggiorna se esiste, altrimenti inserisci
      const { data: existing, error: selErr } = await supabase
        .from('events')
        .select('id')
        .eq('event_type', 'goblin_attack')
        .limit(1);

      if (selErr) {
        console.error('Error selecting goblin event:', selErr);
      }

      if (existing && existing.length > 0) {
        const { error: updErr } = await supabase
          .from('events')
          .update({ is_active: newStatus, updated_at: new Date().toISOString() })
          .eq('id', existing[0].id);
        if (updErr) {
          console.error('Error updating goblin event:', updErr);
        }
      } else {
        const { error: insErr } = await supabase
          .from('events')
          .insert({ event_type: 'goblin_attack', is_active: newStatus, triggered_at: new Date().toISOString() });
        if (insErr) {
          console.error('Error inserting goblin event:', insErr);
        }
      }

      setIsGoblinAttackActive(newStatus);
      
      // Reset goblin attack message and alert when disabling
      if (!newStatus) {
        setGoblinAttackMessage('');
      }
      
      console.log('✅ Goblin attack status updated in Supabase');
    } catch (error) {
      console.error('Error in toggleGoblinAttack:', error);
    }
  };

  useEffect(() => {
    loadLocations();

    // Subscribe to game_locations changes in Supabase (realtime)
    const locationsChannel = supabase
      .channel('game-locations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_locations' }, (payload: any) => {
        console.log('Real-time location update:', payload);
        // Reload all locations on any change
        loadLocations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(locationsChannel);
    };
  }, [loadLocations]);

  useEffect(() => {
    // Try to load resources from API, fallback to mock data
    fetch('/api/user-resources', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setResources(data || { wood: 0, stone: 0, gold: 0 });
        setIsMineUnlocked(!!data?.isMineUnlocked);
      })
      .catch((err) => {
        console.warn('API not available, using default resources:', err);
        setResources({ wood: 500, stone: 300, gold: 150 });
      });

    // Also try to load from Supabase user_resources
    const loadFromSupabase = async () => {
      try {
        const { data: resData, error: resErr } = await supabase
          .from('user_resources')
          .select('wood, stone, gold')
          .eq('user_id', 1)
          .maybeSingle();

        if (!resErr && resData) {
          console.log('✅ Resources loaded from Supabase:', resData);
          setResources({ 
            wood: resData.wood || 0, 
            stone: resData.stone || 0, 
            gold: resData.gold || 0 
          });
        }
        // Fetch mine unlock status separately to avoid column issues
        try {
          const { data: unlockData, error: unlockErr } = await supabase
            .from('user_resources')
            .select('is_mine_unlocked')
            .eq('user_id', 1)
            .maybeSingle();
          if (!unlockErr && unlockData) {
            setIsMineUnlocked(!!unlockData.is_mine_unlocked);
            console.log('🔓 Mine unlock status:', !!unlockData.is_mine_unlocked);
          }
        } catch (e) {
          console.warn('is_mine_unlocked not available in user_resources; ignoring.', e);
        }
      } catch (err) {
        console.error('Error loading from Supabase:', err);
      }
    };
    loadFromSupabase();
    // Load defense outcomes from localStorage
    try {
      const def = localStorage.getItem('defended_buildings');
      const ruin = localStorage.getItem('ruined_buildings');
      const defending = localStorage.getItem('is_defending');
      setDefendedBuildings(def ? JSON.parse(def) : []);
      setRuinedBuildings(ruin ? JSON.parse(ruin) : []);
      setIsDefending(defending === 'true');
    } catch {}
  }, []);

  useEffect(() => {
    // Subscribe to goblin attack event changes in Supabase (v2 realtime API)
    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload: any) => {
        console.log('Real-time event update:', payload);
        if (payload?.new?.event_type === 'goblin_attack') {
          setIsGoblinAttackActive(!!payload.new.is_active);
        }
      })
      .subscribe();

    // Load initial state
    const loadGoblinEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('is_active')
        .eq('event_type', 'goblin_attack')
        .maybeSingle();

      if (!error && data) {
        setIsGoblinAttackActive(!!data.is_active);
      }
    };

    loadGoblinEvent();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Save isDefending state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('is_defending', isDefending ? 'true' : 'false');
    } catch {}
  }, [isDefending]);

  // Quando attacco goblin si attiva, mostra un Toast persistente e passa direttamente a modalità difesa
  useEffect(() => {
    if (isGoblinAttackActive) {
      console.log('🚨 Goblin attack activated! Entering defense mode immediately.');
      setIsDefending(true);
      if (goblinToastId == null) {
        const id = Date.now();
        setGoblinToastId(id);
        setToasts((prev) => [{ id, type: 'warning', message: '⚠️ VILLAGGIO SOTTO ATTACCO! Difendi le tue costruzioni!', persistent: true }, ...prev]);
      }
    } else {
      if (goblinToastId != null) {
        dismissToast(goblinToastId);
        setGoblinToastId(null);
      }
    }
  }, [isGoblinAttackActive]);

  // Hide red alert when no buildings under attack remain, and show camp triangle if mine not unlocked
  useEffect(() => {
    const anyUnderAttack = locations.some((loc) => {
      const bt = normalizeBuildingType(loc);
      if (!bt) return false;
      const built = Boolean(loc.is_built);
      const defended = defendedBuildings.includes(loc.name);
      const ruined = ruinedBuildings.includes(loc.name);
      return isGoblinAttackActive && built && !defended && !ruined;
    });
    if (!anyUnderAttack) {
      // Alert dialog removed; toast persists only while attack is active
      // Also reset defending mode when done
      if (isDefending) {
        setIsDefending(false);
        console.log('✅ All buildings defended/ruined - exiting defense mode');
      }
    }
  }, [locations, defendedBuildings, ruinedBuildings, isGoblinAttackActive, isDefending]);


  const handleMouseDown = (id: number) => {
    if (DISABLE_BUILDING_DRAG) {
      console.log('🚫 Movimento edifici disattivato');
      return;
    }
    setDraggingId(id);
  };

  const getEffectDescription = (type: string) => {
    switch (type) {
      case 'sawmill':
        return 'Aumenta la probabilità di trovare risorse nei tiri di dado durante la partita fisica e digitale.';
      case 'mine':
        return "Sblocca l'estrazione di materiali rari dopo aver sconfitto l'attacco Goblin.";
      case 'bridge':
        return 'Sblocca l\'accesso illimitato alle mappe a snodi casuali.';
      default:
        return 'Edificio base per la tua comunità.';
    }
  };

  const handleBuildRequest = async (loc: any) => {
    try {
      if (loc.is_built) return;

      // Check if it's the mine and it's not unlocked yet
      if (loc.buildingType === 'mine' && !isMineUnlocked) {
        showToast('warning', '🔒 La Miniera è bloccata! Sconfiggi il Boss del Nodo 22 per sbloccarla.', { duration: 4000 });
        setSelectedLocation(null);
        return;
      }

      // Se attacco goblin attivo, disabilita build per tutte le strutture tranne difesa
      if (isGoblinAttackActive && loc.buildingType !== 'defense') {
        setGoblinAttackMessage('Durante l\'attacco Goblin puoi costruire solo strutture di difesa!');
        setTimeout(() => setGoblinAttackMessage(''), 3000);
        return;
      }

      const requiredWood = loc.requiredWood ?? loc.required_wood ?? 0;
      const requiredStone = loc.requiredStone ?? loc.required_stone ?? 0;
      const requiredGold = loc.requiredGold ?? loc.required_gold ?? 0;

      // Check if user has enough resources
      if (
        (resources.wood ?? 0) < requiredWood ||
        (resources.stone ?? 0) < requiredStone ||
        (resources.gold ?? 0) < requiredGold
      ) {
        showToast('error', `❌ Risorse insufficienti! Servono: ${requiredWood} Legno, ${requiredStone} Pietra, ${requiredGold} Oro`, { duration: 5000 });
        return;
      }

      // Try to save to Supabase (if table exists)
      try {
        const { error } = await supabase
          .from('game_locations')
          .update({ is_built: true })
          .eq('id', loc.id);

        if (error) {
          console.warn('Supabase update failed (table might not exist):', error);
        }
      } catch (err) {
        console.warn('Supabase not available, updating locally only');
      }

      // Optimistic update locally
      setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, is_built: true } : l));
      setResources((prev: any) => ({
        wood: Math.max(0, (prev.wood ?? 0) - requiredWood),
        stone: Math.max(0, (prev.stone ?? 0) - requiredStone),
        gold: Math.max(0, (prev.gold ?? 0) - requiredGold),
      }));
      
      setSelectedLocation(null);
      showToast('success', `🛠️ ${loc.name} costruito con successo!`, { duration: 3000 });
    } catch (err) {
      console.error('Errore build:', err);
      showToast('error', '❌ Errore durante la costruzione', { duration: 4000 });
    }
  };

  // Open repair popup with 50% original cost
  const openRepairPopup = (loc: any) => {
    const requiredWood = loc.requiredWood ?? loc.required_wood ?? 0;
    const requiredStone = loc.requiredStone ?? loc.required_stone ?? 0;
    const requiredGold = loc.requiredGold ?? loc.required_gold ?? 0;

    const cost = {
      wood: Math.ceil(requiredWood * 0.5),
      stone: Math.ceil(requiredStone * 0.5),
      gold: Math.ceil(requiredGold * 0.5),
    };
    setRepairTarget(loc);
    setRepairCost(cost);
    setShowRepairPopup(true);
  };

  const confirmRepair = async () => {
    if (!repairTarget) return;
    const { wood, stone, gold } = repairCost;

    // Check local resources
    const hasEnough = (resources.wood ?? 0) >= wood && (resources.stone ?? 0) >= stone && (resources.gold ?? 0) >= gold;
    if (!hasEnough) {
      showToast('error', `❌ Risorse insufficienti per riparare ${repairTarget.name}. Servono: ${wood} Legno, ${stone} Pietra, ${gold} Oro.`, { duration: 5000 });
      return;
    }

    // Deduct locally
    setResources((prev: any) => ({
      wood: Math.max(0, (prev.wood ?? 0) - wood),
      stone: Math.max(0, (prev.stone ?? 0) - stone),
      gold: Math.max(0, (prev.gold ?? 0) - gold),
    }));

    // Try to update in Supabase
    try {
      const { data, error } = await supabase
        .from('user_resources')
        .select('wood, stone, gold')
        .eq('user_id', 1)
        .maybeSingle();
      if (!error && data) {
        const newWood = Math.max(0, (data.wood ?? 0) - wood);
        const newStone = Math.max(0, (data.stone ?? 0) - stone);
        const newGold = Math.max(0, (data.gold ?? 0) - gold);
        await supabase
          .from('user_resources')
          .update({ wood: newWood, stone: newStone, gold: newGold })
          .eq('user_id', 1);
      }
    } catch (err) {
      console.warn('Supabase repair update failed (using local only):', err);
    }

    // Remove from ruined_buildings
    try {
      const ruin = localStorage.getItem('ruined_buildings');
      const list: string[] = ruin ? JSON.parse(ruin) : [];
      const next = list.filter((name) => name !== repairTarget.name);
      localStorage.setItem('ruined_buildings', JSON.stringify(next));
      setRuinedBuildings(next);
    } catch {}

    showToast('success', `🛠️ ${repairTarget.name} riparato correttamente! Bonus passivi riattivati.`, { duration: 3000 });
    setShowRepairPopup(false);
    setRepairTarget(null);
  };


  const handleMouseMove = (e: React.MouseEvent) => {
    if (DISABLE_BUILDING_DRAG || draggingId === null || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === draggingId ? { ...loc, coordinateX: x, coordinateY: y } : loc
      )
    );
  };

  const handleMouseUp = () => {
    if (draggingId !== null) {
      const movedLoc = locations.find((l) => l.id === draggingId);
      if (movedLoc) {
        savePosition(movedLoc.id, movedLoc.coordinateX, movedLoc.coordinateY);
      }
      setDraggingId(null);
    }
  };

  const savePosition = async (id: number, x: number, y: number) => {
    try {
      // Update in Supabase game_locations
      const { error } = await supabase
        .from('game_locations')
        .update({
          coordinate_x: parseFloat(x.toFixed(2)),
          coordinate_y: parseFloat(y.toFixed(2)),
        })
        .eq('id', id);

      if (error) {
        console.warn('⚠️ Supabase save failed (using local state only):', error);
      } else {
        console.log(`✅ Posizione salvata per edificio ${id}: (${x.toFixed(2)}%, ${y.toFixed(2)}%)`);
      }
    } catch (err) {
      console.warn('⚠️ Salvataggio remoto non disponibile, posizione salvata solo localmente');
    }
  };

  return (
    <div
      style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', position: 'relative' }}
    >
      <MenuButton />
      <DevTriggerButton isActive={isGoblinAttackActive} onToggle={toggleGoblinAttack} />
      <ResourceBar resources={resources} />

      {/* Toast container - bottom-right corner */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 5000, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none', maxWidth: '400px' }}>
        {toasts.map((t) => {
          const isResourceToast = ['🪵', '🪨', '💰'].some(emoji => t.message.includes(emoji));
          return (
            <div
              key={t.id}
              style={{
                pointerEvents: t.persistent ? 'auto' : 'none',
                backgroundColor: t.type === 'error' ? 'rgba(220,38,38,0.9)' : t.type === 'warning' ? 'rgba(234,179,8,0.9)' : t.type === 'success' ? 'rgba(34,197,94,0.9)' : 'rgba(59,130,246,0.9)',
                color: 'white',
                padding: isResourceToast ? '6px 10px' : '10px 16px',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.25)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                fontWeight: 700,
                fontSize: isResourceToast ? '12px' : '14px',
                textAlign: 'center',
                minWidth: isResourceToast ? 'auto' : '280px',
              }}
            >
              {t.message}
              {t.persistent && (
                <button
                  onClick={() => dismissToast(t.id)}
                  style={{
                    marginLeft: '10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 900,
                    fontSize: '16px',
                    padding: '0',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Overlay Attacco Goblin - Fase 2: Filtro leggero con bordo pulsante (pointer-events-none) */}
      {isGoblinAttackActive && isDefending && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(127, 29, 29, 0.15)',
            border: '8px solid rgba(220, 38, 38, 0.8)',
            borderRadius: '0',
            zIndex: 3000,
            animation: 'pulseBorder 1.5s infinite',
            pointerEvents: 'none',
          }}
        >
          <style>{`
            @keyframes pulseBorder {
              0%, 100% { border-color: rgba(220, 38, 38, 0.6); }
              50% { border-color: rgba(239, 68, 68, 0.9); }
            }
          `}</style>
        </div>
      )}



      {/* Messaggio temporaneo attacco goblin */}
      {goblinAttackMessage && (
        <div
          style={{
            position: 'fixed',
            top: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255, 0, 0, 0.9)',
            color: 'white',
            padding: '15px 30px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: 2500,
            animation: 'fadeInOut 3s ease-in-out',
          }}
        >
          <style>{`
            @keyframes fadeInOut {
              0%, 100% { opacity: 0; }
              10%, 90% { opacity: 1; }
            }
          `}</style>
          {goblinAttackMessage}
        </div>
      )}

      <div
        ref={mapRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ position: 'relative', width: '1024px', height: '1024px', userSelect: 'none', pointerEvents: 'auto', cursor: draggingId !== null ? 'grabbing' : 'default' }}
      >
        <img src={mapImage} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} alt="Mappa" />

        {/* Banner elegante in alto durante la fase di difesa */}
        {isGoblinAttackActive && isDefending && (
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 4000,
              pointerEvents: 'none',
              backgroundColor: 'rgba(127, 29, 29, 0.95)',
              border: '3px solid #ef4444',
              borderRadius: '16px',
              padding: '16px 40px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                color: '#fca5a5',
                fontSize: '32px',
                fontWeight: 900,
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                letterSpacing: '2px',
              }}
            >
              🔥 DIFENDI IL VILLAGGIO 🔥
            </span>
          </div>
        )}

        {locations.map((loc) => (
          <div
            key={loc.id}
            onMouseDown={() => handleMouseDown(loc.id)}
            onClick={() => {
              if (!loc.is_built) {
                // Se miniera e attacco attivo, mostra messaggio
                if (loc.buildingType === 'mine' && isGoblinAttackActive) {
                  setGoblinAttackMessage('Sentiero bloccato dai Goblin! Sconfiggili per accedere alla miniera');
                  setTimeout(() => setGoblinAttackMessage(''), 3000);
                  return;
                }
                setSelectedLocation(loc.id);
              }
            }}
            style={{
              position: 'absolute',
              top: `${loc.coordinateY}%`,
              left: `${loc.coordinateX}%`,
              transform: 'translate(-50%, -50%)',
              cursor: DISABLE_BUILDING_DRAG ? 'default' : (draggingId === loc.id ? 'grabbing' : 'grab'),
              zIndex: selectedLocation === loc.id ? 1000 : draggingId === loc.id ? 100 : 10,
              // Hide mine if not unlocked and not built, OR if goblin attack active
              display: (loc.buildingType === 'mine' && !isMineUnlocked && !loc.is_built) || 
                       (loc.buildingType === 'mine' && !isGoblinAttackActive) ? 'none' : 'flex',
              flexDirection: 'column-reverse', // etichetta sopra, immagine sotto
              alignItems: 'center',
              // Se attacco goblin attivo: disabilita solo gli edifici non-defense COSTRUITI
              opacity: isGoblinAttackActive && loc.buildingType !== 'defense' && loc.is_built ? 0.5 : 1,
              pointerEvents: isGoblinAttackActive && loc.buildingType !== 'defense' && loc.is_built ? 'none' : 'auto',
            }}
          >
            {/* Fire Swords Overlay when under attack - visible only in defending mode */}
            {(() => {
              const defended = defendedBuildings.includes(loc.name);
              const ruined = ruinedBuildings.includes(loc.name);
              const showSwords = isGoblinAttackActive && isDefending && loc.is_built && !defended && !ruined && loc.buildingType !== 'mine';
              if (!showSwords) return null;
              return (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to tactical with building context
                    setSelectedLocation(null);
                    window.location.href = `/solo?targetBuilding=${encodeURIComponent(loc.name)}&return=village`;
                  }}
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(255,69,0,0.85)',
                    border: '2px solid #ffae42',
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(255,140,0,0.8)',
                    animation: 'pulse 1s infinite',
                    zIndex: 2002,
                  }}
                  title={`Difendi ${loc.name}`}
                >
                  ⚔️🔥 Difendi
                </button>
              );
            })()}
            {/* Blue Hammer Overlay for ruined buildings (repair) */}
            {(() => {
              const ruined = ruinedBuildings.includes(loc.name);
              if (!ruined) return null;
              return (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openRepairPopup(loc);
                  }}
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(59,130,246,0.9)',
                    border: '2px solid #60a5fa',
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(59,130,246,0.8)',
                    animation: 'pulse 1s infinite',
                    zIndex: 2002,
                  }}
                  title={`Ripara ${loc.name}`}
                >
                  <span style={{ marginRight: '6px' }}>🔧</span> Ripara
                </button>
              );
            })()}
            <img
              src={getBuildingSprite(loc, ruinedBuildings)}
              alt={loc.name}
              style={{
                // Dimensionamento specifico per tipologia: magazzino +30%, miniera -50%
                width: loc.is_built
                  ? loc.buildingType === 'warehouse'
                    ? '203px'
                    : loc.buildingType === 'mine'
                      ? '60px'
                      : loc.buildingType === 'sawmill'
                        ? '156px'
                        : '120px'
                  : '60px',
                height: 'auto',
                pointerEvents: 'none',
                filter: loc.is_built ? 'none' : 'drop-shadow(0 0 10px gold)',
              }}
            />
            <span
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 'bold',
                marginBottom: '8px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
              }}
            >
              {loc.name}
            </span>

            {selectedLocation === loc.id && !loc.is_built && !(loc.buildingType === 'mine' && !isGoblinAttackActive) && (
              <div
                style={{
                  position: 'absolute',
                  left: '70px',
                  top: '0',
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '2px solid gold',
                  width: '220px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                  zIndex: 1001,
                  opacity: isGoblinAttackActive && loc.buildingType !== 'defense' ? 0.6 : 1,
                }}
              >
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{loc.name}</h3>
                <p style={{ fontSize: '12px', color: '#ccc', margin: 0 }}>
                  <strong>Effetto:</strong> {getEffectDescription(loc.buildingType)}
                </p>
                <div style={{ fontSize: '13px', margin: '12px 0' }}>
                  💰 {loc.requiredWood ?? loc.required_wood ?? 0} Legno | {loc.requiredStone ?? loc.required_stone ?? 0} Pietra | {loc.requiredGold ?? loc.required_gold ?? 0} Oro
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleBuildRequest(loc); }}
                    disabled={isGoblinAttackActive && loc.buildingType !== 'defense'}
                    style={{
                      backgroundColor: isGoblinAttackActive && loc.buildingType !== 'defense' ? '#666' : '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      cursor: isGoblinAttackActive && loc.buildingType !== 'defense' ? 'not-allowed' : 'pointer',
                      flex: 1,
                      opacity: isGoblinAttackActive && loc.buildingType !== 'defense' ? 0.6 : 1,
                    }}
                  >
                    Costruisci
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedLocation(null); }}
                    style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    X
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
      {/* Yellow Triangle Camp overlay above Mine when all attacks handled and mine not unlocked */}
      {(() => {
        if (isMineUnlocked) return null;
        const mineLoc = locations.find((l) => normalizeBuildingType(l) === 'mine');
        if (!mineLoc) return null;
        const anyUnderAttack = locations.some((loc) => {
          const defended = defendedBuildings.includes(loc.name);
          const ruined = ruinedBuildings.includes(loc.name);
          return isGoblinAttackActive && loc.is_built && !defended && !ruined;
        });
        if (anyUnderAttack) return null;
        return (
          <div
            style={{
              position: 'absolute',
              top: `${mineLoc.coordinateY}%`,
              left: `${mineLoc.coordinateX}%`,
              transform: 'translate(-50%, -120%)',
              zIndex: 3000,
            }}
          >
            <button
              onClick={() => setShowCampPopup(true)}
              style={{
                backgroundColor: 'rgba(234,179,8,0.9)',
                border: '2px solid #d97706',
                color: '#1f2937',
                padding: '8px 12px',
                borderRadius: '10px',
                fontWeight: '800',
                boxShadow: '0 0 20px rgba(234,179,8,0.8)',
                animation: 'pulse 1.2s infinite',
              }}
            >
              ⚠️ Accampamento Goblin
            </button>
          </div>
        );
      })()}
      {showCampPopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4000,
          }}
          onClick={() => setShowCampPopup(false)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a, #1f2937)',
              border: '3px solid #f59e0b',
              borderRadius: '16px',
              padding: '24px',
              width: '520px',
              color: 'white',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>Abbiamo scacciato gli assalitori!</h3>
            <p style={{ color: '#fef3c7', marginBottom: '16px' }}>
              Ora distruggiamo il loro covo per liberare definitivamente l'area.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowCampPopup(false);
                  window.location.href = '/solo';
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: '2px solid #b91c1c',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ATTACCA IL COVO
              </button>
              <button
                onClick={() => setShowCampPopup(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#374151',
                  color: 'white',
                  border: '2px solid #6b7280',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ANNULLA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repair Popup */}
      {showRepairPopup && repairTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4500,
          }}
          onClick={() => setShowRepairPopup(false)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a, #1f2937)',
              border: '3px solid #60a5fa',
              borderRadius: '16px',
              padding: '24px',
              width: '520px',
              color: 'white',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>
              Vuoi riparare {repairTarget?.name}?
            </h3>
            <p style={{ color: '#c7d2fe', marginBottom: '16px' }}>
              Costo di riparazione (50% dei materiali originali):
            </p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1, backgroundColor: 'rgba(30,58,138,0.5)', padding: '10px', borderRadius: '10px', border: '2px solid #93c5fd' }}>
                🪵 Legno: <strong>{repairCost.wood}</strong>
              </div>
              <div style={{ flex: 1, backgroundColor: 'rgba(30,58,138,0.5)', padding: '10px', borderRadius: '10px', border: '2px solid #93c5fd' }}>
                🪨 Pietra: <strong>{repairCost.stone}</strong>
              </div>
              <div style={{ flex: 1, backgroundColor: 'rgba(30,58,138,0.5)', padding: '10px', borderRadius: '10px', border: '2px solid #93c5fd' }}>
                💰 Oro: <strong>{repairCost.gold}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={confirmRepair}
                style={{
                  flex: 1,
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: '2px solid #60a5fa',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                CONFERMA RIPARAZIONE
              </button>
              <button
                onClick={() => setShowRepairPopup(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#374151',
                  color: 'white',
                  border: '2px solid #6b7280',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ANNULLA
              </button>
            </div>
          </div>
        </div>
      )}
};

export default HomeDashboard;
