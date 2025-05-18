import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useFormStore } from '../store/formStore';
import { useAuth } from '../contexts/AuthContext';
import { useComparisonLimit } from '../hooks/useComparisonLimit';
import { AuthPrompt } from '../components/AuthPrompt';
import { BankAccount } from './BankAccount';
import { CarInsurance } from './CarInsurance';
import { CarPayment } from './CarPayment';
import { CellPhonePlan } from './CellPhonePlan';
import { HomeInsurance } from './HomeInsurance';
import { InternetCable } from './InternetCable';
import { MortgageRate } from './MortgageRate';
import { RealEstateBroker } from './RealEstateBroker';
import { BankAccountResults } from './BankAccountResults';
import { CarInsuranceResults } from './CarInsuranceResults';
import { CarPaymentResults } from './CarPaymentResults';
import { CellPhonePlanResults } from './CellPhonePlanResults';
import { HomeInsuranceResults } from './HomeInsuranceResults';
import { InternetCableResults } from './InternetCableResults';
import { MortgageRateResults } from './MortgageRateResults';
import { RealEstateBrokerResults } from './RealEstateBrokerResults';

// Map of old slugs to new slugs
const slugMap: Record<string, string> = {
  'cellphone': 'cell-phone-plan',
  'car-payment': 'new-car-payment'
};

// Map of slugs to their components
const componentMap: Record<string, React.ComponentType> = {
  'bank-fees': BankAccount,
  'car-insurance': CarInsurance,
  'car-payment': CarPayment,
  'new-car-payment': CarPayment,
  'cell-phone-plan': CellPhonePlan,
  'home-insurance': HomeInsurance,
  'internet-cable': InternetCable,
  'mortgage-rate': MortgageRate,
  'real-estate-broker': RealEstateBroker
};

// Map of slugs to their results components
const resultsComponentMap: Record<string, React.ComponentType> = {
  'bank-fees': BankAccountResults,
  'car-insurance': CarInsuranceResults,
  'car-payment': CarPaymentResults,
  'new-car-payment': CarPaymentResults,
  'cell-phone-plan': CellPhonePlanResults,
  'home-insurance': HomeInsuranceResults,
  'internet-cable': InternetCableResults,
  'mortgage-rate': MortgageRateResults,
  'real-estate-broker': RealEstateBrokerResults
};

export function Compare() {
  const { categorySlug, step } = useParams<{ categorySlug: string; step?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { formState, loadUserResponses } = useFormStore();
  const { user } = useAuth();
  const { hasReachedLimit } = useComparisonLimit();

  useEffect(() => {
    const initializeForm = async () => {
      if (!categorySlug) return;

      // Map the category slug to the correct format
      const mappedSlug = slugMap[categorySlug] || categorySlug;

      console.log('Compare page initialized', {
        originalSlug: categorySlug,
        mappedSlug,
        isAuthenticated: !!user,
        hasReachedLimit,
        hasFormState: Object.keys(formState).length > 0,
        currentStep: step,
        isResultsPage: location.pathname.includes('/results')
      });

      // Load any existing responses
      await loadUserResponses(mappedSlug);
      console.log('Loaded user responses', { formState });

      // Check if we should skip to results
      const shouldSkip = location.state?.skip === true;
      console.log('Checking skip parameter from state', { shouldSkip });

      // Only navigate to results if we're not already on the results page
      if (shouldSkip && !location.pathname.includes('/results')) {
        console.log('Skipping to results page');
        navigate(`/compare/${mappedSlug}/results`, { 
          state: { skip: true },
          replace: true 
        });
        return;
      }

      // Special handling for real estate broker
      if (
        mappedSlug === 'real-estate-broker' &&
        !location.pathname.includes('/form') &&
        !location.pathname.includes('/results') &&
        !shouldSkip
      ) {
        navigate(`/compare/${mappedSlug}/form`);
        return;
      }

      // Only navigate if we're not already on a step route
      if (!step && !location.pathname.includes('/results')) {
        console.log('Starting new form at step 0');
        navigate(`/compare/${mappedSlug}/0`, { replace: true });
      }
    };

    initializeForm();
  }, [categorySlug, user, hasReachedLimit, navigate, location.pathname, step]);

  // Show auth prompt if user has reached comparison limit and not skipping
  if (!user && hasReachedLimit && !location.state?.skip) {
    console.log('Showing auth prompt due to reached limit');
    return <AuthPrompt />;
  }

  // Get the mapped slug
  const mappedSlug = categorySlug ? (slugMap[categorySlug] || categorySlug) : '';
  
  // Check if we're on the results page
  const isResultsPage = location.pathname.includes('/results');
  
  // Get the appropriate component based on whether we're on the results page
  const Component = mappedSlug 
    ? (isResultsPage ? resultsComponentMap[mappedSlug] : componentMap[mappedSlug])
    : null;

  if (!Component) {
    console.error('No component found for category:', mappedSlug);
    return null;
  }

  return <Component />;
}