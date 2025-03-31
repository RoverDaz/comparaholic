import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FilterIcon, ArrowUpIcon, ArrowDownIcon, StarIcon, PencilIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { ResultsFilter } from '../components/ResultsFilter';
import { useFilters } from '../hooks/useFilters';
import { supabase } from '../lib/supabase';

interface CarPayment {
  id: string;
  make: string;
  model: string;
  monthly_payment: number;
  interest_rate: number;
  term: string;
  down_payment: number;
  isUserPayment?: boolean;
  user_id?: string;
}

export function CarPaymentResults() {
  const [payments, setPayments] = useState<CarPayment[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formState } = useFormStore();

  const filterConfig = {
    make: (payment: CarPayment, values: string[]) => 
      values.includes(payment.make),
    model: (payment: CarPayment, values: string[]) =>
      values.includes(payment.model),
    term: (payment: CarPayment, values: string[]) =>
      values.includes(payment.term),
    monthly_payment: (payment: CarPayment, values: string[]) => {
      const ranges = values.map(range => {
        const [min, max] = range.split('-').map(num => parseInt(num.replace('$', '')));
        return { min, max };
      });
      return ranges.some(range => 
        payment.monthly_payment >= range.min && payment.monthly_payment <= range.max
      );
    },
    interest_rate: (payment: CarPayment, values: string[]) => {
      const ranges = values.map(range => {
        const [min, max] = range.split('-').map(num => parseFloat(num.replace('%', '')));
        return { min, max };
      });
      return ranges.some(range => 
        payment.interest_rate >= range.min && payment.interest_rate <= range.max
      );
    }
  };

  const {
    selectedFilters,
    filteredItems: filteredPayments,
    toggleFilter,
    clearFilters,
    isFilterMenuOpen,
    toggleFilterMenu
  } = useFilters<CarPayment>(payments, filterConfig);

  useEffect(() => {
    const isSkipped = location.state?.skip === true;
    console.log('Results page initialized', { isSkipped, hasFormState: Object.keys(formState).length > 0 });

    if (!isSkipped && Object.keys(formState).length === 0) {
      console.log('No form data found, redirecting to form');
      navigate('/compare/new-car-payment/0');
      return;
    }

    const fetchPayments = async () => {
      try {
        // Fetch both user form responses and visitor submissions
        const [{ data: userResponses, error: userError }, { data: visitorSubmissions, error: visitorError }] = await Promise.all([
          supabase
            .from('user_form_responses')
            .select('*')
            .eq('category', 'new-car-payment')
            .order('created_at', { ascending: false }),
          supabase
            .from('visitor_submissions')
            .select('*')
            .eq('category', 'new-car-payment')
            .is('claimed_by', null)
            .order('created_at', { ascending: false })
        ]);

        if (userError) throw userError;
        if (visitorError) throw visitorError;

        let allPayments: CarPayment[] = [];

        // Transform user responses
        if (userResponses) {
          const userPayments = userResponses.map(response => ({
            id: response.id,
            make: response.form_data.make || 'Unknown Make',
            model: response.form_data.model || 'Unknown Model',
            monthly_payment: parseFloat(response.form_data.monthly_payment || '0'),
            interest_rate: parseFloat(response.form_data.interest_rate || '0'),
            term: response.form_data.term || '',
            down_payment: parseFloat(response.form_data.down_payment || '0'),
            isUserPayment: user?.id === response.user_id,
            user_id: response.user_id
          }));
          allPayments = [...allPayments, ...userPayments];
        }

        // Transform visitor submissions
        if (visitorSubmissions) {
          const visitorPayments = visitorSubmissions.map(submission => ({
            id: submission.id,
            make: submission.form_data.make || 'Unknown Make',
            model: submission.form_data.model || 'Unknown Model',
            monthly_payment: parseFloat(submission.form_data.monthly_payment || '0'),
            interest_rate: parseFloat(submission.form_data.interest_rate || '0'),
            term: submission.form_data.term || '',
            down_payment: parseFloat(submission.form_data.down_payment || '0'),
            isUserPayment: false
          }));
          allPayments = [...allPayments, ...visitorPayments];
        }

        // Remove duplicates based on make, model, and monthly_payment
        const uniquePayments = allPayments.filter((payment, index, self) =>
          index === self.findIndex((p) => (
            p.make === payment.make &&
            p.model === payment.model &&
            p.monthly_payment === payment.monthly_payment
          ))
        );

        // Sort payments by monthly payment
        const sortedPayments = uniquePayments.sort((a, b) => 
          sortOrder === 'asc' ? a.monthly_payment - b.monthly_payment : b.monthly_payment - a.monthly_payment
        );

        setPayments(sortedPayments);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching payments:', error);
        setLoading(false);
      }
    };

    fetchPayments();
  }, [location.state, navigate, sortOrder, user, formState]);

  const toggleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    const sorted = [...payments].sort((a, b) => 
      newOrder === 'asc' ? a.monthly_payment - b.monthly_payment : b.monthly_payment - a.monthly_payment
    );
    
    setPayments(sorted);
  };

  const handleEditPayment = () => {
    navigate('/compare/new-car-payment/0?edit=true');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-300 mx-auto"></div>
          <p className="mt-4 text-theme-300">Loading payment options...</p>
        </div>
      </div>
    );
  }

  const filters = [
    {
      name: 'make',
      options: Array.from(new Set(payments.map(payment => payment.make)))
        .map(make => ({ label: make, value: make }))
    },
    {
      name: 'model',
      options: Array.from(new Set(payments.map(payment => payment.model)))
        .map(model => ({ label: model, value: model }))
    },
    {
      name: 'term',
      options: Array.from(new Set(payments.map(payment => payment.term)))
        .map(term => ({ label: term, value: term }))
    },
    {
      name: 'monthly_payment',
      options: [
        { label: '$0-$300', value: '0-300' },
        { label: '$301-$500', value: '301-500' },
        { label: '$501-$750', value: '501-750' },
        { label: '$751+', value: '751-999999' }
      ]
    },
    {
      name: 'interest_rate',
      options: [
        { label: '0-3%', value: '0-3' },
        { label: '3-5%', value: '3-5' },
        { label: '5-7%', value: '5-7' },
        { label: '7%+', value: '7-100' }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Car Payment Comparison</h1>
        
        <div className="flex items-center space-x-4">
          <ResultsFilter
            filters={filters}
            selectedFilters={selectedFilters}
            onFilterChange={toggleFilter}
            onClearFilters={clearFilters}
            isOpen={isFilterMenuOpen}
            onToggle={toggleFilterMenu}
          />
          
          <button
            onClick={toggleSort}
            className="flex items-center px-4 py-2 bg-theme-800 text-white rounded-lg hover:bg-theme-700"
          >
            Sort by Monthly Payment
            {sortOrder === 'asc' ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-theme-300">No car payment comparisons available yet. Be the first to add yours!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPayments.map(payment => (
            <div 
              key={payment.id} 
              className={`bg-theme-900 rounded-lg p-6 ${
                payment.isUserPayment ? 'ring-2 ring-theme-300' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-2">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {payment.make} {payment.model}
                    </h3>
                    <p className="text-theme-300">{payment.term}</p>
                    {payment.isUserPayment && (
                      <p className="text-sm text-theme-400">Your current payment</p>
                    )}
                  </div>
                  {payment.isUserPayment && (
                    <div className="flex items-center space-x-2">
                      <StarIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                      <button
                        onClick={handleEditPayment}
                        className="p-1 hover:bg-theme-800 rounded-full transition-colors"
                        title="Edit your payment"
                      >
                        <PencilIcon className="h-4 w-4 text-theme-300" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    ${payment.monthly_payment.toFixed(2)}
                  </p>
                  <p className="text-theme-300">per month</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-theme-200">
                <div className="flex justify-between">
                  <span>Interest Rate</span>
                  <span>{payment.interest_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Down Payment</span>
                  <span>${payment.down_payment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Cost</span>
                  <span>${(payment.monthly_payment * parseInt(payment.term.split(' ')[0]) + payment.down_payment).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}