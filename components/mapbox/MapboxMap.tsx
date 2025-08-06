/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-ignore
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";

interface Property {
  id: string;
  lat: number;
  lng: number;
  monthly_rent: number;
}

interface MapboxMapProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelect: (property: Property) => void;
  onMapClick?: (lng: number, lat: number) => void;
}

export default function MapboxMap({ properties, selectedProperty, onSelect, onMapClick }: MapboxMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const routeLayerId = useRef<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstance.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/golet/cmd7nb2nn00mz01sd0h1eg9he", // Replace with your actual GoLet style URL
      center: properties[0] ? [properties[0].lng, properties[0].lat] : [-6.2603, 53.3498], // Dublin, Ireland coordinates
      zoom: properties[0] ? 12 : 10, // Zoom out more for Dublin overview when no properties
      attributionControl: false,
    });
    mapInstance.current = map;

    map.on("click", async (e) => {
      // Only handle if not clicking on a marker
      if (!selectedProperty) return;
      // Check if click is on a marker
      const features = map.queryRenderedFeatures(e.point, { layers: [] });
      if (features.length > 0) return;
      // Fetch route from selectedProperty to clicked location
      const from = `${selectedProperty.lng},${selectedProperty.lat}`;
      const to = `${e.lngLat.lng},${e.lngLat.lat}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from};${to}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        // Remove previous route
        if (routeLayerId.current && map.getLayer(routeLayerId.current)) {
          map.removeLayer(routeLayerId.current);
        }
        if (routeLayerId.current && map.getSource(routeLayerId.current)) {
          map.removeSource(routeLayerId.current);
        }
        // Add new route
        const id = `route-${Date.now()}`;
        map.addSource(id, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: route.geometry,
            properties: {},
          },
        });
        map.addLayer({
          id,
          type: "line",
          source: id,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#6366f1",
            "line-width": 5,
            "line-opacity": 0.8,
          },
        });
        routeLayerId.current = id;
        setRouteInfo({ distance: route.distance, duration: route.duration });
        // Center on selected property without animation
        map.setCenter([selectedProperty.lng, selectedProperty.lat]);
        // Add or move the flag marker at the destination
        if (destinationMarkerRef.current) {
          destinationMarkerRef.current.remove();
        }
        const flagEl = document.createElement("div");
        flagEl.innerHTML = "🏁";
        flagEl.style.fontSize = "2rem";
        flagEl.style.transform = "translate(-50%, -100%)";
        flagEl.style.pointerEvents = "none";
        destinationMarkerRef.current = new mapboxgl.Marker({ element: flagEl })
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .addTo(map);
      }
    });

    return () => {
      map.remove();
      mapInstance.current = null;
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.remove();
        destinationMarkerRef.current = null;
      }
    };
  }, [properties, selectedProperty]);

  // Add/Update markers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    // Ensure styles are injected before creating markers
    if (typeof window !== "undefined") {
      const style = document.createElement("style");
      style.innerHTML = `
        .mapbox-marker {
          background: white;
          border: 2px solid #000000;
          border-radius: 9999px;
          padding: 4px 10px;
          font-weight: bold;
          color: #000000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: border 0.2s, color 0.2s;
          font-size: 15px;
          user-select: none;
        }
        .mapbox-marker.selected {
          border: 2px solid #000000;
          color: #000000;
          z-index: 10;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
      `;
      if (!document.head.querySelector('style[data-mapbox-marker]')) {
        style.setAttribute('data-mapbox-marker', '');
        document.head.appendChild(style);
      }
    }
    properties.forEach((property) => {
      const el = document.createElement("div");
      el.className = `mapbox-marker${selectedProperty && selectedProperty.id === property.id ? " selected" : ""}`;
      el.innerText = `€${property.monthly_rent}`;
      // @ts-ignore
      el.onclick = (e) => {
        e.stopPropagation();
        onSelect(property);
      };
      const marker = new mapboxgl.Marker(el)
        .setLngLat([property.lng, property.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [properties, selectedProperty, onSelect]);

  // Center on selected property
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !selectedProperty) return;
    map.setCenter([selectedProperty.lng, selectedProperty.lat]);
  }, [selectedProperty]);

  return (
    <div className="w-full h-full rounded-lg relative" style={{ minHeight: 400 }}>
      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: 400 }} />
      {routeInfo && (
        <div className="absolute lg:top-4 sm:bottom-auto bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded shadow text-sm z-20 flex gap-4">
          <span>Distance: {(routeInfo.distance / 1000).toFixed(2)} km</span>
          <span>Time: {Math.round(routeInfo.duration / 60)} min 🚗</span>
        </div>
      )}
    </div>
  );
} 