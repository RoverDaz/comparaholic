import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
    field_name: 'agency',
    field_type: 'select',
    field_label: 'Which real estate agency are you using?',
    field_options: ['Century 21', 'RE/MAX', 'Royal LePage', 'Sotheby\'s', 'Other'],
    is_required: true,
    display_order: 0
  },
  {
    field_name: 'property_type',
    field_type: 'select',
    field_label: 'What type of property are you looking for?',
    field_options: ['House', 'Condo', 'Townhouse', 'Apartment'],
    is_required: true,
    display_order: 1
  },
  {
    field_name: 'price_range',
    field_type: 'select',
    field_label: 'What is your price range?',
    field_options: [
      'Under $300,000',
      '$300,000 - $500,000',
      '$500,000 - $750,000',
      '$750,000 - $1,000,000',
      'Over $1,000,000'
    ],
    is_required: true,
    display_order: 2
  },
  {
    field_name: 'location',
    field_type: 'select',
    field_label: 'Where are you looking to buy?',
    field_options: ['Downtown', 'Suburbs', 'Rural', 'Beach', 'Mountain'],
    is_required: true,
    display_order: 3
  }
];

export function RealEstate() {
  const { step = '0' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { formState, setFullFormState, saveUserResponses } = useFormStore();
  const currentStep = parseInt(step);
  const [formFields] = useState<FormField[]>(defaultFormFields);
  const [error, setError] = useState('');
  
  useFormPersistence('real-estate');
  
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';
  const editData = location.state?.editData;

  useEffect(() => {
    if (editData) {
      setFullFormState(editData);
    }
  }, [editData, setFullFormState]);

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
    await saveUserResponses('real-estate');
    
    if (currentStep < formFields.length - 1) {
      navigate(`/compare/real-estate/${currentStep + 1}${isEditMode ? '?edit=true' : ''}`);
    } else {
      try {
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
        console.log('Saving form data:', { newFormState, user });

        // Save to database
        if (user) {
          const { error: supabaseError } = await supabase
            .from('user_form_responses')
            .upsert({
              user_id: user.id,
              category: 'real-estate',
              form_data: newFormState,
              updated_at: currentTimestamp
            }, {
              onConflict: 'user_id,category'
            });

          if (supabaseError) {
            console.error('Error saving user form:', supabaseError);
            throw supabaseError;
          }
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
            .eq('category', 'real-estate')
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
              .eq('category', 'real-estate');

            if (updateError) {
              console.error('Error updating visitor submission:', updateError);
              throw updateError;
            }
          } else {
            // Insert new submission
            const { error: insertError } = await supabase
              .from('visitor_submissions')
              .insert({
                visitor_id: visitorId,
                category: 'real-estate',
                form_data: newFormState
              });

            if (insertError) {
              console.error('Error inserting visitor submission:', insertError);
              throw insertError;
            }
          }
        }

        // Navigate to results
        navigate('/compare/real-estate-broker/results', {
          state: { formState: newFormState }
        });
      } catch (error) {
        console.error('Error saving form:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      }
    }
  };

  const currentField = formFields[currentStep];
  const currentAnswer = formState[currentField.field_name] || '';

  // Add debug logging
  useEffect(() => {
    console.log('Current form state:', formState);
    console.log('Current step:', currentStep);
    console.log('Current field:', currentField);
    console.log('Current answer:', currentAnswer);
  }, [formState, currentStep, currentField, currentAnswer]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-theme-900 rounded-lg shadow-xl overflow-hidden">
        {!user && currentStep === 0 && (
          <SkipToResults category="real-estate" />
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

          <h2 className="text-2xl font-bold text-white mb-6">
            {currentField.field_label}
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
              {error}
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
} 