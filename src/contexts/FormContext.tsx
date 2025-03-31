import React, { createContext, useContext, useState, useCallback } from 'react';

interface FormState {
  [key: string]: string;
}

interface FormContextType {
  formState: FormState;
  updateFormState: (key: string, value: string) => void;
  setFullFormState: (state: FormState) => void;
  clearFormState: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [formState, setFormState] = useState<FormState>({});

  const updateFormState = useCallback((key: string, value: string) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setFullFormState = useCallback((state: FormState) => {
    setFormState(state);
  }, []);

  const clearFormState = useCallback(() => {
    setFormState({});
  }, []);

  return (
    <FormContext.Provider 
      value={{ 
        formState, 
        updateFormState, 
        setFullFormState,
        clearFormState 
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export function useForm() {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
}