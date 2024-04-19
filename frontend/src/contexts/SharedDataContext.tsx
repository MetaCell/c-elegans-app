import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the type for the context's value
interface SharedDataContextType {
  counter: number;
  updateCounter: () => void;
}

// Creating a Context with a default undefined value but specified types
const SharedDataContext = createContext<SharedDataContextType | undefined>(undefined);

// Provider component type
interface SharedDataProviderProps {
  children: ReactNode;
}

// Create a Provider Component
export const SharedDataProvider: React.FC<SharedDataProviderProps> = ({ children }) => {
  const [counter, setCounter] = useState<number>(0);

  // Function to update the context data
  const updateCounter = () => {
    setCounter(counter+1);
  };

  return (
    <SharedDataContext.Provider value={{ counter, updateCounter }}>
      {children}
    </SharedDataContext.Provider>
  );
};

// Custom hook to use the shared data context
export const useSharedData = () => {
  const context = useContext(SharedDataContext);
  if (context === undefined) {
    throw new Error('useSharedData must be used within a SharedDataProvider');
  }
  return context;
};
