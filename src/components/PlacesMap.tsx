import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoPoint } from '../lib/device';
import { PLACE_CATEGORY_INFO, RealPlace } from '../lib/places';

interface PlacesMapProps {
  origin: GeoPoint;
  places: RealPlace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const pinIcon = (color: string, selected: boolean) =>
  L.divIcon({
    className: '',
    html: `<div class="mbt-pin${selected ? ' mbt-pin--selected' : ''}" style="--pin:${color}">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });

const userIcon = L.divIcon({
  className: '',
  html: '<div class="mbt-user-dot"><span></span></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/** Carte OpenStreetMap (Leaflet) : position de l'utilisateur + lieux réels. */
export const PlacesMap: React.FC<PlacesMapProps> = ({ origin, places, selectedId, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Création de la carte (une seule fois)
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([origin.lat, origin.lon], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    userMarkerRef.current = L.marker([origin.lat, origin.lon], { icon: userIcon, keyboard: false, zIndexOffset: 1000 })
      .bindTooltip('Vous êtes ici')
      .addTo(map);
    mapRef.current = map;
    return () => {
      // Une animation de zoom en cours se termine ~250 ms plus tard : détruire la carte
      // immédiatement provoquerait l'erreur Leaflet « _leaflet_pos ». On attend sa fin.
      map.stop();
      map.off();
      window.setTimeout(() => map.remove(), 400);
      mapRef.current = null;
      layerRef.current = null;
      userMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Déplacement du point de départ (nouvelle position / ville cherchée)
  useEffect(() => {
    userMarkerRef.current?.setLatLng([origin.lat, origin.lon]);
    mapRef.current?.setView([origin.lat, origin.lon], 15);
  }, [origin.lat, origin.lon]);

  // Marqueurs des lieux
  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    for (const place of places) {
      L.marker([place.lat, place.lon], {
        icon: pinIcon(PLACE_CATEGORY_INFO[place.category].color, place.id === selectedId),
        title: place.name,
        zIndexOffset: place.id === selectedId ? 900 : 0,
      })
        .on('click', () => onSelectRef.current(place.id))
        .addTo(layer);
    }
  }, [places, selectedId]);

  // Cadre la carte pour montrer la position et les lieux les plus proches
  useEffect(() => {
    const map = mapRef.current;
    if (!map || places.length === 0) return;
    const nearest = places.slice(0, 5).map((p) => L.latLng(p.lat, p.lon));
    map.fitBounds(L.latLngBounds([L.latLng(origin.lat, origin.lon), ...nearest]), {
      padding: [36, 36],
      maxZoom: 16,
    });
    // On ne recadre que quand la liste change (filtre / nouvelle recherche)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places]);

  // Centre sur le lieu sélectionné
  useEffect(() => {
    const place = places.find((p) => p.id === selectedId);
    if (place && mapRef.current) {
      mapRef.current.panTo([place.lat, place.lon], { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return <div ref={containerRef} className="absolute inset-0" role="application" aria-label="Carte des lieux sûrs" />;
};
