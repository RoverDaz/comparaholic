import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { SkipToResults } from '../components/SkipToResults';
import { supabase } from '../lib/supabase';
import Cookies from 'js-cookie';

interface FormField {
  field_name: string;
  field_type: string;
  field_label: string;
  field_options: string[];
  is_required: boolean;
  display_order: number;
}

const carModels: Record<string, string[]> = {
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V'],
  'Ford': ['F-150', 'Escape', 'Explorer', 'Mustang', 'Edge'],
  'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Traverse', 'Tahoe'],
  'BMW': ['3 Series', '5 Series', 'X3', 'X5', '7 Series'],
  'Mercedes': ['C-Class', 'E-Class', 'GLC', 'GLE', 'S-Class'],
  'Other': ['Other']
};

const defaultFormFields = [
  {
    field_name: 'age',
    field_type: 'select',
    field_label: 'How old are you?',
    field_options: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
    is_required: true,
    display_order: 0
  },
  {
    field_name: 'current_provider',
    field_type: 'select',
    field_label: 'Who is your current insurance provider?',
    field_options: ['AllState', 'StateFarm', 'Progressive', 'Geico', 'Liberty Mutual', 'Other', 'None (First Time)'],
    is_required: true,
    display_order: 1
  },
  {
    field_name: 'annual_premium',
    field_type: 'select',
    field_label: 'How much do you pay annually for car insurance?',
    field_options: Array.from({ length: 41 }, (_, i) => ((i + 10) * 100).toString()),
    is_required: true,
    display_order: 2
  },
  {
    field_name: 'make',
    field_type: 'select',
    field_label: 'What make of vehicle do you drive?',
    field_options: Object.keys(carModels),
    is_required: true,
    display_order: 3
  },
  {
    field_name: 'model',
    field_type: 'select',
    field_label: 'What model vehicle do you drive?',
    field_options: [], // Will be populated based on make
    is_required: true,
    display_order: 4
  },
  {
    field_name: 'year',
    field_type: 'select',
    field_label: 'What year is the vehicle?',
    field_options: Array.from({ length: 25 }, (_, i) => String(new Date().getFullYear() - i)),
    is_required: true,
    display_order: 5
  },
  {
    field_name: 'license_age',
    field_type: 'select',
    field_label: 'What age did you get your license?',
    field_options: Array.from({ length: 53 }, (_, i) => String(i + 16)),
    is_required: true,
    display_order: 6
  },
  {
    field_name: 'claims',
    field_type: 'select',
    field_label: 'How many claims have you made in the past 6 years?',
    field_options: ['0', '1', '2', '3', '4', '5+'],
    is_required: true,
    display_order: 7
  },
  {
    field_name: 'city',
    field_type: 'select',
    field_label: 'What city do you live in?',
    field_options: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Other'],
    is_required: true,
    display_order: 8
  }
];

export function CarInsurance() {
  const { step = '0' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { formState, setFullFormState, saveUserResponses } = useFormStore();
  const currentStep = parseInt(step);
  const [formFields] = useState<FormField[]>(defaultFormFields);
  const [error, setError] = useState<string | null>(null);
  
  useFormPersistence('car-insurance');
  
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';

  // Add debug logging for form state and options
  useEffect(() => {
    console.log('Current form state:', formState);
    console.log('Current step:', currentStep);
    if (currentStep === 4 && formState.make) {
      console.log('Models for selected make:', carModels[formState.make]);
    }
  }, [currentStep, formState]);

  const getFieldOptions = (field: FormField) => {
    if (field.field_name === 'model' && formState.make) {
      const models = carModels[formState.make] || [];
      console.log('Getting model options for make:', formState.make, 'Options:', models);
      return models;
    }
    return field.field_options;
  };

  const handleSelect = async (answer: string) => {
    const currentField = formFields[currentStep];
    let newFormState = { ...formState, [currentField.field_name]: answer };

    // If the user is selecting a new make, reset the model field
    if (currentField.field_name === 'make') {
      newFormState = { ...newFormState, model: '' };
    }

    console.log('Updating form state:', {
      currentField: currentField.field_name,
      answer,
      newFormState,
      existingState: formState
    });
    
    setFullFormState(newFormState);
    await saveUserResponses('car-insurance');
    
    if (currentStep < formFields.length - 1) {
      navigate(`/compare/car-insurance/${currentStep + 1}${isEditMode ? '?edit=true' : ''}`);
    } else {
      try {
        // Validate the form data
        if (!newFormState.age || !newFormState.current_provider || !newFormState.annual_premium || 
            !newFormState.make || !newFormState.model || !newFormState.year || 
            !newFormState.license_age || !newFormState.claims || !newFormState.city) {
          throw new Error('All fields are required');
        }

        const currentTimestamp = new Date().toISOString();

        // Get user's full name from metadata
        let visitorName = 'Visitor Submission';
        if (user) {
          const { data: userData } = await supabase.auth.getUser();
          visitorName = userData?.user?.user_metadata?.full_name || 'Anonymous';
        }

        // Add visitor name to form data
        newFormState = { ...newFormState, visitor_name: visitorName };

        // Save to database
        if (user) {
          const { error: supabaseError } = await supabase
            .from('user_form_responses')
            .upsert({
              user_id: user.id,
              category: 'car-insurance',
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
            .eq('category', 'car-insurance')
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
              .eq('category', 'car-insurance');

            if (updateError) throw updateError;
          } else {
            // Insert new submission
            const { error: insertError } = await supabase
              .from('visitor_submissions')
              .insert({
                visitor_id: visitorId,
                category: 'car-insurance',
                form_data: newFormState
              });

            if (insertError) throw insertError;
          }
        }

        // Navigate to results
        navigate('/compare/car-insurance/results');
      } catch (err) {
        console.error('Error saving form:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    }
  };

  const currentField = formFields[currentStep];
  const currentAnswer = formState[currentField.field_name] || '';
  const options = getFieldOptions(currentField);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-theme-900 rounded-lg shadow-xl overflow-hidden">
        {currentStep === 0 && (
          <SkipToResults category="car-insurance" />
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

          <div className="space-y-3">
            {options.length === 0 && currentField.field_name === 'model' ? (
              <div className="text-theme-300">No models available for the selected make. Please go back and select a make.</div>
            ) : (
              options.map((option) => (
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
                    {currentField.field_name === 'annual_premium'
                      ? `$${option}`
                      : option}
                  </span>
                  <ChevronRightIcon className="h-5 w-5 text-theme-300" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}