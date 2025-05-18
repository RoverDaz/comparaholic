import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import { useComparisonLimit } from '../hooks/useComparisonLimit';

interface SkipToResultsProps {
  category: string;
}

export function SkipToResults({ category }: SkipToResultsProps) {
  const navigate = useNavigate();
  const { incrementComparison } = useComparisonLimit();

  const handleSkip = () => {
    console.log('Skip button clicked', { category });
    incrementComparison();
    console.log('Navigating to results with skip state');
    navigate(`/compare/${category}/results`, { 
      state: { skip: true }
    });
  };

  return (
    <button
      onClick={handleSkip}
      className="w-full text-center py-4 text-theme-300 hover:text-theme-200 text-sm font-medium border-b border-theme-800 group"
    >
      Skip to browse all results
      <ChevronRightIcon className="inline-block ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
    </button>
  );
}