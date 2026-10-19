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
