import React, { createContext, useState, useEffect, useContext } from 'react';
import { getActiveAlert } from '../services/alertService';

export const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const [activeAlert, setActiveAlert] = useState(null);
  const [isLoadingAlert, setIsLoadingAlert] = useState(true);

  useEffect(() => {
    getActiveAlert()
      .then(setActiveAlert)
      .catch(() => setActiveAlert(null))
      .finally(() => setIsLoadingAlert(false));
  }, []);

  const refreshAlert = async () => {
    const alert = await getActiveAlert();
    setActiveAlert(alert);
    return alert;
  };

  return (
    <AlertContext.Provider value={{ activeAlert, setActiveAlert, refreshAlert, isLoadingAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
