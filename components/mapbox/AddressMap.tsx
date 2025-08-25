/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-ignore
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, memo } from "react";

interface AddressMapProps {
    center?: { lat: number; lng: number };
    onMapClick?: (lng: number, lat: number) => void;
    height?: string;
    showMarker?: boolean;
    markerPosition?: { lat: number; lng: number };
    satelliteMode?: boolean;
}

function AddressMap({
    center = { lat: 53.5, lng: -7.5 }, // Ireland center default
    onMapClick,
    height = "400px",
    showMarker = false,
    markerPosition,
    satelliteMode = false
}: AddressMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const initialCenterRef = useRef(center);

    useEffect(() => {
        if (!mapRef.current) return;
        if (mapInstance.current) return;

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
        
        // Choose map style based on satellite mode
        const mapStyle = satelliteMode 
            ? "mapbox://styles/mapbox/satellite-streets-v12" // Hybrid satellite with labels
            : "mapbox://styles/golet/cmd7nb2nn00mz01sd0h1eg9he"; // Custom style
        
        const map = new mapboxgl.Map({
            container: mapRef.current,
            style: mapStyle,
            center: [-7.5, 53.5], // Ireland center for stable creation
            zoom: 6,
            attributionControl: false,
        });
        mapInstance.current = map;

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Handle map clicks
        if (onMapClick) {
            map.on("click", (e) => {
                const { lng, lat } = e.lngLat;
                onMapClick(lng, lat);
            });
        }

        return () => {
            map.remove();
            mapInstance.current = null;
        };
    }, [satelliteMode]); // Re-run if satellite mode changes

    // Animate to correct center after map creation
    useEffect(() => {
        const map = mapInstance.current;
        if (!map) return;

        console.log('🔄 Updating map center to:', center);

        // Animate to the provided center
        map.easeTo({
            center: [center.lng, center.lat],
            zoom: 14, // Higher zoom for city/town level
            duration: 1500
        });
    }, [center]);

    // Handle marker updates
    useEffect(() => {
        const map = mapInstance.current;
        if (!map) return;

        // Remove existing marker
        if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }

        // Add new marker if needed
        if (showMarker && markerPosition) {
            const marker = new mapboxgl.Marker({ color: '#ef4444' })
                .setLngLat([markerPosition.lng, markerPosition.lat])
                .addTo(map);
            markerRef.current = marker;

            // Move to marker position smoothly
            map.easeTo({
                center: [markerPosition.lng, markerPosition.lat],
                zoom: 16, // Higher zoom for exact location
                duration: 1500
            });
        }
    }, [showMarker, markerPosition]);

    return (
        <div className="w-full rounded-lg relative" style={{ height }}>
            <div ref={mapRef} className="w-full h-full rounded-lg" />
            <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded text-xs text-gray-600 shadow">
                Click to drop a pin
            </div>
        </div>
    );
}

export default memo(AddressMap);
