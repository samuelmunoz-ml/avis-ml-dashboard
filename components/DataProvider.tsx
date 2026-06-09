'use client';
import { useState, useEffect, ReactNode } from 'react';
import { DataContext, loadData, saveData } from '@/lib/store';
import { DataStore } from '@/lib/types';
import { defaultData } from '@/lib/defaultData';

export default function DataProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<DataStore>(defaultData);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDataState(loadData());
    setMounted(true);
  }, []);

  function setData(d: DataStore) {
    setDataState(d);
    saveData(d);
  }

  if (!mounted) return null;

  return (
    <DataContext.Provider value={{ data, setData }}>
      {children}
    </DataContext.Provider>
  );
}
