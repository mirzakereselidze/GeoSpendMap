'use client'; // This is needed for Next.js app router

import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

// Set your Mapbox token from environment variable
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Project type definition
interface Project {
  id: number;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  budget_allocated: number;
  budget_spent: number;
  start_date: string;
  expected_completion_date: string;
  status: 'On Track' | 'Warning' | 'Over Budget/Delayed';
  funding_source: 'Local' | 'EU' | 'US' | 'Mixed';
}

interface MapProps {
  projects?: Project[];
  isPitched?: boolean; // For isometric 3D-like view
  theme?: 'light' | 'dark'; // For different map styles
}

const Map = ({ projects = [], isPitched = false, theme = 'light' }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Function to get color based on project status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'On Track':
        return '#2ECC71'; // Green
      case 'Warning':
        return '#F1C40F'; // Yellow
      case 'Over Budget/Delayed':
        return '#E74C3C'; // Red
      default:
        return '#95A5A6'; // Grey for unknown
    }
  };

  // Initialize map when component mounts
  useEffect(() => {
    if (map.current) return; // Initialize map only once
    if (!mapContainer.current) return; // Safety check

    // Choose map style based on theme
    const mapStyle = theme === 'dark' 
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [44.7833, 41.7167], // Tbilisi center coordinates [lng, lat]
      zoom: 12,
      pitch: isPitched ? 60 : 0, // Isometric view if requested
      bearing: isPitched ? 30 : 0, // Slight rotation for isometric effect
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // If requested isPitched (3D view), also add 3D buildings
      if (isPitched && map.current) {
        // Add 3D building layer
        const layers = map.current.getStyle().layers;
        
        // Find the first symbol layer in the map style
        let firstSymbolId: string | undefined;
        for (const layer of layers || []) {
          if (layer.type === 'symbol') {
            firstSymbolId = layer.id;
            break;
          }
        }
        
        // Add the 3D buildings before the first symbol layer if it exists
        if (firstSymbolId) {
          map.current.addLayer(
            {
              'id': '3d-buildings',
              'source': 'composite',
              'source-layer': 'building',
              'filter': ['==', 'extrude', 'true'],
              'type': 'fill-extrusion',
              'minzoom': 15,
              'paint': {
                'fill-extrusion-color': theme === 'dark' ? '#444' : '#d6d6d6',
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'min_height'],
                'fill-extrusion-opacity': 0.7
              }
            },
            firstSymbolId
          );
        }
      }
    });

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isPitched, theme]);

  // Update map with projects data when available
  useEffect(() => {
    if (!mapLoaded || !map.current || !projects || projects.length === 0) return;

    // Prepare GeoJSON data
    const geojsonData = {
      type: 'FeatureCollection',
      features: projects.map(p => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.longitude, p.latitude]
        },
        properties: {
          id: p.id,
          name: p.name,
          description: p.description || '',
          status: p.status,
          budgetAllocated: p.budget_allocated,
          budgetSpent: p.budget_spent,
          startDate: p.start_date,
          completionDate: p.expected_completion_date,
          fundingSource: p.funding_source,
        }
      }))
    };

    // Add or update the source
    const sourceId = 'projects-source';
    if (map.current.getSource(sourceId)) {
      // @ts-ignore - TypeScript doesn't know about this method
      map.current.getSource(sourceId).setData(geojsonData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData,
      });

      // Add circle layer for the projects
      map.current.addLayer({
        id: 'projects-circle',
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 10,
          'circle-color': [
            'match',
            ['get', 'status'],
            'On Track', getStatusColor('On Track'),
            'Warning', getStatusColor('Warning'),
            'Over Budget/Delayed', getStatusColor('Over Budget/Delayed'),
            getStatusColor('Unknown')
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': theme === 'dark' ? '#fff' : '#000',
          'circle-opacity': 0.8
        }
      });

      // Add event handlers
      map.current.on('click', 'projects-circle', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        const props = feature.properties;
        const coordinates = feature.geometry.coordinates.slice() as [number, number];
        
        // Format the currency numbers with commas
        const formatCurrency = (amount: number) => 
          amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        
        // Calculate budget percent spent
        const budgetSpent = props.budgetSpent;
        const budgetAllocated = props.budgetAllocated;
        const percentSpent = ((budgetSpent / budgetAllocated) * 100).toFixed(1);
        
        // Create popup HTML
        const popupHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 300px;">
            <h3 style="margin: 0 0 10px; color: #333;">${props.name}</h3>
            ${props.description ? `<p style="margin: 0 0 10px;">${props.description}</p>` : ''}
            <div style="margin-bottom: 5px;">
              <strong>Status:</strong> 
              <span style="color: ${getStatusColor(props.status)}; font-weight: bold;">
                ${props.status}
              </span>
            </div>
            <div style="margin-bottom: 5px;">
              <strong>Budget:</strong> ₾${formatCurrency(budgetSpent)} / ₾${formatCurrency(budgetAllocated)} 
              (${percentSpent}%)
            </div>
            <div style="margin-bottom: 5px;">
              <strong>Timeline:</strong> ${new Date(props.startDate).toLocaleDateString()} - 
              ${new Date(props.completionDate).toLocaleDateString()}
            </div>
            <div style="margin-bottom: 5px;">
              <strong>Funding Source:</strong> ${props.fundingSource}
            </div>
          </div>
        `;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupHTML)
          .addTo(map.current!);
      });

      // Change cursor to pointer when hovering over projects
      map.current.on('mouseenter', 'projects-circle', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'projects-circle', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });
    }
  }, [projects, mapLoaded, theme]);

  return (
    <div 
      ref={mapContainer} 
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
};

export default Map;