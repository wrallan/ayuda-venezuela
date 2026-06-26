"use client";

import * as React from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { TIPO_PUNTO_CONFIG, type PuntoAyuda, type TipoPunto } from "@/types";

const VENEZUELA_CENTER = { longitude: -66.5, latitude: 7.5 };
const MAP_STYLE = "https://demotiles.maplibre.org/style.json";

interface MapaSeleccionProps {
  puntos: PuntoAyuda[];
  seleccion: { lat: number; lng: number } | null;
  tipoSeleccionado: TipoPunto;
  onSelect: (coords: { lat: number; lng: number }) => void;
}

/**
 * Mini-mapa interno usado en el panel de admin: basta con hacer clic en
 * un punto del mapa para fijar las coordenadas exactas, tal como se pidió
 * ("vasta con seleccionar un punto y darle a un botón crear punto").
 */
export function MapaSeleccion({ puntos, seleccion, tipoSeleccionado, onSelect }: MapaSeleccionProps) {
  return (
    <Map
      initialViewState={{ ...VENEZUELA_CENTER, zoom: 5.4 }}
      minZoom={4.5}
      maxZoom={17}
      mapStyle={MAP_STYLE}
      cursor="crosshair"
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
      onClick={(evt) => onSelect({ lat: evt.lngLat.lat, lng: evt.lngLat.lng })}
    >
      <NavigationControl position="top-right" />

      {puntos.map((p) => (
        <Marker key={p.id} longitude={p.lng} latitude={p.lat} anchor="center">
          <span
            className="block h-2.5 w-2.5 rounded-full border border-white opacity-70"
            style={{ backgroundColor: TIPO_PUNTO_CONFIG[p.tipo].color }}
          />
        </Marker>
      ))}

      {seleccion && (
        <Marker longitude={seleccion.lng} latitude={seleccion.lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <div
              className="h-5 w-5 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: TIPO_PUNTO_CONFIG[tipoSeleccionado].color }}
            />
            <div
              className="h-3.5 w-0.5"
              style={{ backgroundColor: TIPO_PUNTO_CONFIG[tipoSeleccionado].color }}
            />
          </div>
        </Marker>
      )}
    </Map>
  );
}
