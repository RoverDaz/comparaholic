import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useFormStore } from '../store/formStore';
import { useAuth } from '../contexts/AuthContext';
import { useComparisonLimit } from '../hooks/useComparisonLimit';
import { AuthPrompt } from '../components/AuthPrompt';

export function Compare() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { formState, loadUserResponses } = useFormStore();
  const { user } = useAuth();
  const { hasReachedLimit, incrementComparison } = useComparisonLimit();

  useEffect(() => {
    const initializeForm = async () => {
      if (!categorySlug) return;

      console.log('Compare page initialized', {
        categorySlug,
        isAuthenticated: !!user,
        hasReachedLimit,
        hasFormState: Object.keys(formState).length > 0
      });

      // Load any existing responses
      await loadUserResponses(categorySlug);
      console.log('Loaded user responses', { formState });

      // Check if we should skip to results
      const shouldSkip = location.state?.skip === true;
      console.log('Checking skip parameter from state', { shouldSkip });

      if (shouldSkip) {
        console.log('Skipping to results page');
        navigate(`/compare/${categorySlug}/results`, { 
          state: { skip: true },
          replace: true 
        });
        return;
      }

      // If we have form data, go to results
      if (Object.keys(formState).length > 0) {
        console.log('Form data exists, navigating to results');
        navigate(`/compare/${categorySlug}/results`);
        return;
      }

      // Otherwise, check if visitor can start new form
      if (!user && hasReachedLimit) {
        console.log('Visitor has reached comparison limit');
        return; // AuthPrompt will be shown
      }

      if (!user) {
        console.log('Incrementing comparison count for new visitor form');
        incrementComparison();
      }

      console.log('Starting new form at step 0');
      navigate(`/compare/${categorySlug}/0`);
    };

    initializeForm();
  }, [categorySlug, user, hasReachedLimit, incrementComparison, navigate, formState, loadUserResponses, location]);

  // Show auth prompt if user has reached comparison limit and not skipping
  if (!user && hasReachedLimit && !location.state?.skip) {
    console.log('Showing auth prompt due to reached limit');
    return <AuthPrompt />;
  }

  return null;
}