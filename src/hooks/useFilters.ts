import { useState, useCallback, useMemo } from 'react';

interface FilterState {
  [key: string]: string[];
}

export function useFilters<T>(
  items: T[],
  filterConfig: {
    [key: string]: (item: T, values: string[]) => boolean;
  }
) {
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({});
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const toggleFilter = useCallback((group: string, value: string) => {
    setSelectedFilters(prev => {
      const groupFilters = prev[group] || [];
      const newGroupFilters = groupFilters.includes(value)
        ? groupFilters.filter(v => v !== value)
        : [...groupFilters, value];

      return {
        ...prev,
        [group]: newGroupFilters
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedFilters({});
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      return Object.entries(selectedFilters).every(([group, values]) => {
        if (values.length === 0) return true;
        return filterConfig[group](item, values);
      });
    });
  }, [items, selectedFilters, filterConfig]);

  const toggleFilterMenu = useCallback(() => {
    setIsFilterMenuOpen(prev => !prev);
  }, []);

  return {
    selectedFilters,
    filteredItems,
    toggleFilter,
    clearFilters,
    isFilterMenuOpen,
    toggleFilterMenu
  };
}