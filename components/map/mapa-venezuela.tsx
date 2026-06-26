"use client";

import * as React from "react";
import Map, { Marker, NavigationControl, ScaleControl, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { TIPO_PUNTO_CONFIG, type PuntoAyuda, type TipoPunto } from "@/types";

// Centro aproximado de Venezuela continental.
const VENEZUELA_CENTER = { longitude: -66.5, latitude: 7.5 };
const VENEZUELA_DEFAULT_ZOOM = 5.4;

// Estilo de mapa vectorial gratuito y sin necesidad de API key (demotiles
// de MapLibre); detallado y claro para distinguir estados/zonas.
const MAP_STYLE = "https://demotiles.maplibre.org/style.json";

interface MapaVenezuelaProps {
  puntos: PuntoAyuda[];
  onMarkerClick?: (punto: PuntoAyuda) => void;
  modoCreacion?: boolean;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  puntoTemporal?: { lat: number; lng: number; tipo: TipoPunto } | null;
  className?: string;
}

// Escala logarítmica para el radio del marcador según ayuda_qty, evitando
// que cantidades grandes generen círculos desproporcionados o que se
// superpongan unos con otros en zonas densas.
function radioPorCantidad(qty: number): number {
  const base = 9;
  if (qty <= 0) return base;
  return Math.min(base + Math.log2(qty + 1) * 3.2, 26);
}

export function MapaVenezuela({
  puntos,
  onMarkerClick,
  modoCreacion = false,
  onMapClick,
  puntoTemporal,
  className,
}: MapaVenezuelaProps) {
  const mapRef = React.useRef<MapRef | null>(null);

  const handleClick = React.useCallback(
    (evt: { lngLat: { lat: number; lng: number } }) => {
      if (!modoCreacion || !onMapClick) return;
      onMapClick({ lat: evt.lngLat.lat, lng: evt.lngLat.lng });
    },
    [modoCreacion, onMapClick]
  );

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: VENEZUELA_CENTER.longitude,
        latitude: VENEZUELA_CENTER.latitude,
        zoom: VENEZUELA_DEFAULT_ZOOM,
      }}
      minZoom={4.5}
      maxZoom={17}
      mapStyle={MAP_STYLE}
      onClick={handleClick}
      cursor={modoCreacion ? "crosshair" : "grab"}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />
      <ScaleControl position="bottom-left" unit="metric" />

      {puntos.map((punto) => {
        const config = TIPO_PUNTO_CONFIG[punto.tipo];
        const radio = radioPorCantidad(punto.ayuda_qty);
        return (
          <Marker
            key={punto.id}
            longitude={punto.lng}
            latitude={punto.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onMarkerClick?.(punto);
            }}
          >
            <button
              type="button"
              aria-label={`${config.label}: ${punto.titulo}`}
              className="group relative flex items-center justify-center"
              style={{ width: radio * 2, height: radio * 2 }}
            >
              {punto.estado_severidad === "critico" && (
                <span
                  className="absolute inset-0 rounded-full animate-pulse-ring"
                  style={{ backgroundColor: config.color }}
                />
              )}
              <span
                className="relative flex items-center justify-center rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-110"
                style={{
                  width: radio * 2,
                  height: radio * 2,
                  backgroundColor: config.color,
                }}
              />
            </button>
          </Marker>
        );
      })}

      {puntoTemporal && (
        <Marker longitude={puntoTemporal.lng} latitude={puntoTemporal.lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <div
              className="h-4 w-4 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: TIPO_PUNTO_CONFIG[puntoTemporal.tipo].color }}
            />
            <div
              className="h-3 w-0.5"
              style={{ backgroundColor: TIPO_PUNTO_CONFIG[puntoTemporal.tipo].color }}
            />
          </div>
        </Marker>
      )}
    </Map>
  );
}
