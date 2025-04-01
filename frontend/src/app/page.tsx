
'use client';

import { useState, useEffect } from 'react';
import Map from '../components/Map';
import type { Project } from '../components/Map'; // <--- ADD THIS IMPORT (use correct path)
import styles from './page.module.css';

// Mock projects data - will be replaced with API call later
// ----- Define the mock data FIRST -----
const mockProjects: Project[] = [ // <--- ADD : Project[] HERE
  {
    id: 1,
    name: "Rustaveli Ave Road Repair",
    latitude: 41.6979,
    longitude: 44.7973,
    budget_allocated: 500000,
    budget_spent: 450000,
    start_date: "2023-01-15",
    expected_completion_date: "2024-06-30",
    status: "On Track", // Matches 'On Track'
    funding_source: "Local" // Matches 'Local'
  },
  {
    id: 2,
    name: "Vake Park Renovation",
    latitude: 41.7086,
    longitude: 44.7600,
    budget_allocated: 1200000,
    budget_spent: 1150000,
    start_date: "2022-09-01",
    expected_completion_date: "2024-03-31",
    status: "Warning", // Matches 'Warning'
    funding_source: "EU" // Matches 'EU'
  },
  {
    id: 3,
    name: "New Bridge Construction - Mtkvari",
    latitude: 41.7167,
    longitude: 44.7833,
    budget_allocated: 2500000,
    budget_spent: 2800000,
    start_date: "2023-03-01",
    expected_completion_date: "2024-09-30",
    status: "Over Budget/Delayed", // Matches 'Over Budget/Delayed'
    funding_source: "Mixed" // Matches 'Mixed'
  },
  {
    id: 4,
    name: "School Tech Upgrade Program",
    latitude: 41.7230,
    longitude: 44.7688,
    budget_allocated: 300000,
    budget_spent: 290000,
    start_date: "2023-05-10",
    expected_completion_date: "2024-05-09",
    status: "On Track", // Matches 'On Track'
    funding_source: "US" // Matches 'US'
  },
];

// ----- THEN use it in useState -----
// You can keep the type here too, it's good practice, but typing the constant above is key
const [projects, setProjects] = useState<Project[]>(mockProjects);

export default function Home() {
  const [projects, setProjects] = useState(mockProjects);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // For demo purposes we're using mock data, but in the final app
  // we would fetch from the backend API
  useEffect(() => {
    /* 
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:8000/api/v1/projects');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setProjects(data);
        setError(null);
      } catch (e) {
        console.error("Failed to fetch projects:", e);
        setError("Failed to load project data. Is the backend running?");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
    */
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.controls}>
        <h1>Georgia Transparency Dashboard</h1>
        
        <div className={styles.viewControls}>
          <button 
            className={viewMode === '2D' ? styles.active : ''}
            onClick={() => setViewMode('2D')}
          >
            2D View
          </button>
          <button 
            className={viewMode === '3D' ? styles.active : ''}
            onClick={() => setViewMode('3D')}
          >
            3D View
          </button>
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            Toggle Theme
          </button>
        </div>
        
        {isLoading && <div className={styles.status}>Loading projects...</div>}
        {error && <div className={styles.error}>{error}</div>}
      </div>
      
      <div className={styles.mapContainer}>
        <Map 
            projects={projects}
            isPitched={viewMode === '3D'}
            theme={theme}
/>
      </div>
    </main>
  );
}