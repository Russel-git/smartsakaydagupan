import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";

const LocationContext = createContext(null);

const normalize = (s) =>
  s === "granted" ? "granted" : s === "denied" ? "denied" : "undetermined";

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState("unknown");
  const pendingRef = useRef(null);
  const webPermRef = useRef(null);

  const readPermission = useCallback(async () => {
    if (Platform.OS === "web") {
      if (typeof navigator === "undefined" || !navigator.permissions?.query) {
        return "undetermined";
      }
      try {
        const p = await navigator.permissions.query({ name: "geolocation" });
        if (webPermRef.current) webPermRef.current.onchange = null;
        webPermRef.current = p;
        p.onchange = () => setLocationPermission(normalize(p.state));
        return normalize(p.state);
      } catch (_) {
        return "undetermined";
      }
    }
    const { status } = await Location.getForegroundPermissionsAsync();
    return normalize(status);
  }, []);

  const ensureLocationPermission = useCallback(() => {
    if (pendingRef.current) return pendingRef.current;

    const p = (async () => {
      let state = await readPermission();

      if (state === "undetermined") {
        if (Platform.OS === "web") {
          state = await new Promise((resolve) => {
            if (typeof navigator === "undefined" || !navigator.geolocation) {
              resolve("denied");
              return;
            }
            navigator.geolocation.getCurrentPosition(
              () => resolve("granted"),
              (err) => resolve(err.code === 1 ? "denied" : "granted"),
              { timeout: 10000, maximumAge: 60000 },
            );
          });
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          state = normalize(status);
        }
      }

      setLocationPermission(state);
      return state;
    })().finally(() => {
      pendingRef.current = null;
    });

    pendingRef.current = p;
    return p;
  }, [readPermission]);

  useEffect(() => {
    if (Platform.OS === "web") {
      readPermission().then(setLocationPermission);
    } else {
      ensureLocationPermission();
    }
    return () => {
      if (webPermRef.current) webPermRef.current.onchange = null;
    };
  }, []);

  // Continuous position tracking across entire mobile app once permission is granted
  useEffect(() => {
    if (locationPermission !== 'granted') return;
    let isMounted = true;
    let webWatchId = null;
    let nativeSub = null;

    const onFix = (c, fallbackAcc = 20) => {
      if (!isMounted) return;
      const acc = Math.round(c.accuracy || fallbackAcc);
      setLocation({
        lat: c.latitude,
        lng: c.longitude,
        accuracy: acc,
        isReal: true,
      });
    };

    (async () => {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          webWatchId = navigator.geolocation.watchPosition(
            (pos) => onFix(pos.coords),
            (err) => console.warn('Web GPS watch:', err.message),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
          );
        }
        return;
      }
      try {
        nativeSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 4,
          },
          (loc) => onFix(loc.coords, 15)
        );
      } catch (e) {
        console.warn('Native GPS watch err:', e);
      }
    })();

    return () => {
      isMounted = false;
      if (webWatchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(webWatchId);
      }
      if (nativeSub) nativeSub.remove();
    };
  }, [locationPermission]);

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        locationPermission,
        ensureLocationPermission,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useSharedLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useSharedLocation must be used inside LocationProvider");
  }
  return context;
};
