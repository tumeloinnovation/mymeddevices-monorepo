"use client";

import React from "react";

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
}

interface AdminMapProps {
  markers: MapMarker[];
  routeCoordinates?: [number, number][];
  height?: string;
}

export default function AdminMap({ markers, routeCoordinates, height = "400px" }: AdminMapProps) {
  if (markers.length === 0) {
    return (
      <div className="flex items-center justify-center bg-muted text-muted-foreground" style={{ height }}>
        No locations to display
      </div>
    );
  }

  const routeString = routeCoordinates ? JSON.stringify(routeCoordinates) : "null";
  const markersString = JSON.stringify(markers);

  const srcDoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
      <style>
        html, body, #map {
          height: 100%;
          margin: 0;
          padding: 0;
          background: #f8fafc;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const markers = ${markersString};
        const routeCoords = ${routeString};

        // Center on the first marker
        const map = L.map('map').setView([markers[0].lat, markers[0].lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const leafletMarkers = [];

        markers.forEach((m, idx) => {
          let color = '#3b82f6'; // default blue
          if (idx === 0) color = '#ef4444'; // red for first
          if (idx === markers.length - 1 && markers.length > 1) color = '#10b981'; // green for destination

          // Custom colored divIcon
          const icon = L.divIcon({
            className: 'custom-div-icon',
            html: \`<div style="background-color: \${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>\`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          });

          const marker = L.marker([m.lat, m.lng], { icon }).addTo(map).bindPopup(\`<b>\${m.label}</b>\`);
          leafletMarkers.push(marker);
        });

        if (routeCoords && routeCoords.length > 0) {
          // Render full route polyline
          const polyline = L.polyline(routeCoords, {
            color: '#10b981',
            weight: 5,
            opacity: 0.7,
            dashArray: '8, 8'
          }).addTo(map);
          
          map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
        } else if (leafletMarkers.length > 1) {
          const group = new L.featureGroup(leafletMarkers);
          map.fitBounds(group.getBounds(), { padding: [40, 40] });
        } else if (leafletMarkers.length === 1) {
          map.setView([markers[0].lat, markers[0].lng], 15);
        }
      </script>
    </body>
    </html>
  `;

  return (
    <div className="w-full border rounded-lg overflow-hidden relative bg-muted" style={{ height }}>
      <iframe
        title="Delivery Route Map"
        srcDoc={srcDoc}
        className="w-full h-full border-0"
        sandbox="allow-scripts"
      />
    </div>
  );
}
