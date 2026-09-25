'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LOCATIONS, CAMPUS_CENTER, CAMPUS_ZOOM } from '@/lib/locations';

function pinIcon(count, selected) {
  return L.divIcon({
    className: '',
    html: `<div class="pin ${selected ? 'pin-on' : ''}">${count}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

function FlyTo({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) map.flyTo([location.lat, location.lng], 18, { duration: 0.6 });
  }, [location, map]);
  return null;
}

export default function MapView({ counts, selected, onSelect }) {
  const sel = LOCATIONS.find((l) => l.id === selected);

  return (
    <MapContainer
      center={CAMPUS_CENTER}
      zoom={CAMPUS_ZOOM}
      scrollWheelZoom
      className="map"
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Street">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <FlyTo location={sel} />

      {LOCATIONS.map((l) => (
        <Marker
          key={l.id}
          position={[l.lat, l.lng]}
          icon={pinIcon(counts[l.id] || 0, selected === l.id)}
          title={l.name}
          alt={`${l.name}, ${counts[l.id] || 0} photos`}
          eventHandlers={{ click: () => onSelect(l.id) }}
          keyboard
        />
      ))}
    </MapContainer>
  );
}
