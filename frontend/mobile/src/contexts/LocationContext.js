import React, { createContext, useContext, useState } from "react";

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
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
