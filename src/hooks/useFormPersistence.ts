import { useEffect, useRef } from 'react';
import { useFormStore } from '../store/formStore';
import { useAuth } from '../contexts/AuthContext';

export function useFormPersistence(category: string) {
  const { formState, setFullFormState, loadUserResponses, saveUserResponses } = useFormStore();
  const { user } = useAuth();
  const initialLoadDone = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load form data when component mounts
  useEffect(() => {
    if (!category || initialLoadDone.current) return;

    loadUserResponses(category);
    initialLoadDone.current = true;
  }, [category, loadUserResponses]);

  // Save form data when it changes
  useEffect(() => {
    if (!category || !initialLoadDone.current || Object.keys(formState).length === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveUserResponses(category);
    }, 500); // Debounce saves to prevent too many requests

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [category, formState, saveUserResponses]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
}