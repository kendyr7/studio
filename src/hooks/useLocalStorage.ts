import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  useEffect(() => {
    // This effect ensures that the state is updated on the client-side
    // if the initial value from localStorage differs from the SSR initialValue.
    // This can happen if localStorage was populated on a previous visit.
    if (typeof window !== 'undefined') {
        try {
            const item = window.localStorage.getItem(key);
            const localValue = item ? JSON.parse(item) : initialValue;
            // Check if stringified versions are different to avoid infinite loops with object comparisons
            if (JSON.stringify(storedValue) !== JSON.stringify(localValue)) {
                 setStoredValue(localValue);
            }
        } catch (error) {
            console.error(`Error synchronizing localStorage key "${key}":`, error);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initialValue]);


  return [storedValue, setValue];
}

export default useLocalStorage;
