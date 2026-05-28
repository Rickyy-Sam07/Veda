'use client';

import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function WSInitializer() {
  const initWebSocket = useStore((state) => state.initWebSocket);

  useEffect(() => {
    initWebSocket();
  }, [initWebSocket]);

  return null;
}
