"use client";

import React from 'react';

// This component can be used to wrap contexts (e.g., ThemeProvider, QueryClientProvider)
// For now, it's a simple pass-through.
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
