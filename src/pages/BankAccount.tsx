import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { SkipToResults } from '../components/SkipToResults';
import Cookies from 'js-cookie';
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
    field_name: 'visitor_name',
    field_type: 'text',
    field_label: 'Your Name',
    field_options: [],
    is_required: true,
    display_order: 0
  },
  {
    field_name: 'bank',
    field_type: 'select',
    field_label: 'Which bank are you with?',
    field_options: ['CIBC', 'RBC', 'TD', 'Scotiabank', 'BMO', 'National'],
    is_required: true,
    display_order: 1
  },
  {
    field_name: 'monthly_fee',
    field_type: 'select',
    field_label: 'How much do you pay in monthly fees?',
    field_options: ['$0', '$5', '$10', '$15', '$20', '$25', '$30'],
    is_required: true,
    display_order: 2
  },
  {
    field_name: 'free_transactions',
    field_type: 'select',
    field_label: 'How many free transactions do you get per month?',
    field_options: Array.from({ length: 21 }, (_, i) => i.toString()),
    is_required: true,
    display_order: 3
  }
];

export function BankAccount() {
  const { step = '0' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { formState, setFullFormState, saveUserResponses } = useFormStore();
  const currentStep = parseInt(step);
  const [formFields] = useState<FormField[]>(defaultFormFields);
  const [inputValue, setInputValue] = useState(formState.visitor_name || '');
  const [error, setError] = useState('');
  
  useFormPersistence('bank-fees');
  
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';
  const editData = location.state?.editData;

  useEffect(() => {
    console.log('Current form state:', formState);
    if (editData) {
      console.log('Loading edit data:', editData);
      setFullFormState(editData);
      setInputValue(editData.visitor_name || '');
    }
  }, [editData, setFullFormState]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inputValue.trim()) {
      setError('Please enter your name');
      return;
    }

    const newFormState = { ...formState, visitor_name: inputValue.trim() };
    console.log('Saving visitor name:', {
      inputValue,
      newFormState,
      existingState: formState
    });
    
    setFullFormState(newFormState);
    await saveUserResponses('bank-fees');
    navigate('/compare/bank-fees/1');
  };

  const handleSelect = async (answer: string) => {
    const currentField = formFields[currentStep];
    const newFormState = { ...formState, [currentField.field_name]: answer };
    
    console.log('Updating form state:', {
      currentField: currentField.field_name,
      answer,
      newFormState,
      existingState: formState
    });
    
    setFullFormState(newFormState);
    await saveUserResponses('bank-fees');
    
    if (currentStep < formFields.length - 1) {
      navigate(`/compare/bank-fees/${currentStep + 1}${isEditMode ? '?edit=true' : ''}`);
    } else {
      try {
        // Validate only the current field
        if (!newFormState[formFields[currentStep].field_name]) {
          throw new Error('This field is required');
        }

        // Validate all required fields
        const missingFields = formFields
          .filter(field => field.is_required && !newFormState[field.field_name])
          .map(field => field.field_name);

        if (missingFields.length > 0) {
          console.error('Missing fields:', missingFields);
          console.error('Current form state:', newFormState);
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        const currentTimestamp = new Date().toISOString();
        console.log('Saving form data:', newFormState);

        // Save to database
        if (user) {
          const { error: supabaseError } = await supabase
            .from('user_form_responses')
            .upsert({
              user_id: user.id,
              category: 'bank-fees',
              form_data: newFormState,
              updated_at: currentTimestamp
            }, {
              onConflict: 'user_id,category'
            });

          if (supabaseError) throw supabaseError;
        } else {
          let visitorId = Cookies.get('visitor_id');
          if (!visitorId) {
            visitorId = crypto.randomUUID();
            Cookies.set('visitor_id', visitorId, { expires: 7 });
          }

          // Check if submission exists
          const { data: existingSubmission } = await supabase
            .from('visitor_submissions')
            .select('id')
            .eq('visitor_id', visitorId)
            .eq('category', 'bank-fees')
            .single();

          if (existingSubmission) {
            // Update existing submission
            const { error: updateError } = await supabase
              .from('visitor_submissions')
              .update({
                form_data: newFormState,
                created_at: currentTimestamp
              })
              .eq('visitor_id', visitorId)
              .eq('category', 'bank-fees');

            if (updateError) throw updateError;
          } else {
            // Insert new submission
            const { error: insertError } = await supabase
              .from('visitor_submissions')
              .insert({
                visitor_id: visitorId,
                category: 'bank-fees',
                form_data: newFormState
              });

            if (insertError) throw insertError;
          }
        }

        // Navigate to results
        navigate('/compare/bank-fees/results');
      } catch (err) {
        console.error('Error saving form:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    }
  };

  const currentField = formFields[currentStep];
  const currentAnswer = formState[currentField.field_name] || '';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-theme-900 rounded-lg shadow-xl overflow-hidden">
        {currentStep === 0 && (
          <SkipToResults category="bank-fees" />
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
                placeholder="Enter your name"
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
                  <span>{option}</span>
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