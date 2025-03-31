import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useComparisonLimit } from './useComparisonLimit';

export function useSkipToResults() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { incrementComparison } = useComparisonLimit();

  const skipToResults = (category: string) => {
    console.log('Skip button clicked:', { category });
    console.log('Skip requested for:', { category, isAuthenticated: !!user });

    // Skip should always be allowed
    incrementComparison(true);
    console.log('Proceeding to results with skip');
    navigate(`/compare/${category}/results?skip=true`);
  };

  return { skipToResults };
}