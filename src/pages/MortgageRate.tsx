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
    field_name: 'bank',
    field_type: 'select',
    field_label: 'Who is your provider?',
    field_options: ['CIBC', 'RBC', 'TD', 'Scotiabank', 'BMO', 'National'],
    is_required: true,
    display_order: 0
  },
  {
    field_name: 'mortgage_amount',
    field_type: 'select',
    field_label: 'What is your mortgage amount?',
    field_options: Array.from(
      { length: (3500000 - 100000) / 50000 + 1 },
      (_, i) => (100000 + i * 50000).toString()
    ),
    is_required: true,
    display_order: 1
  },
  {
    field_name: 'down_payment_percent',
    field_type: 'select',
    field_label: 'What percentage is your down payment?',
    field_options: ['5', '10', '15', '20', '25', '30', '35', '40', '45', '50'],
    is_required: true,
    display_order: 2
  },
  {
    field_name: 'interest_rate',
    field_type: 'select',
    field_label: 'What is your interest rate?',
    field_options: Array.from(
      { length: 49 },
      (_, i) => (i * 0.25).toFixed(2)
    ),
    is_required: true,
    display_order: 3
  },
  {
    field_name: 'term_years',
    field_type: 'select',
    field_label: 'What is your mortgage term?',
    field_options: ['1 year', '2 years', '3 years', '4 years', '5 years'],
    is_required: true,
    display_order: 4
  },
  {
    field_name: 'amortization_period',
    field_type: 'select',
    field_label: 'What is your amortization period?',
    field_options: ['15 years', '20 years', '25 years', '30 years'],
    is_required: true,
    display_order: 5
  }
];

export function MortgageRate() {
  const { step = '0' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { formState, setFullFormState } = useFormStore();
  const currentStep = parseInt(step);
  const [formFields] = useState<FormField[]>(defaultFormFields);
  
  useFormPersistence('mortgage-rate');
  
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';

  const handleSelect = async (answer: string) => {
    const currentField = formFields[currentStep];
    const newFormState = { ...formState, [currentField.field_name]: answer };
    
    setFullFormState(newFormState);
    
    if (currentStep < formFields.length - 1) {
      navigate(`/compare/mortgage-rate/${currentStep + 1}${isEditMode ? '?edit=true' : ''}`);
    } else {
      const params = new URLSearchParams(newFormState);
      navigate(`/compare/mortgage-rate/results?${params.toString()}`);
    }
  };

  const currentField = formFields[currentStep];
  const currentAnswer = formState[currentField.field_name] || '';

  const formatOptionLabel = (option: string, fieldName: string) => {
    switch (fieldName) {
      case 'mortgage_amount':
        return `$${parseInt(option).toLocaleString()}`;
      case 'interest_rate':
        return `${option}%`;
      case 'down_payment_percent':
        return `${option}%`;
      default:
        return option;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-theme-900 rounded-lg shadow-xl overflow-hidden">
        {!user && currentStep === 0 && (
          <SkipToResults category="mortgage-rate" />
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
                <span>{formatOptionLabel(option, currentField.field_name)}</span>
                <ChevronRightIcon className="h-5 w-5 text-theme-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}