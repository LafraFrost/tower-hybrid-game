import React, { useEffect, useRef, useState } from 'react';

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

// DevTriggerButton rimosso — non esporre controllo sviluppo per attacchi Goblin

const HomeDashboard = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [resources, setResources] = useState<any>({ wood: 0, stone: 0, gold: 0 });
  const [mapImage, setMapImage] = useState('/assets/casa.jpg');
  const [isGoblinAttackActive, setIsGoblinAttackActive] = useState(false);
  const [goblinAttackMessage, setGoblinAttackMessage] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);

  const loadLocations = React.useCallback(() => {
    fetch('/api/user-locations', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setLocations((data || []).map((loc: any) => {
        const buildingType = normalizeBuildingType(loc);
        const cxRaw = loc.coordinateX ?? (loc.x != null ? (loc.x / 1024 * 100) : undefined);
        const cyRaw = loc.coordinateY ?? (loc.y != null ? (loc.y / 1024 * 100) : undefined);
        const clamp = (v: any) => {
          const n = Number(v);
          if (!isFinite(n)) return 50;
          return Math.max(0, Math.min(100, n));
        };
        return {
          ...loc,
          is_built: Boolean(loc.is_built),
          buildingType,
          coordinateX: clamp(cxRaw),
          coordinateY: clamp(cyRaw),
        };
      })))
      .catch((err) => console.error('Errore caricamento posizioni:', err));
  }, []);

  // Dev toggle removed: no dev endpoint to trigger goblin attack from client

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    fetch('/api/user-resources', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setResources(data || { wood: 0, stone: 0, gold: 0 }))
      .catch((err) => console.error('Errore risorse:', err));
  }, []);

  // Cambia lo sfondo della mappa in base all'ora italiana (Europe/Rome): giorno 08:00-19:59, notte 20:00-07:59
  useEffect(() => {
    const pickImage = () => {
      const formatter = new Intl.DateTimeFormat('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/Rome'
      });
      const italianTime = formatter.format(new Date());
      const hour = parseInt(italianTime.split(':')[0], 10);
      const isDay = hour >= 8 && hour < 20;
      setMapImage(isDay ? '/assets/casa.jpg' : '/assets/casa notte.jpg');
      console.log(`🌍 Ora Italia (Europe/Rome): ${italianTime} → ${isDay ? '☀️ Giorno' : '🌙 Notte'}`);
    };
    pickImage();
    const id = setInterval(pickImage, 60_000);
    return () => clearInterval(id);
  }, []);

  // Controlla lo stato dell'attacco goblin ogni 10 secondi
  useEffect(() => {
    const checkGoblinStatus = () => {
      fetch('/api/event-status', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          setIsGoblinAttackActive(data.isGoblinAttackActive || false);
        })
        .catch((err) => console.error('Errore verificare evento:', err));
    };

    // Controlla subito al mount
    checkGoblinStatus();

    // Poi ogni 10 secondi
    const interval = setInterval(checkGoblinStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleMouseDown = (id: number) => {
    if (DISABLE_BUILDING_DRAG) return;
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

      const res = await fetch('/api/build-building', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ locationId: loc.id })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert(`${loc.name} costruito con successo!`);
        setSelectedLocation(null);
        // Optimistic update, then refresh from server to stay in sync
        setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, is_built: true, buildingType: normalizeBuildingType(l) } : l));
        const requiredWood = loc.requiredWood ?? loc.required_wood ?? 0;
        const requiredStone = loc.requiredStone ?? loc.required_stone ?? 0;
        const requiredGold = loc.requiredGold ?? loc.required_gold ?? 0;
        setResources(prev => ({
          wood: Math.max(0, (prev.wood ?? 0) - requiredWood),
          stone: Math.max(0, (prev.stone ?? 0) - requiredStone),
          gold: Math.max(0, (prev.gold ?? 0) - requiredGold),
        }));
        loadLocations();
      } else {
        const missing = data.missingResources
          ? ` Mancano: ${Object.entries(data.missingResources).map(([k, v]) => `${k}: ${v}`).join(', ')}`
          : '';
        alert(`Errore: ${data.error || data.message || 'Risorse insufficienti'}${missing}`);
      }
    } catch (err) {
      console.error('Errore di connessione al server:', err);
      alert('Errore di connessione al server');
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
      const response = await fetch('/api/update-location-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          coordinateX: parseFloat(x.toFixed(2)),
          coordinateY: parseFloat(y.toFixed(2)),
        }),
      });

      if (response.ok) {
        console.log(`✅ Posizione salvata per ${id}`);
      }
    } catch (err) {
      console.error('❌ Errore nel salvataggio posizione:', err);
    }
  };

  return (
    <div
      style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', position: 'relative' }}
    >
      <MenuButton />
      {/* DevTriggerButton removed in main app */}
      <ResourceBar resources={resources} />

      {/* Banner testuale animato: centrato tra ResourceBar (20px) e messaggio (100px) */}
      {isGoblinAttackActive && (
        <>
          <style>{`
            @keyframes pulse {
              0%, 100% { background-color: rgba(255, 0, 0, 0.4); }
              50% { background-color: rgba(255, 0, 0, 0.6); }
            }
            @keyframes wobble {
              0%, 100% { transform: translateX(0) }
              25% { transform: translateX(-8px) }
              75% { transform: translateX(8px) }
            }
          `}</style>
          {/* Overlay visivo leggero per l'attacco (senza contenuti) */}
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
          />
          {/* Scritta che si muove: una sola riga, centrata tra barra risorse e messaggio */}
          {/* (Rimosso) Banner fisso in alto: spostato al centro della mappa */}
        </>
      )}

      {/* Messaggio temporaneo attacco goblin */}
      {isGoblinAttackActive && goblinAttackMessage && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            width: '100%',
            textAlign: 'center',
            transform: 'translateY(-50%)',
            zIndex: 2500,
            pointerEvents: 'none',
          }}
        >
          <style>{`
            @keyframes fadeInOut {
              0%, 100% { opacity: 0; }
              10%, 90% { opacity: 1; }
            }
          `}</style>
          <span style={{ fontSize: '16px', fontWeight: 'bold', animation: 'fadeInOut 3s ease-in-out' }}>
            {goblinAttackMessage}
          </span>
        </div>
      )}

      <div
        ref={mapRef}
        style={{ position: 'relative', width: '1024px', height: '1024px', userSelect: 'none', pointerEvents: isGoblinAttackActive ? 'none' : 'auto' }}
      >
        <img src={mapImage} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} alt="Mappa" />


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
              cursor: DISABLE_BUILDING_DRAG ? 'default' : 'pointer',
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



