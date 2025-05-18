import React from 'react';
import { FilterIcon } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterGroup {
  name: string;
  options: FilterOption[];
}

interface ResultsFilterProps {
  filters: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (group: string, value: string) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ResultsFilter({
  filters,
  selectedFilters,
  onFilterChange,
  onClearFilters,
  isOpen,
  onToggle
}: ResultsFilterProps) {
  const hasActiveFilters = Object.values(selectedFilters).some(group => group.length > 0);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center px-4 py-2 bg-theme-800 text-white rounded-lg hover:bg-theme-700 ${
          hasActiveFilters ? 'ring-2 ring-theme-300' : ''
        }`}
      >
        <FilterIcon className="h-4 w-4 mr-2" />
        Filters
        {hasActiveFilters && (
          <span className="ml-2 bg-theme-600 text-white text-xs px-2 py-0.5 rounded-full">
            {Object.values(selectedFilters).reduce((acc, group) => acc + group.length, 0)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-theme-800 rounded-lg shadow-xl z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="text-sm text-theme-300 hover:text-theme-200"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-6">
              {filters.map((group) => (
                <div key={group.name}>
                  <h4 className="text-sm font-medium text-theme-300 mb-2">{group.name}</h4>
                  <div className="space-y-2">
                    {group.options.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center text-sm text-theme-100 hover:text-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="form-checkbox h-4 w-4 text-theme-500 rounded border-theme-600 bg-theme-700 focus:ring-theme-500"
                          checked={selectedFilters[group.name]?.includes(option.value)}
                          onChange={() => onFilterChange(group.name, option.value)}
                        />
                        <span className="ml-2">{option.label}</span>
                        {option.count !== undefined && (
                          <span className="ml-auto text-theme-400">({option.count})</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}