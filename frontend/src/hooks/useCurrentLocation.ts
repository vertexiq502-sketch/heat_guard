import { useCallback, useEffect } from 'react';
import { useLocationStore, type LocationCoords, type PermissionStatus } from '../store/locationStore';

export type { LocationCoords, PermissionStatus };

export const useCurrentLocation = () => {
  const {
    location,
    loading,
    error,
    permissionStatus,
    setLocation,
    setLoading,
    setError,
    setPermissionStatus,
  } = useLocationStore();

  const isSupported = typeof window !== 'undefined' && 'geolocation' in navigator;

  // Check initial permission status if available
  useEffect(() => {
    if (typeof window !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          if (result.state === 'granted') setPermissionStatus('granted');
          else if (result.state === 'denied') setPermissionStatus('denied');
          else setPermissionStatus('prompt');

          result.onchange = () => {
            if (result.state === 'granted') setPermissionStatus('granted');
            else if (result.state === 'denied') setPermissionStatus('denied');
            else setPermissionStatus('prompt');
          };
        })
        .catch(() => {});
    }
  }, [setPermissionStatus]);

  const requestLocation = useCallback(async (): Promise<LocationCoords | null> => {
    if (!isSupported) {
      setError('Geolocation is not supported by your browser.');
      setPermissionStatus('unavailable');
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: LocationCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(coords);
          setPermissionStatus('granted');
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          setLoading(false);
          let msg = 'Failed to acquire current location.';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Location permission was denied. Please allow location access in your browser.';
            setPermissionStatus('denied');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'Location information is unavailable.';
            setPermissionStatus('unavailable');
          } else if (err.code === err.TIMEOUT) {
            msg = 'Location request timed out. Please try again.';
          }
          setError(msg);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        }
      );
    });
  }, [isSupported, setLocation, setLoading, setError, setPermissionStatus]);

  // Proactively auto-request if not present or permission already granted
  useEffect(() => {
    if (isSupported && !location && permissionStatus !== 'denied') {
      requestLocation();
    }
  }, [isSupported, location, permissionStatus, requestLocation]);

  return {
    location,
    loading,
    error,
    permissionStatus,
    isSupported,
    requestLocation,
  };
};
