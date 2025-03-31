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

const quebecCities = [
  'Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 
  'Sherbrooke', 'Saguenay', 'Levis', 'Trois-Rivieres', 'Terrebonne'
];

const defaultFormFields = [
  {
    field_name: 'city',
    field_type: 'select',
    field_label: 'What city do you live in?',
    field_options: quebecCities,
    is_required: true,
    display_order: 0
  },
  {
    field_name: 'house_value',
    field_type: 'select',
    field_label: 'How much is your house worth?',
    field_options: Array.from(
      { length: (3000000 - 200000) / 50000 + 1 },
      (_, i) => (200000 + i * 50000).toString()
    ),
    is_required: true,
    display_order: 1
  },
  {
    field_name: 'coverage_level',
    field_type: 'select',
    field_label: 'What level of coverage do you want?',
    field_options: ['Low', 'Medium', 'High'],
    is_required: true,
    display_order: 2
  },
  {
    field_name: 'annual_premium',
    field_type: 'select',
    field_label: 'How much is your annual premium?',
    field_options: Array.from(
      { length: 41 },
      (_, i) => ((i + 10) * 100).toString()
    ),
    is_required: true,
    display_order: 3
  },
  {
    field_name: 'deductible',
    field_type: 'select',
    field_label: 'What is your deductible?',
    field_options: Array.from(
      { length: (5000 / 250) + 1 },
      (_, i) => (i * 250).toString()
    ),
    is_required: true,
    display_order: 4
  }
];

export function HomeInsurance() {
  const { step = '0' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { formState, setFullFormState } = useFormStore();
  const currentStep = parseInt(step);
  const [formFields] = useState<FormField[]>(defaultFormFields);
  
  useFormPersistence('home-insurance');
  
  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';

  const handleSelect = async (answer: string) => {
    const currentField = formFields[currentStep];
    const newFormState = { ...formState, [currentField.field_name]: answer };
    
    setFullFormState(newFormState);
    
    if (currentStep < formFields.length - 1) {
      navigate(`/compare/home-insurance/${currentStep + 1}${isEditMode ? '?edit=true' : ''}`);
    } else {
      const params = new URLSearchParams(newFormState);
      navigate(`/compare/home-insurance/results?${params.toString()}`);
    }
  };

  const currentField = formFields[currentStep];
  const currentAnswer = formState[currentField.field_name] || '';

  const formatOptionLabel = (option: string, fieldName: string) => {
    switch (fieldName) {
      case 'house_value':
      case 'deductible':
      case 'annual_premium':
        return `$${parseInt(option).toLocaleString()}`;
      default:
        return option;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-theme-900 rounded-lg shadow-xl overflow-hidden">
        {!user && currentStep === 0 && (
          <SkipToResults category="home-insurance" />
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