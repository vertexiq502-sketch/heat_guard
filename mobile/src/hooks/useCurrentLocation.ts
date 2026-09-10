import { useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
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

  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status === 'granted') setPermissionStatus('granted');
        else if (status === 'denied') setPermissionStatus('denied');
        else setPermissionStatus('prompt');
      })
      .catch(() => {});
  }, [setPermissionStatus]);

  const requestLocation = useCallback(async (): Promise<LocationCoords | null> => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setPermissionStatus('denied');
        setError('Location permission was denied. Please allow location in device settings.');
        setLoading(false);
        return null;
      }

      setPermissionStatus('granted');

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: LocationCoords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setLocation(coords);
      setLoading(false);
      return coords;
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Unable to determine current location.');
      return null;
    }
  }, [setLocation, setLoading, setError, setPermissionStatus]);

  // Proactively auto-request if not present or permission already granted
  useEffect(() => {
    if (!location && permissionStatus !== 'denied') {
      requestLocation();
    }
  }, [location, permissionStatus, requestLocation]);

  return {
    location,
    loading,
    error,
    permissionStatus,
    requestLocation,
  };
};
