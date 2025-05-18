import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryContextType {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('product_categories')
          .select('id, slug, name')
          .order('name');
        
        if (!isMounted) return;

        if (error) {
          console.error('Error fetching categories:', error);
          setError('Failed to load categories');
          return;
        }

        setCategories(data || []);
      } catch (err) {
        console.error('Unexpected error fetching categories:', err);
        if (isMounted) {
          setError('An unexpected error occurred');
          setCategories([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CategoryContext.Provider value={{ categories, isLoading, error }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
} 