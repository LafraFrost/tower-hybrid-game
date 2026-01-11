import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabaseClient';
import ResourceBar, { MenuButton, ResetButton } from '@/components/ResourceBar';

const normalizeBuildingType = (loc: any) => {
  return loc.building_type || (loc.name?.toLowerCase().includes('miniera') ? 'mine' : 'house');
};

const HomeDashboard = () => {
  const [, setLocation] = useLocation(); // Router per navigazione
  const [locations, setLocations] = useState<any[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [resources, setResources] = useState<any>({ wood: 0, stone: 0, gold: 0 });
  const [mapImage, setMapImage] = useState('/assets/casa.jpg');
  const [isDefending, setIsDefending] = useState(false);
  const [activeMiniCombat, setActiveMiniCombat] = useState<string | null>(null);
  const [showRepairPopup, setShowRepairPopup] = useState(false);
  const [repairTarget, setRepairTarget] = useState<any>(null);
  const [repairCost, setRepairCost] = useState<{ wood: number; stone: number; gold: number }>({ wood: 0, stone: 0, gold: 0 });
  const mapRef = useRef<HTMLDivElement>(null);
  const defenseCheckDoneRef = useRef(false);
  const [showMineRebuildPopup, setShowMineRebuildPopup] = useState(false);
  const [mineRebuildCost] = useState<{ stone: number; gold: number }>({ stone: 100, gold: 50 });
  
  // Derive isGoblinAttackActive from locations to prevent flash on mount
  const isGoblinAttackActive = locations.some(loc => Boolean(loc.is_under_attack) && Boolean(loc.is_built));

  // Helper: refresh locations from Supabase and update local state
  const fetchLocations = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('game_locations')
        .select('*')
        .order('id');
      if (error) {
        console.warn('⚠️ Failed to fetch locations:', error);
        return false;
      }
      if (data) {
        setLocations(
          data.map((loc: any) => ({
            ...loc,
            is_built: Boolean(loc.is_built),
            buildingType: normalizeBuildingType(loc),
          }))
        );
      }
      return true;
    } catch (err) {
      console.warn('⚠️ Exception while fetching locations:', err);
      return false;
    }
  };

  type Toast = { id: number; type: 'success' | 'error' | 'warning' | 'info'; message: string; persistent?: boolean; duration?: number };
  const [toasts, setToasts] = useState<Toast[]>([]);
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
  const allowToastRef = useRef(false);

  // Allow toasts after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      allowToastRef.current = true;
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const prev = prevResRef.current;
    if (firstResLoadRef.current) {
      firstResLoadRef.current = false;
    } else if (allowToastRef.current) {
      const dw = (resources.wood ?? 0) - (prev.wood ?? 0);
      const ds = (resources.stone ?? 0) - (prev.stone ?? 0);
      const dg = (resources.gold ?? 0) - (prev.gold ?? 0);
      if (dw !== 0) showToast(dw > 0 ? 'success' : 'error', `🪵 ${dw > 0 ? '+' : ''}${dw}`, { duration: 2000 });
      if (ds !== 0) showToast(ds > 0 ? 'success' : 'error', `🪨 ${ds > 0 ? '+' : ''}${ds}`, { duration: 2000 });
      if (dg !== 0) showToast(dg > 0 ? 'success' : 'error', `💰 ${dg > 0 ? '+' : ''}${dg}`, { duration: 2000 });
    }
    prevResRef.current = { wood: resources.wood ?? 0, stone: resources.stone ?? 0, gold: resources.gold ?? 0 };
  }, [resources]);

  const loadLocations = React.useCallback(async () => {
    console.log('🔍 Loading locations from database...');
    
    // Locations con coordinate salvate (martelli per non costruiti, edifici dopo pagamento)
    const baseLocations = [
      { id: 1, name: 'Magazzino', buildingType: 'warehouse', coordinateX: 35.0, coordinateY: 42.0, is_built: false, is_unlocked: true, requiredWood: 100, requiredStone: 50, requiredGold: 20 },
      { id: 2, name: 'Orto', buildingType: 'farm', coordinateX: 40.0, coordinateY: 48.0, is_built: true, is_unlocked: true, requiredWood: 80, requiredStone: 30, requiredGold: 10 },
      { id: 3, name: 'Fucina', buildingType: 'blacksmith', coordinateX: 30.0, coordinateY: 55.0, is_built: false, is_unlocked: true, requiredWood: 120, requiredStone: 80, requiredGold: 50 },
      { id: 4, name: 'Ponte', buildingType: 'bridge', coordinateX: 60.0, coordinateY: 50.0, is_built: false, is_unlocked: true, requiredWood: 150, requiredStone: 100, requiredGold: 30 },
      { id: 5, name: 'Miniera', buildingType: 'mine', coordinateX: 52.0, coordinateY: 38.0, is_built: false, is_unlocked: false, requiredWood: 90, requiredStone: 120, requiredGold: 40 },
      { id: 6, name: 'Segheria', buildingType: 'sawmill', coordinateX: 20.0, coordinateY: 45.0, is_built: false, is_unlocked: true, requiredWood: 60, requiredStone: 40, requiredGold: 15 },
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
      } catch (err) {
        console.error('Error loading from Supabase:', err);
      }
    };
    loadFromSupabase();
  }, []);

  useEffect(() => {
    // Subscribe to goblin attack event changes in Supabase (v2 realtime API)
    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload: any) => {
        console.log('Real-time event update:', payload);
        // Reload locations to update derived isGoblinAttackActive
        if (payload?.new?.event_type === 'goblin_attack') {
          loadLocations();
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
        // State is now derived from locations, just log
        console.log('🎯 Goblin event loaded:', data.is_active ? 'ACTIVE' : 'INACTIVE');
      }
    };

    loadGoblinEvent();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // isDefending state is managed locally (no persistence needed)

  // Quando attacco goblin si attiva, passa direttamente a modalità difesa (banner fisso al top, no toast)
  useEffect(() => {
    if (isGoblinAttackActive) {
      console.log('🚨 Goblin attack activated! Entering defense mode immediately.');
      setIsDefending(true);
    }
  }, [isGoblinAttackActive]);

  // Hide red alert when no buildings under attack remain
  // Debounced: runs only once after all buildings are handled, prevents loop
  useEffect(() => {
    const anyUnderAttack = locations.some((loc) => {
      const bt = normalizeBuildingType(loc);
      if (!bt) return false;
      const built = Boolean(loc.is_built);
      const underAttack = Boolean(loc.is_under_attack);
      return isGoblinAttackActive && built && underAttack;
    });
    
    if (!anyUnderAttack && isGoblinAttackActive) {
      // Execute defense check completion ONLY ONCE after all buildings handled
      if (!defenseCheckDoneRef.current) {
        defenseCheckDoneRef.current = true;
        console.log('✅ All buildings defended/ruined - defense check complete (debounced)');
        
        // Reset defending mode when done
        if (isDefending) {
          setIsDefending(false);
          console.log('✅ Exiting defense mode');
        }
      }
    } else {
      // Reset debounce flag if attack becomes active again
      if (isGoblinAttackActive) {
        defenseCheckDoneRef.current = false;
      }
    }
  }, [isGoblinAttackActive, locations, isDefending]);

  // Reset defense mode when closing TacticalScreen (e.g., returning from Boss battle)
  useEffect(() => {
    if (activeMiniCombat === null && isDefending) {
      setIsDefending(false);
      console.log('🎬 TacticalScreen chiuso - isDefending resettato a false');
    }
  }, [activeMiniCombat]);


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

      // Check if it's the mine and it's not unlocked yet (DB-driven check)
      if (loc.buildingType === 'mine' && !Boolean(loc.is_unlocked)) {
        showToast('warning', '🔒 La Miniera è bloccata! Difendi il villaggio dall\'attacco Goblin per sbloccarla.', { duration: 4000 });
        setSelectedLocation(null);
        return;
      }

      // Se attacco goblin attivo, disabilita build per tutte le strutture tranne difesa
      if (isGoblinAttackActive && loc.buildingType !== 'defense') {
        showToast('warning', '⚠️ Durante l\'attacco Goblin puoi costruire solo strutture di difesa!', { duration: 3000 });
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

    // DB-driven: building repair is now persisted in Supabase only
    await fetchLocations(); // Refresh locations from DB

    showToast('success', `🛠️ ${repairTarget.name} riparato correttamente! Bonus passivi riattivati.`, { duration: 3000 });
    setShowRepairPopup(false);
    setRepairTarget(null);
  };

  // Confirm Mine Rebuild: unlock visible triangle → rebuild mine in DB
  const confirmMineRebuild = async () => {
    const mineLoc = locations.find((l) => normalizeBuildingType(l) === 'mine');
    if (!mineLoc) {
      showToast('error', '❌ Miniera non trovata.', { duration: 3000 });
      return;
    }
    if (mineLoc.is_built) {
      setShowMineRebuildPopup(false);
      return;
    }

    // Resource check
    const needStone = mineRebuildCost.stone;
    const needGold = mineRebuildCost.gold;
    const hasEnough = (resources.stone ?? 0) >= needStone && (resources.gold ?? 0) >= needGold;
    if (!hasEnough) {
      showToast('error', `❌ Risorse insufficienti! Servono: ${needStone} Pietra, ${needGold} Oro.`, { duration: 4000 });
      return;
    }

    // Deduct locally and try to persist on Supabase
    setResources((prev: any) => ({
      ...prev,
      stone: Math.max(0, (prev.stone ?? 0) - needStone),
      gold: Math.max(0, (prev.gold ?? 0) - needGold),
    }));

    try {
      // Persist resource deduction if table exists
      const { data: resData, error: resErr } = await supabase
        .from('user_resources')
        .select('stone, gold')
        .eq('user_id', 1)
        .maybeSingle();
      if (!resErr && resData) {
        const newStone = Math.max(0, (resData.stone ?? 0) - needStone);
        const newGold = Math.max(0, (resData.gold ?? 0) - needGold);
        await supabase
          .from('user_resources')
          .update({ stone: newStone, gold: newGold })
          .eq('user_id', 1);
      }
    } catch (err) {
      console.warn('⚠️ Supabase resource update failed (continuing with local only):', err);
    }

    // Update game_locations: is_built = true
    const { error: buildErr } = await supabase
      .from('game_locations')
      .update({ is_built: true })
      .eq('id', mineLoc.id);
    if (buildErr) {
      console.warn('⚠️ Impossibile ricostruire Miniera in DB:', buildErr);
      showToast('error', '❌ Errore DB durante la ricostruzione della Miniera.', { duration: 4000 });
      return;
    }

    // Refresh locations from DB to reflect rebuilt mine
    const ok = await fetchLocations();
    if (!ok) {
      showToast('error', '⚠️ Sincronizzazione fallita dopo ricostruzione.', { duration: 3000 });
      return;
    }

    setShowMineRebuildPopup(false);
    showToast('success', '⛏️ Miniera ricostruita con successo!', { duration: 3000 });
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

  const handleMiniCombatVictory = async (buildingName: string) => {
    // Update Supabase game_locations to clear under_attack flag
    const buildingLoc = locations.find((l) => l.name === buildingName);
    let buildingUpdateSuccess = true;
    
    if (buildingLoc) {
      try {
        const { error } = await supabase
          .from('game_locations')
          .update({ is_under_attack: false })
          .eq('id', buildingLoc.id);
        
        if (error) {
          console.warn(`⚠️ Supabase update failed for ${buildingName}:`, error);
          buildingUpdateSuccess = false;
          showToast('error', `Errore DB: impossibile salvare difesa di ${buildingName}. Riprova.`);
        } else {
          console.log(`✅ Supabase updated for ${buildingName}`);
        }
      } catch (err) {
        console.warn(`⚠️ Supabase error for ${buildingName}:`, err);
        buildingUpdateSuccess = false;
        showToast('error', `Errore DB: ${String((err as any)?.message || err)}.`);
      }
    }
    
    // If building update failed, keep defense mode and do not close overlay
    if (!buildingUpdateSuccess) {
      return;
    }

    // Verifica se restano edifici sotto attacco; se no, spegni evento e sblocca la Miniera
    const currentLocId = buildingLoc?.id ?? null;
    const remainingAttacks = locations.filter((l) => Boolean(l.is_under_attack) && l.id !== currentLocId);

    if (remainingAttacks.length === 0) {
      const { error: eventErr } = await supabase
        .from('events')
        .update({ is_active: false })
        .eq('event_type', 'goblin_attack');
      if (eventErr) {
        console.warn('⚠️ Failed to deactivate goblin event:', eventErr);
        showToast('error', 'Errore DB: impossibile terminare evento Goblin.');
        return; // Do not close UI if DB failed
      }

      const { error: mineErr } = await supabase
        .from('game_locations')
        .update({ is_unlocked: true })
        .eq('building_type', 'mine');
      if (mineErr) {
        console.warn('⚠️ Failed to unlock Mine:', mineErr);
        showToast('error', 'Errore DB: impossibile sbloccare la Miniera.');
        return; // Do not close UI if DB failed
      }

      console.log('🔥 Attacco terminato! Evento spento e Miniera sbloccata.');
    }

    // Sync locations after DB updates
    const refreshed = await fetchLocations();
    if (!refreshed) {
      showToast('error', 'Errore DB: sincronizzazione locations fallita.');
      return; // Keep defense mode if refresh fails
    }

    // Clean up UI IMMEDIATELY after DB success and refresh (prima dei toast)
    setIsDefending(false);
    setActiveMiniCombat(null);
    
    // Show victory toast feedback DOPO aver pulito lo stato
    showToast('success', `✅ ${buildingName} è stato difeso!`, { duration: 3000 });
    
    console.log('🎉 Mini combat victory:', buildingName, '- isDefending resettato a false');
  };

  const handleMiniCombatDefeat = async (buildingName: string) => {
    // Update Supabase game_locations to clear under_attack flag
    const buildingLoc = locations.find((l) => l.name === buildingName);
    let buildingUpdateSuccess = true;
    
    if (buildingLoc) {
      try {
        const { error } = await supabase
          .from('game_locations')
          .update({ is_under_attack: false })
          .eq('id', buildingLoc.id);
        
        if (error) {
          console.warn(`⚠️ Supabase update failed for ${buildingName}:`, error);
          buildingUpdateSuccess = false;
          showToast('error', `Errore DB: impossibile salvare distruzione di ${buildingName}.`);
        } else {
          console.log(`💀 Supabase updated for ${buildingName}`);
        }
      } catch (err) {
        console.warn(`⚠️ Supabase error for ${buildingName}:`, err);
        buildingUpdateSuccess = false;
        showToast('error', `Errore DB: ${String((err as any)?.message || err)}.`);
      }
    }
    
    // If building update failed, keep defense mode and do not close overlay
    if (!buildingUpdateSuccess) {
      return;
    }

    // Check if any buildings still under attack (using DB field)
    const anyUnderAttackLeft = locations.some((loc) => {
      const bt = normalizeBuildingType(loc);
      if (!bt) return false;
      const built = Boolean(loc.is_built);
      const underAttack = Boolean(loc.is_under_attack);
      return isGoblinAttackActive && built && underAttack && loc.name !== buildingName;
    });

    // If none left, deactivate goblin event (do not unlock Mine on defeat)
    if (!anyUnderAttackLeft) {
      const { error: eventErr } = await supabase
        .from('events')
        .update({ is_active: false })
        .eq('event_type', 'goblin_attack');
      if (eventErr) {
        console.warn('⚠️ Failed to deactivate goblin event:', eventErr);
        showToast('error', 'Errore DB: impossibile terminare evento Goblin.');
        return; // Do not close UI if DB failed
      }
    }

    // Sync locations after DB updates
    const refreshed = await fetchLocations();
    if (!refreshed) {
      showToast('error', 'Errore DB: sincronizzazione locations fallita.');
      return; // Keep defense mode if refresh fails
    }

    // Clean up UI only after DB success and refresh
    setActiveMiniCombat(null);
    setIsDefending(false);
    
    // Show defeat toast feedback
    showToast('error', `❌ ${buildingName} è stato distrutto!`, { duration: 3000 });
    
    console.log('💀 Mini combat defeat:', buildingName);
  };

  const handleReset = async () => {
    if (!window.confirm('🚨 ATTENZIONE! 🚨\n\nSei SICURO? Questo cancellerà TUTTI i progressi del villaggio e del personaggio!\n\nNon potrai recuperare i dati.')) {
      return;
    }

    console.log('🌪️ Starting Great Wipe...');

    // Clear Supabase data
    try {
      // Reset resources to initial values
      const { error: resError } = await supabase
        .from('user_resources')
        .update({ 
          wood: 0,
          stone: 50,
          gold: 0,
        })
        .eq('user_id', 1);

      if (resError) {
        console.warn('⚠️ Could not reset resources:', resError);
      } else {
        console.log('✓ Resources reset in Supabase');
      }

      // Reset all buildings to not built (except house, id=0)
      const { error: buildError } = await supabase
        .from('game_locations')
        .update({ is_built: false })
        .neq('id', 0);

      if (buildError) {
        console.warn('⚠️ Could not reset buildings:', buildError);
      } else {
        console.log('✓ Buildings reset in Supabase');
      }

      // Reset Mine unlock status
      const { error: mineResetError } = await supabase
        .from('game_locations')
        .update({ is_unlocked: false })
        .eq('name', 'Miniera');

      if (mineResetError) {
        console.warn('⚠️ Could not reset Mine unlock:', mineResetError);
      } else {
        console.log('✓ Mine unlock status reset in Supabase');
      }

      // Disable goblin attack event
      const { error: eventError } = await supabase
        .from('events')
        .update({ is_active: false })
        .eq('event_type', 'goblin_attack');

      if (eventError) {
        console.warn('⚠️ Could not disable goblin event:', eventError);
      } else {
        console.log('✓ Goblin attack disabled in Supabase');
      }
    } catch (err) {
      console.warn('⚠️ Supabase reset error:', err);
    }

    // 3. Close UI overlays and modals
    setToasts([]);
    setShowRepairPopup(false);
    setRepairTarget(null);
    setActiveMiniCombat(null);
    setSelectedLocation(null);
    setIsDefending(false);

    console.log('🎉 Great Wipe complete! Reloading app...');
    
    // 4. Full reload
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-black select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      ref={mapRef}
    >
      {/* 1. SFONDO MAPPA */}
      <img 
        src={mapImage} 
        alt="Villaggio" 
        className="w-full h-full object-cover pointer-events-none"
      />


      {/* 3. ALTRI EDIFICI E MARTELLI */}
      {locations
        .filter((loc) => normalizeBuildingType(loc) !== 'mine')
        .map((loc) => {
          return (
            <div
              key={loc.id}
              onMouseDown={() => handleMouseDown(loc.id)}
              onClick={() => setSelectedLocation(loc.id)}
              className="absolute cursor-pointer transition-transform hover:scale-110"
              style={{
                top: `${loc.coordinateY || 50}%`,
                left: `${loc.coordinateX || 50}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: draggingId === loc.id ? 1000 : 100,
              }}
            >
              <img 
                src={getBuildingSprite(loc)} 
                alt={loc.name} 
                className={`w-16 h-16 object-contain ${!loc.is_built ? 'opacity-80' : ''}`} 
              />
            </div>
          );
        })}

      {/* UI OVERLAYS (ResourceBar, Menu, Toasts) */}
      <ResourceBar resources={resources} />
      <MenuButton />
      <ResetButton onReset={handleReset} />

      {/* TOASTS */}
      <div className="absolute bottom-5 left-5 z-[3000] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`p-3 rounded shadow-lg text-white font-bold ${
            t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* COMBAT OVERLAY */}
      {activeMiniCombat && (
        <div className="absolute inset-0 z-[5000]">
          <TacticalScreen 
            isVillageDefenseMode={true}
            buildingName={activeMiniCombat}
            onVillageVictory={(buildingName) => handleMiniCombatVictory(buildingName)}
            onVillageDefeat={(buildingName) => handleMiniCombatDefeat(buildingName)}
            onVillageClose={() => setActiveMiniCombat(null)}
          />
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
    </div>
  );
};

export default HomeDashboard;
