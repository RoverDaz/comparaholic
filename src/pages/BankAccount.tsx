import React, { useState, useEffect } from 'react';
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
    field_label: 'Which bank are you with?',
    field_options: ['CIBC', 'RBC', 'TD', 'Scotiabank', 'BMO', 'National'],
    is_required: true,
    display_order: 0
  },
  {
    field_name: 'monthly_fee',
    field_type: 'select',
    field_label: 'What is your monthly fee?',
    field_options: Array.from({ length: 41 }, (_, i) => i.toString()),
    is_required: true,
    display_order: 1
  },
  {
    field_name: 'free_transactions',
    field_type: 'select',
    field_label: 'How many free transactions per month do you have?',
    field_options: ['0', '5', '10', '20', 'unlimited'],
    is_required: true,
    display_order: 2
  }
];

export function BankAccount() {
  const { step = '0' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { formState, setFullFormState, setFormFields } = useFormStore();
  const currentStep = parseInt(step);
  const [formFields, setFormFieldsLocal] = useState<FormField[]>(defaultFormFields);
  
  useFormPersistence('bank-fees');
  
  useEffect(() => {
    fetch('/banks.txt') // changed: fetch from main folder instead of "/compare/banks.txt"
      .then(response => response.text())
      .then(text => {
        const banks = text.split('\n').map(bank => bank.trim()).filter(bank => bank);
        if (banks.length > 0) {
          // Update local state so the dropdown reflects changes
          setFormFieldsLocal(prev =>
            prev.map(field =>
              field.field_name === 'bank' ? { ...field, field_options: banks } : field
            )
          );
          // Also update store state if needed elsewhere
          setFormFields(prev =>
            prev.map(field =>
              field.field_name === 'bank' ? { ...field, field_options: banks } : field
            )
          );
        }
      })
      .catch(err => console.error('Error fetching bank names:', err));
  }, []);

  const searchParams = new URLSearchParams(location.search);
  const isEditMode = searchParams.get('edit') === 'true';

  const handleSelect = async (answer: string) => {
    const currentField = formFields[currentStep];
    const newFormState = { ...formState, [currentField.field_name]: answer };
    
    setFullFormState(newFormState);
    
    if (currentStep < formFields.length - 1) {
      navigate(`/compare/bank-fees/${currentStep + 1}${isEditMode ? '?edit=true' : ''}`);
    } else {
      const params = new URLSearchParams(newFormState);
      navigate(`/compare/bank-fees/results?${params.toString()}`);
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

          <h2 className="text-2xl font-bold text-white mb-6">
            {currentField.field_label}
          </h2>

          <select
            value={currentAnswer}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full p-4 rounded-lg bg-theme-800 text-white hover:bg-theme-700"
          >
            <option value="" disabled>Select an option</option>
            {currentField.field_options.map((option) => (
              <option key={option} value={option}>
                {currentField.field_name === 'monthly_fee' ? `$${option}` : option}
              </option>
            ))}
          </select>
          
        </div>
      </div>
    </div>
  );
}