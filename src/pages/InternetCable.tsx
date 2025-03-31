import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { SkipToResults } from '../components/SkipToResults';

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
    field_name: 'provider',
    field_type: 'select',
    field_label: 'Who is your provider?',
    field_options: ['Videotron', 'Bell', 'Fizz', 'Virgin', 'Other'],
    is_required: true,
    display_order: 0
  },
  {
    field_name: 'monthly_cost',
    field_type: 'select',
    field_label: 'How much do you pay per month?',
    field_options: Array.from({ length: 39 }, (_, i) => ((i + 2) * 5).toString()),
    is_required: true,
    display_order: 1
  },
  {
    field_name: 'speed',
    field_type: 'select',
    field_label: 'What is your internet speed?',
    field_options: ['100mbps', '200mbps', '300mbps', '400mbps', '500mbps'],
    is_required: true,
    display_order: 2
  }
];

export function InternetCable() {
  const { step = '0' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { formState, setFullFormState } = useFormStore();
  const currentStep = parseInt(step);
  const [formFields] = useState<FormField[]>(defaultFormFields);
  
  useFormPersistence('internet-cable');
  
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';

  const handleSelect = async (answer: string) => {
    const currentField = formFields[currentStep];
    const newFormState = { ...formState, [currentField.field_name]: answer };
    
    setFullFormState(newFormState);
    
    if (currentStep < formFields.length - 1) {
      navigate(`/compare/internet-cable/${currentStep + 1}${isEditMode ? '?edit=true' : ''}`);
    } else {
      const params = new URLSearchParams(newFormState);
      navigate(`/compare/internet-cable/results?${params.toString()}`);
    }
  };

  const currentField = formFields[currentStep];
  const currentAnswer = formState[currentField.field_name] || '';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-theme-900 rounded-lg shadow-xl overflow-hidden">
        {!user && currentStep === 0 && (
          <SkipToResults category="internet-cable" />
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
                  {currentField.field_name === 'monthly_cost'
                    ? `$${option}`
                    : option}
                </span>
                <ChevronRightIcon className="h-5 w-5 text-theme-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}