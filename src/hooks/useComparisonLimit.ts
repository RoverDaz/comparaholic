import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useComparisonLimit() {
  const { user } = useAuth();
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [comparisonsCount, setComparisonsCount] = useState(0);

  useEffect(() => {
    if (user) {
      setHasReachedLimit(false);
      return;
    }

    // For visitors, never set a limit
    setHasReachedLimit(false);
    setComparisonsCount(0);
  }, [user]);

  const incrementComparison = () => {
    // No-op since we're removing limits
    console.log('Comparison increment disabled - no limits for visitors');
  };

  return { hasReachedLimit, incrementComparison };
}