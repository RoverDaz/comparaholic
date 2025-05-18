import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormStore } from '../store/formStore';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Cookies from 'js-cookie';
import { ChevronRightIcon } from 'lucide-react';
import { SkipToResults } from '../components/SkipToResults';

export function RealEstateBroker() {
  const [step, setStep] = useState(1);
  const [visitorName, setVisitorName] = useState('');
  const [agency, setAgency] = useState('');
  const [agentName, setAgentName] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setFullFormState } = useFormStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const editData = location.state?.editData;

  useEffect(() => {
    if (editData) {
      setVisitorName(editData.visitor_name || '');
      setAgency(editData.agency || '');
      setAgentName(editData.agent_name || '');
      setCommissionRate(editData.commission_rate || '');
    }
  }, [editData]);

  const handleNext = (selection?: string) => {
    // Determine the value to validate based on step and override
    let valueToValidate = '';
    if (step === 1) {
      valueToValidate = visitorName.trim();
    } else if (step === 2) {
      valueToValidate = (selection as string) || agency;
    } else if (step === 3) {
      valueToValidate = agentName.trim();
    } else if (step === 4) {
      valueToValidate = (selection as string) || commissionRate;
    }

    // Validate current step before proceeding
    if (!valueToValidate) {
      const errorMsg =
        step === 1
          ? 'Please enter your name'
          : step === 2
          ? 'Please select an agency'
          : step === 3
          ? 'Please enter your agent name'
          : 'Please select a commission rate';
      setError(errorMsg);
      return;
    }

    // Save selection to state if provided
    if (step === 2 && selection !== undefined) {
      setAgency(selection);
    }
    if (step === 4 && selection !== undefined) {
      setCommissionRate(selection);
    }

    setError('');

    // If we're on the last step, submit the form
    if (step === 4) {
      handleSubmit(new Event('submit') as any, selection);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent, overrideCommission?: string) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Use overrideCommission for final step to avoid stale state
    const finalCommission = overrideCommission || commissionRate;

    // Validate all fields before submitting
    if (!visitorName.trim() || !agency || !agentName.trim() || !finalCommission) {
      setError('Please complete all fields');
      setLoading(false);
      return;
    }

    try {
      // Create the form data object
      const formData = {
        visitor_name: visitorName,
        agency: agency,
        agent_name: agentName,
        commission_rate: finalCommission
      };

      console.log('Submitting form data:', formData);

      if (user) {
        // Save to user_form_responses for authenticated users
        const { error: supabaseError } = await supabase
          .from('user_form_responses')
          .upsert({
            user_id: user.id,
            category: 'real-estate-broker',
            form_data: formData
          }, {
            onConflict: 'user_id,category'
          });

        if (supabaseError) throw supabaseError;
      } else {
        // Save to visitor_submissions for visitors
        let visitorId = Cookies.get('visitor_id');
        if (!visitorId) {
          visitorId = crypto.randomUUID();
          Cookies.set('visitor_id', visitorId, { expires: 7 }); // 7 days expiry
        }

        console.log('Visitor submission:', {
          visitorId,
          formData,
          existingCookie: Cookies.get('visitor_id')
        });

        // Check if submission exists
        const { data: existingSubmission } = await supabase
          .from('visitor_submissions')
          .select('id')
          .eq('visitor_id', visitorId)
          .eq('category', 'real-estate-broker')
          .single();

        console.log('Existing submission check:', {
          visitorId,
          existingSubmission
        });

        if (existingSubmission) {
          // Update existing submission
          const { error: updateError } = await supabase
            .from('visitor_submissions')
            .update({
              form_data: formData,
              created_at: new Date().toISOString()
            })
            .eq('visitor_id', visitorId)
            .eq('category', 'real-estate-broker');

          if (updateError) throw updateError;
        } else {
          // Insert new submission
          const { error: insertError } = await supabase
            .from('visitor_submissions')
            .insert({
              visitor_id: visitorId,
              category: 'real-estate-broker',
              form_data: formData
            });

          if (insertError) throw insertError;
        }
      }

      // Save to form store
      setFullFormState(formData);

      // Navigate to results
      navigate('/compare/real-estate-broker/results', {
        state: { formState: formData }
      });
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (step < 4) {
        handleNext();
      } else {
        handleSubmit(e);
      }
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2 bg-theme-800 text-white rounded-lg border border-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-300"
              placeholder="Enter your name"
              required
              minLength={2}
              maxLength={100}
            />
            <button
              type="button"
              onClick={() => handleNext()}
              disabled={!visitorName.trim()}
              className="w-full flex items-center justify-center px-4 py-2 bg-theme-500 text-white rounded-lg hover:bg-theme-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-3">
            {['Royal Lepage', 'Remax', 'M Immobilier', 'Centris', 'Century21'].map((option) => (
              <button
                key={option}
                onClick={() => handleNext(option)}
                className={`w-full flex items-center justify-between p-4 rounded-lg ${
                  agency === option
                    ? 'bg-theme-700 text-white'
                    : 'bg-theme-800 hover:bg-theme-700 text-white'
                } transition-colors`}
              >
                <span>{option}</span>
                <ChevronRightIcon className="h-5 w-5 text-theme-300" />
              </button>
            ))}
          </div>
        );
      case 3:
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2 bg-theme-800 text-white rounded-lg border border-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-300"
              placeholder="Enter agent name"
              required
              minLength={2}
              maxLength={100}
            />
            <button
              type="button"
              onClick={() => handleNext()}
              disabled={!agentName.trim()}
              className="w-full flex items-center justify-center px-4 py-2 bg-theme-500 text-white rounded-lg hover:bg-theme-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-3">
            {Array.from({ length: 29 }, (_, i) => ((i + 4) * 0.25).toFixed(2)).map(rate => (
              <button
                key={rate}
                onClick={() => handleNext(rate)}
                className={`w-full flex items-center justify-between p-4 rounded-lg ${
                  commissionRate === rate
                    ? 'bg-theme-700 text-white'
                    : 'bg-theme-800 hover:bg-theme-700 text-white'
                } transition-colors`}
              >
                <span>{rate}%</span>
                <ChevronRightIcon className="h-5 w-5 text-theme-300" />
              </button>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const getStepLabel = () => {
    switch (step) {
      case 1:
        return 'What is your name?';
      case 2:
        return 'Which agency do you work with?';
      case 3:
        return 'What is your agent name?';
      case 4:
        return 'What is your commission rate?';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-theme-900 rounded-lg shadow-xl overflow-hidden">
        {step === 1 && (
          <SkipToResults category="real-estate-broker" />
        )}

        <div className="p-8">
          <div className="mb-8">
            <div className="h-2 bg-theme-800 rounded-full">
              <div
                className="h-2 bg-theme-300 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-theme-300 text-sm">
              Step {step} of 4
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-md border border-red-500">
              {error}
            </div>
          )}

          <h2 className="text-2xl font-bold text-white mb-6">
            {getStepLabel()}
          </h2>

          {renderStep()}
        </div>
      </div>
    </div>
  );
}