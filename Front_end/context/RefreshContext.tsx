import React, { createContext, useContext, useState } from 'react';

interface RefreshContextType {
  shouldRefresh: boolean;
  triggerRefresh: () => void;
  resetRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextType | null>(null);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const triggerRefresh = () => setShouldRefresh(true);
  const resetRefresh = () => setShouldRefresh(false);

  return (
    <RefreshContext.Provider value={{ shouldRefresh, triggerRefresh, resetRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};