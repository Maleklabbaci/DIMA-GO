import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LatLng } from '../utils/pricing';

interface DispatchMapProps {
  origin: LatLng;
  destination?: LatLng;
  exactGpsDestination?: LatLng;
  routePolyline?: [number, number][];
  onMapClick?: (latLng: LatLng) => void;
  heightClass?: string;
  zoom?: number;
}

export const DispatchMap: React.FC<DispatchMapProps> = ({
  origin,
  destination,
  exactGpsDestination,
  routePolyline,
  onMapClick,
  heightClass = 'h-[340px]',
  zoom = 13,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [origin.lat, origin.lng],
      zoom,
      zoomControl: false,
      attributionControl: true,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at bottom right
    L.control
      .zoom({
        position: 'bottomright',
      })
      .addTo(map);

    // Layer group for markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Map click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick({ lat: Number(e.latlng.lat.toFixed(5)), lng: Number(e.latlng.lng.toFixed(5)) });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // 1. Restaurant Origin Marker (Soft rounded badge)
    const restauIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `
        <div style="background:#FFFFFF; border:1px solid #E2DDD5; border-radius:20px; padding:4px 10px; color:#1C1917; font-size:11px; font-weight:700; white-space:nowrap; display:flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <span style="width:8px; height:8px; background:#10B981; border-radius:50%; display:inline-block;"></span>
          Restaurant
        </div>
      `,
      iconSize: [88, 26],
      iconAnchor: [44, 13],
    });

    L.marker([origin.lat, origin.lng], { icon: restauIcon }).addTo(markersLayer);

    // 2. Destination Marker (Warm pill badge)
    const targetDest = exactGpsDestination || destination;
    if (targetDest) {
      const isExact = !!exactGpsDestination;
      const destIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="background:${isExact ? '#10B981' : '#F59E0B'}; border-radius:20px; padding:4px 10px; color:#FFFFFF; font-size:11px; font-weight:700; white-space:nowrap; display:flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(245,158,11,0.3);">
            <span style="width:7px; height:7px; background:#FFFFFF; border-radius:50%; display:inline-block;"></span>
            ${isExact ? 'GPS Client ✓' : 'Client'}
          </div>
        `,
        iconSize: [86, 26],
        iconAnchor: [43, 13],
      });

      L.marker([targetDest.lat, targetDest.lng], { icon: destIcon }).addTo(markersLayer);
    }

    // 3. Polyline route (Warm orange/terracotta road line)
    if (polylineLayerRef.current) {
      polylineLayerRef.current.remove();
      polylineLayerRef.current = null;
    }

    if (routePolyline && routePolyline.length > 1) {
      const polyline = L.polyline(routePolyline, {
        color: '#EA580C',
        weight: 4.5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      polylineLayerRef.current = polyline;

      try {
        const bounds = polyline.getBounds();
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } catch {
        // ignore bounds errors
      }
    } else if (targetDest) {
      try {
        const bounds = L.latLngBounds([
          [origin.lat, origin.lng],
          [targetDest.lat, targetDest.lng],
        ]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch {
        // ignore
      }
    }
  }, [origin, destination, exactGpsDestination, routePolyline]);

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl border border-[#E8E4DC] bg-[#FAF8F5] overflow-hidden shadow-xs`}>
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-xs border border-[#E8E4DC] px-3 py-1.5 rounded-full text-[11px] font-medium text-[#78716C] shadow-xs pointer-events-none flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
        Itinéraire routier en direct
      </div>
    </div>
  );
};
