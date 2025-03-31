import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowRightIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useComparisonLimit } from '../hooks/useComparisonLimit';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const categoryEmojis: Record<string, string> = {
  'bank-fees': '🏛️',
  'car-insurance': '🚗',
  'cell-phone-plan': '📱',
  'home-insurance': '🏠',
  'internet-cable': '📺',
  'mortgage-rate': '🏦',
  'new-car-payment': '💰',
  'real-estate-broker': '🔑'
};

export function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const { user } = useAuth();
  const { hasReachedLimit } = useComparisonLimit();

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      if (data) {
        setCategories(data);
      }
    }

    fetchCategories();
  }, []);

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to Comparaholic
        </h1>
        <p className="text-xl text-theme-200 mb-2">
          Click on a comparable to see what other people around you are paying
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/compare/${category.slug}`}
            className="block bg-theme-900 rounded-lg shadow-md p-6 hover:bg-theme-800 transition-colors group relative"
          >
            <div className="text-center mb-4">
              <span className="text-5xl" role="img" aria-label={category.name}>
                {categoryEmojis[category.slug]}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-4 text-center">
              {category.name}
            </h2>
            <div className="flex items-center justify-center text-theme-300 font-medium group-hover:text-theme-200">
              Compare Now
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}