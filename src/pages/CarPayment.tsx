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
  'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade'],
  'Kia': ['Forte', 'K5', 'Sportage', 'Telluride', 'Sorento'],
  'Volkswagen': ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf'],
  'Audi': ['A3', 'A4', 'Q3', 'Q5', 'Q7']
};

const defaultFormFields = [
  {
    field_name: 'make',
    field_type: 'select',
    field_label: 'What make is your car?',
    field_options: Object.keys(carModels),
    is_required: true,
    display_order: 0
  },
  {
    field_name: 'model',
    field_type: 'select',
    field_label: 'What model is your car?',
    field_options: [], // Will be populated based on make
    is_required: true,
    display_order: 1
  },
  {
    field_name: 'monthly_payment',
    field_type: 'select',
    field_label: 'How much is your monthly payment?',
    field_options: Array.from({ length: 39 }, (_, i) => ((i + 2) * 50).toString()),
    is_required: true,
    display_order: 2
  },
  {
    field_name: 'interest_rate',
    field_type: 'select',
    field_label: 'What is your interest rate?',
    field_options: Array.from({ length: 31 }, (_, i) => (i * 0.5).toString()),
    is_required: true,
    display_order: 3
  },
  {
    field_name: 'term',
    field_type: 'select',
    field_label: 'What is your loan term?',
    field_options: ['12 months', '24 months', '36 months', '48 months', '60 months', '72 months', '84 months'],
    is_required: true,
    display_order: 4
  },
  {
    field_name: 'down_payment',
    field_type: 'select',
    field_label: 'How much was your down payment?',
    field_options: Array.from({ length: 21 }, (_, i) => (i * 1000).toString()),
    is_required: true,
    display_order: 5
  }
];

export function CarPayment() {
  const { step = '0' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { formState, setFullFormState } = useFormStore();
  const currentStep = parseInt(step);
  const [formFields] = useState<FormField[]>(defaultFormFields);
  
  useFormPersistence('new-car-payment');
  
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
      navigate(`/compare/new-car-payment/${currentStep + 1}${isEditMode ? '?edit=true' : ''}`);
    } else {
      const params = new URLSearchParams(newFormState);
      navigate(`/compare/new-car-payment/results?${params.toString()}`);
    }
  };

  const currentField = formFields[currentStep];
  const currentAnswer = formState[currentField.field_name] || '';
  const options = getFieldOptions(currentField);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-theme-900 rounded-lg shadow-xl overflow-hidden">
        {currentStep === 0 && (
          <SkipToResults category="new-car-payment" />
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
                  {(currentField.field_name === 'monthly_payment' || currentField.field_name === 'down_payment')
                    ? `$${option}`
                    : currentField.field_name === 'interest_rate'
                    ? `${option}%`
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