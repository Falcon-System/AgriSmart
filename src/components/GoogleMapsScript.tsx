'use client';

import { useEffect } from 'react';

interface GoogleMapsScriptProps {
  children: React.ReactNode;
}

const GoogleMapsScript: React.FC<GoogleMapsScriptProps> = ({ children }) => {
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      // Check if script is already loaded
      if (typeof window !== 'undefined' && window.google && window.google.maps) {
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
      };
      script.onerror = () => {
        console.error('Error loading Google Maps API');
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  return <>{children}</>;
};

export default GoogleMapsScript;