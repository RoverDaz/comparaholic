import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { SkipToResults } from '../components/SkipToResults';
import { supabase } from '../lib/supabase';

interface FormField {
  field_name: string;
  field_type: string;
  field_label: string;
  field_options: string[];
  is_required: boolean;
  display_order: number;
}

const defaultFormFields = [
  {
    field_name: 'agency',
    field_type: 'select',
    field_label: 'What agency are you with?',
    field_options: [
      'Royal Lepage',
      'Remax',
      'M Immobilier',
      'Centris',
      'Century21',
      'Engel & Volkers',
      'BLVD Immobilier',
      'Sotheby\'s',
      'Other'
    ],
    is_required: true,
    display_order: 0
  },
  {
    field_name: 'commission_rate',
    field_type: 'select',
    field_label: 'What is your commission rate?',
    field_options: Array.from({ length: 29 }, (_, i) => ((i + 4) * 0.25).toFixed(2)),
    is_required: true,
    display_order: 1
  },
  {
    field_name: 'agent_name',
    field_type: 'text',
    field_label: 'What is your agent\'s name?',
    field_options: [],
    is_required: true,
    display_order: 2
  }
];

export function RealEstateBroker() {
  const { step = '0' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { formState, setFullFormState } = useFormStore();
  const currentStep = parseInt(step);
  const [formFields] = useState<FormField[]>(defaultFormFields);
  const [inputValue, setInputValue] = useState(formState.agent_name || '');
  const [error, setError] = useState('');
  
  useFormPersistence('real-estate-broker');
  
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';

  const validateFormData = (data: any) => {
    if (!data.agency || !data.commission_rate || !data.agent_name) {
      throw new Error('All fields are required');
    }

    const trimmedName = data.agent_name.trim();
    if (!trimmedName) {
      throw new Error('Agent name cannot be empty');
    }

    return {
      ...data,
      agent_name: trimmedName
    };
  };

  const saveToSupabase = async (formData: any) => {
    if (!user?.id) {
      throw new Error('User must be logged in');
    }

    const { error: supabaseError } = await supabase
      .from('user_form_responses')
      .upsert({
        category: 'real-estate-broker',
        form_data: formData,
        user_id: user.id
      }, {
        onConflict: 'user_id,category'
      });

    if (supabaseError) throw supabaseError;
  };

  const handleSelect = async (answer: string) => {
    const currentField = formFields[currentStep];
    const newFormState = { ...formState, [currentField.field_name]: answer };
    
    setFullFormState(newFormState);
    
    if (currentStep < formFields.length - 1) {
      navigate(`/compare/real-estate-broker/${currentStep + 1}${isEditMode ? '?edit=true' : ''}`);
    } else {
      try {
        const validatedData = validateFormData(newFormState);
        await saveToSupabase(validatedData);
        navigate('/compare/real-estate-broker/results');
      } catch (err) {
        console.error('Error saving form:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!formState.agency || !formState.commission_rate) {
        throw new Error('Please complete all previous steps first');
      }

      const trimmedName = inputValue.trim();
      if (!trimmedName) {
        throw new Error('Agent name cannot be empty');
      }

      const newFormState = { 
        ...formState, 
        agent_name: trimmedName
      };

      const validatedData = validateFormData(newFormState);
      await saveToSupabase(validatedData);
      setFullFormState(validatedData);
      navigate('/compare/real-estate-broker/results');
    } catch (err) {
      console.error('Error saving form:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const currentField = formFields[currentStep];
  const currentAnswer = formState[currentField.field_name] || '';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-theme-900 rounded-lg shadow-xl overflow-hidden">
        {currentStep === 0 && (
          <SkipToResults category="real-estate-broker" />
        )}

        <div className="p-8">
          <div className="mb-8">
            <div className="h-2 bg-theme-800 rounded-full">
              <div
                className="h-2 bg-theme-300 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / formFields.length) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-theme-300 text-sm">
              Step {currentStep + 1} of {formFields.length}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-md border border-red-500">
              {error}
            </div>
          )}

          <h2 className="text-2xl font-bold text-white mb-6">
            {currentField.field_label}
          </h2>

          {currentField.field_type === 'text' ? (
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-2 bg-theme-800 text-white rounded-lg border border-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-300"
                placeholder="Enter agent's name"
                required
                minLength={2}
                maxLength={100}
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-full flex items-center justify-center px-4 py-2 bg-theme-500 text-white rounded-lg hover:bg-theme-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRightIcon className="h-5 w-5 ml-2" />
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              {currentField.field_options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg ${
                    currentAnswer === option
                      ? 'bg-theme-700 text-white'
                      : 'bg-theme-800 hover:bg-theme-700 text-white'
                  } transition-colors`}
                >
                  <span>
                    {currentField.field_name === 'commission_rate'
                      ? `${option}%`
                      : option}
                  </span>
                  <ChevronRightIcon className="h-5 w-5 text-theme-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}