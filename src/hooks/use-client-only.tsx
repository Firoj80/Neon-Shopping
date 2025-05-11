
"use client";

import { useState, useEffect } from 'react';

/**
 * A hook to determine if the component has mounted on the client side.
 * Helps prevent hydration errors by delaying rendering of client-only components.
 *
 * @returns {boolean} `true` if the component is mounted on the client, `false` otherwise.
 */
export function useClientOnly(): boolean {
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  return isClientMounted;
}
