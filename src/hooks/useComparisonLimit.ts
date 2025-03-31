import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useComparisonLimit() {
  const { user } = useAuth();
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [comparisonsCount, setComparisonsCount] = useState(0);

  useEffect(() => {
    if (user) {
      console.log('User is authenticated, no comparison limit');
      setHasReachedLimit(false);
      return;
    }

    // Get the comparison count from localStorage
    const count = parseInt(localStorage.getItem('comparisons_count') || '0');
    console.log('Retrieved comparison count from localStorage', { count });
    setComparisonsCount(count);
    setHasReachedLimit(count >= 1);
  }, [user]);

  const incrementComparison = () => {
    if (user) {
      console.log('Skipping increment for authenticated user');
      return;
    }
    
    const newCount = comparisonsCount + 1;
    console.log('Incrementing comparison count', { oldCount: comparisonsCount, newCount });
    localStorage.setItem('comparisons_count', newCount.toString());
    setComparisonsCount(newCount);
    setHasReachedLimit(newCount >= 1);
  };

  return { hasReachedLimit, incrementComparison };
}