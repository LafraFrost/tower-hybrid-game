import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface LocationData {
  id: number;
  userId: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  sessionType: string | null;
  createdAt: string;
  userEmail: string;
  userName: string;
}

interface TrackingMapProps {
  locations: LocationData[];
}

const neonCyanIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #06B6D4;
      border: 3px solid #22D3EE;
      border-radius: 50%;
      box-shadow: 0 0 15px #06B6D4, 0 0 30px #06B6D4;
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

const neonMagentaIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #D946EF;
      border: 3px solid #E879F9;
      border-radius: 50%;
      box-shadow: 0 0 15px #D946EF, 0 0 30px #D946EF;
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

const neonYellowIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #FACC15;
      border: 3px solid #FDE047;
      border-radius: 50%;
      box-shadow: 0 0 15px #FACC15, 0 0 30px #FACC15;
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

function getMarkerIcon(sessionType: string | null) {
  switch (sessionType) {
    case 'solo':
      return neonYellowIcon;
    case 'tabletop':
      return neonMagentaIcon;
    default:
      return neonCyanIcon;
  }
}

function FitBounds({ locations }: { locations: LocationData[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;
    
    const bounds = L.latLngBounds(
      locations.map(loc => [loc.latitude, loc.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [locations, map]);

  return null;
}

export default function TrackingMap({ locations }: TrackingMapProps) {
  if (locations.length === 0) {
    return (
      <div 
        className="h-64 rounded border border-gray-700 bg-gray-900/50 flex items-center justify-center"
        data-testid="map-empty"
      >
        <p className="text-gray-500">Nessuna posizione da visualizzare</p>
      </div>
    );
  }

  const center: [number, number] = [
    locations[0].latitude,
    locations[0].longitude
  ];

  return (
    <div 
      className="h-80 rounded border border-cyan-500/30 overflow-hidden"
      data-testid="tracking-map"
    >
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds locations={locations} />
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.latitude, loc.longitude]}
            icon={getMarkerIcon(loc.sessionType)}
          >
            <Popup>
              <div className="text-black text-sm min-w-[180px]">
                <div className="font-bold text-base mb-1">{loc.userName}</div>
                <div className="text-gray-600 text-xs mb-2">{loc.userEmail}</div>
                {loc.sessionType && (
                  <div className="mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      loc.sessionType === 'solo' 
                        ? 'bg-yellow-100 text-yellow-700'
                        : loc.sessionType === 'tabletop'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {loc.sessionType.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                  <div>
                    <span className="text-gray-500">Lat:</span>
                    <span className="ml-1 font-mono">{loc.latitude.toFixed(5)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Lng:</span>
                    <span className="ml-1 font-mono">{loc.longitude.toFixed(5)}</span>
                  </div>
                </div>
                {loc.accuracy && (
                  <div className="text-xs text-gray-500 mb-1">
                    Precisione: {loc.accuracy.toFixed(1)}m
                  </div>
                )}
                <div className="text-xs text-gray-400 border-t pt-1 mt-1">
                  {format(new Date(loc.createdAt), 'dd MMM yyyy HH:mm', { locale: it })}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
