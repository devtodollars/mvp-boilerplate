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
  const selectedPropertyRef = useRef<Property | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstance.current) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
    
    // Always start with Ireland center for stable map creation
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/golet/cmd7nb2nn00mz01sd0h1eg9he",
      center: [-7.5, 53.5], // Ireland center
      zoom: 6,
      attributionControl: false,
    });
    mapInstance.current = map;

    map.on("click", async (e) => {
      // Only handle if not clicking on a marker
      if (!selectedPropertyRef.current) return;
      // Check if click is on a marker
      const features = map.queryRenderedFeatures(e.point, { layers: [] });
      if (features.length > 0) return;
      
      // Get the current selected property for route calculation
      const currentSelectedProperty = selectedPropertyRef.current;
      if (!currentSelectedProperty) return;
      
      // Fetch route from selectedProperty to clicked location
      const from = `${currentSelectedProperty.lng},${currentSelectedProperty.lat}`;
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
        
        // Calculate bounds to fit both the selected property and the destination
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([currentSelectedProperty.lng, currentSelectedProperty.lat]); // Start point (selected property)
        bounds.extend([e.lngLat.lng, e.lngLat.lat]); // End point (clicked location)
        
        // Fit the map to show the entire route with some padding
        map.fitBounds(bounds, {
          padding: 50, // Add padding around the bounds for better visibility
          duration: 1500, // Smooth animation
          maxZoom: 14 // Don't zoom in too much, keep route visible
        });
        
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
  }, [properties]); // Removed selectedProperty from dependencies

  // Update selected property ref whenever it changes
  useEffect(() => {
    selectedPropertyRef.current = selectedProperty;
  }, [selectedProperty]);

  // Handle map positioning (initial load and property selection)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Calculate where to center based on available data
    let targetCenter: [number, number];
    let targetZoom: number;
    
    if (selectedProperty) {
      // If there's a selected property, center on it
      targetCenter = [selectedProperty.lng, selectedProperty.lat];
      targetZoom = 12;
    } else if (properties.length > 0) {
      // If there are properties but none selected, center on the first one
      targetCenter = [properties[0].lng, properties[0].lat];
      targetZoom = 12;
    } else {
      // No properties, stay at Ireland center
      return;
    }

    // Only animate if this isn't the initial load (to avoid double animation)
    if (hasInitializedRef.current) {
      map.easeTo({
        center: targetCenter,
        zoom: targetZoom,
        duration: 1500
      });
    } else {
      // Initial load - set position immediately
      map.setCenter(targetCenter);
      map.setZoom(targetZoom);
      hasInitializedRef.current = true;
    }
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
          background: #000000;
          border: 2px solid #000000;
          color: #ffffff;
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