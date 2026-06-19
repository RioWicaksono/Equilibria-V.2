'use client';

import { useEffect } from 'react';
import GlobalSearchTrigger from './GlobalSearchTrigger';
import { useState } from 'react';

export default function SearchWrapper() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <GlobalSearchTrigger />;
}
