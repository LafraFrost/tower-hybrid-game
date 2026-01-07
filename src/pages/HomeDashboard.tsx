import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
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
    ⬅️ Menu Principale
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

const RefreshButton = ({ onRefresh }: { onRefresh: () => void }) => (
  <button 
    onClick={onRefresh}
    style={{
      position: 'absolute',
      top: '20px',
      right: '160px',
      opacity: 0.9,
      fontSize: '12px',
      padding: '8px 12px',
      backgroundColor: '#0ea5e9',
      color: 'white',
      border: '2px solid #0369a1',
      borderRadius: '4px',
      cursor: 'pointer',
      zIndex: 9999,
      transition: 'all 0.3s',
      fontWeight: 'bold',
      pointerEvents: 'auto',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.boxShadow = '0 0 15px rgba(14, 165, 233, 0.8)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = '0.9';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    🔄 RICARICA DB
  </button>
);

const HomeDashboard = () => {
  const [, setLocation] = useLocation();
  const [locations, setLocations] = useState<any[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [resources, setResources] = useState<any>({ wood: 0, stone: 0, gold: 0 });
  const [isGoblinAttackActive, setIsGoblinAttackActive] = useState(false);
  const [goblinAttackMessage, setGoblinAttackMessage] = useState('');
  const [showGoblinAlert, setShowGoblinAlert] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

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
      const { data, error } = await supabase
        .from('game_locations')
        .select('*')
        .order('id');

      console.log('📊 Supabase query result:', { data, error, dataLength: data?.length });

      if (!error && data && data.length > 0) {
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
      .then((data) => setResources(data || { wood: 0, stone: 0, gold: 0 }))
      .catch((err) => {
        console.warn('API not available, using default resources:', err);
        setResources({ wood: 500, stone: 300, gold: 150 });
      });
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

  // Quando attacco goblin si attiva, mostra l'alert
  useEffect(() => {
    if (isGoblinAttackActive) {
      console.log('🚨 Goblin attack activated! Showing alert dialog');
      setShowGoblinAlert(true);
    }
  }, [isGoblinAttackActive]);

  const handleDefend = () => {
    setShowGoblinAlert(false);
    setLocation("/solo");
  };

  const handleMouseDown = (id: number) => {
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
        alert(`Risorse insufficienti! Servono: ${requiredWood} Legno, ${requiredStone} Pietra, ${requiredGold} Oro`);
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
      alert(`${loc.name} costruito con successo!`);
    } catch (err) {
      console.error('Errore build:', err);
      alert('Errore durante la costruzione');
    }
  };

  const handleBuildClick = (loc: any) => {
    setSelectedLocation(loc.id);
    handleBuildRequest(loc).catch((err) => {
      console.error('Errore build:', err);
      alert('Errore nella richiesta di costruzione');
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId === null || !mapRef.current) return;

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
      <RefreshButton onRefresh={loadLocations} />
      <DevTriggerButton isActive={isGoblinAttackActive} onToggle={toggleGoblinAttack} />
      <ResourceBar resources={resources} />

      {/* Overlay Attacco Goblin (solo background pulsante, NO testo qui) */}
      {isGoblinAttackActive && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(255, 0, 0, 0.4)',
            zIndex: 3000,
            animation: 'pulse 1s infinite',
            pointerEvents: 'none',
          }}
        >
          <style>{`
            @keyframes pulse {
              0%, 100% { background-color: rgba(255, 0, 0, 0.4); }
              50% { background-color: rgba(255, 0, 0, 0.6); }
            }
          `}</style>
        </div>
      )}

      {/* AlertDialog per attacco goblin */}
      <AlertDialog open={showGoblinAlert} onOpenChange={setShowGoblinAlert}>
        <AlertDialogContent className="bg-gradient-to-b from-red-950 to-black border-2 border-red-500 max-w-md">
          <AlertDialogTitle className="text-2xl text-red-400 flex items-center gap-2">
            <Swords className="w-6 h-6" />
            ⚠️ ATTACCO GOBLIN! ⚠️
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white text-base space-y-3">
            <p className="font-bold text-lg">
              I Goblin stanno attaccando il vostro insediamento!
            </p>
            <p>
              Una orda di goblin selvaggi ha invaso il territorio. Dovete difendere immediatamente il vostro avamposto!
            </p>
            <p className="text-yellow-300 font-bold">
              Clicca "DIFENDI" per entrare in battaglia subito!
            </p>
          </AlertDialogDescription>
          <div className="pt-4">
            <Button
              onClick={handleDefend}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-2xl py-6 flex items-center justify-center gap-4"
            >
              <Swords className="w-7 h-7" />
              DIFENDI
              <Swords className="w-7 h-7" />
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

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
        style={{ position: 'relative', width: '1024px', height: '1024px', userSelect: 'none', pointerEvents: isGoblinAttackActive ? 'none' : 'auto', cursor: draggingId !== null ? 'grabbing' : 'default' }}
      >
        <img src="/assets/casa.jpg" style={{ width: '100%', height: '100%', pointerEvents: 'none' }} alt="Mappa" />

        {/* Scritta attacco goblin centrata nella mappa */}
        {isGoblinAttackActive && (
          <>
            <style>{`
              @keyframes wobble {
                0%, 100% { transform: translateX(0) }
                25% { transform: translateX(-8px) }
                75% { transform: translateX(8px) }
              }
            `}</style>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                width: '100%',
                textAlign: 'center',
                transform: 'translateY(-50%)',
                zIndex: 4000,
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  color: 'red',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  textShadow: '0 0 20px rgba(255, 0, 0, 0.8)',
                  margin: 0,
                  animation: 'wobble 0.8s infinite',
                }}
              >
                ⚠️ ATTACCO GOBLIN IN CORSO! ⚠️
              </span>
            </div>
          </>
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
              cursor: draggingId === loc.id ? 'grabbing' : 'grab',
              zIndex: selectedLocation === loc.id ? 1000 : draggingId === loc.id ? 100 : 10,
              display: 'flex',
              flexDirection: 'column-reverse', // etichetta sopra, immagine sotto
              alignItems: 'center',
              opacity: isGoblinAttackActive && loc.buildingType !== 'defense' && !loc.is_built ? 0.5 : 1,
              pointerEvents: isGoblinAttackActive && loc.buildingType !== 'defense' && !loc.is_built ? 'none' : 'auto',
            }}
          >
            <img
              src={loc.is_built ? buildingAssets[loc.buildingType] || '/assets/magazzino.png' : hammerIcon}
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

            {selectedLocation === loc.id && !loc.is_built && (
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
};

export default HomeDashboard;
