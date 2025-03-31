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
  const { formState, setFullFormState } = useFormStore();
  const currentStep = parseInt(step);
  const [formFields] = useState<FormField[]>(defaultFormFields);
  
  useFormPersistence('car-insurance');
  
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';

  const getFieldOptions = (field: FormField) => {
    if (field.field_name === 'model' && formState.make) {
      return carModels[formState.make] || [];
    }
    return field.field_options;
  };

  const handleSelect = async (answer: string) => {
    const currentField = formFields[currentStep];
    const newFormState = { ...formState, [currentField.field_name]: answer };
    
    setFullFormState(newFormState);
    
    if (currentStep < formFields.length - 1) {
      navigate(`/compare/car-insurance/${currentStep + 1}${isEditMode ? '?edit=true' : ''}`);
    } else {
      navigate(`/compare/car-insurance/results`);
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

          <h2 className="text-2xl font-bold text-white mb-6">
            {currentField.field_label}
          </h2>

          <div className="space-y-3">
            {options.map((option) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}