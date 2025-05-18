import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon, StarIcon, PencilIcon, XIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { ResultsFilter } from '../components/ResultsFilter';
import { useFilters } from '../hooks/useFilters';
import { supabase } from '../lib/supabase';
import Cookies from 'js-cookie';
import { clearResults } from '../utils/clearResults';

interface CarPayment {
  id: string;
  make: string;
  model: string;
  monthly_payment: number;
  interest_rate: number;
  term: string;
  down_payment: number;
  visitor_name: string;
  isUserPayment?: boolean;
  isVisitorPayment?: boolean;
  user_id?: string;
  visitor_id?: string;
  created_at: string;
  source: 'user' | 'visitor';
}

export function CarPaymentResults() {
  const [payments, setPayments] = useState<CarPayment[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formState } = useFormStore();
  const visitorId = Cookies.get('visitor_id');

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

    let isMounted = true;

    const fetchPayments = async () => {
      try {
        setLoading(true);

        // First fetch all user responses
        const { data: userResponses, error: userError } = await supabase
          .from('user_form_responses')
          .select('*')
          .eq('category', 'new-car-payment')
          .is('deleted', false)
          .order('created_at', { ascending: false });

        if (userError) throw userError;

        // Then fetch all visitor submissions
        const { data: visitorSubmissions, error: visitorError } = await supabase
          .from('visitor_submissions')
          .select('*')
          .eq('category', 'new-car-payment')
          .is('claimed_by', null)
          .is('deleted', false)
          .order('created_at', { ascending: false });

        if (visitorError) throw visitorError;

        if (!isMounted) return;

        let allPayments: CarPayment[] = [];

        // Transform user responses
        if (userResponses) {
          // Get unique user IDs
          const userIds = [...new Set(userResponses.map(response => response.user_id))];
          
          // Fetch user information
          const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          if (usersError) throw usersError;

          // Create a map of user IDs to names
          const userMap = new Map(users?.map(user => [user.id, user.full_name]) || []);

          const userPayments = userResponses.map(response => ({
            id: response.id,
            make: response.form_data.make || 'Unknown Make',
            model: response.form_data.model || 'Unknown Model',
            monthly_payment: parseFloat(response.form_data.monthly_payment || '0'),
            interest_rate: parseFloat(response.form_data.interest_rate || '0'),
            term: response.form_data.term || '',
            down_payment: parseFloat(response.form_data.down_payment || '0'),
            visitor_name: userMap.get(response.user_id) || response.form_data.visitor_name || 'Anonymous',
            isUserPayment: user?.id === response.user_id,
            user_id: response.user_id,
            created_at: response.created_at,
            source: 'user' as const
          }));
          allPayments = [...allPayments, ...userPayments];
        }

        // Transform visitor submissions (only unclaimed ones)
        if (visitorSubmissions) {
          const visitorPayments = visitorSubmissions
            .filter(submission => !submission.claimed_by) // Extra safety check
            .map(submission => ({
              id: submission.id,
              make: submission.form_data.make || 'Unknown Make',
              model: submission.form_data.model || 'Unknown Model',
              monthly_payment: parseFloat(submission.form_data.monthly_payment || '0'),
              interest_rate: parseFloat(submission.form_data.interest_rate || '0'),
              term: submission.form_data.term || '',
              down_payment: parseFloat(submission.form_data.down_payment || '0'),
              visitor_name: submission.form_data.visitor_name || 'Visitor Submission',
              isVisitorPayment: visitorId === submission.visitor_id,
              visitor_id: submission.visitor_id,
              created_at: submission.created_at,
              source: 'visitor' as const
            }));
          allPayments = [...allPayments, ...visitorPayments];
        }

        // Sort payments by monthly payment
        const sortedPayments = allPayments.sort((a, b) => 
          sortOrder === 'asc' ? a.monthly_payment - b.monthly_payment : b.monthly_payment - a.monthly_payment
        );

        if (isMounted) {
          setPayments(sortedPayments);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPayments();

    return () => {
      isMounted = false;
    };
  }, [location.state, navigate, sortOrder, user, formState, visitorId]);

  // Check admin status when user changes
  useEffect(() => {
    let isMounted = true;

    async function checkAdminStatus() {
      if (!user) {
        if (isMounted) {
          setIsAdmin(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_admin');
        if (error) throw error;
        if (isMounted) {
          setIsAdmin(data);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        if (isMounted) {
          setIsAdmin(false);
        }
      }
    }

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const toggleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    const sorted = [...payments].sort((a, b) => 
      newOrder === 'asc' ? a.monthly_payment - b.monthly_payment : b.monthly_payment - a.monthly_payment
    );
    
    setPayments(sorted);
  };

  const handleEditPayment = (payment: CarPayment) => {
    navigate('/compare/new-car-payment/0', {
      state: {
        editData: {
          make: payment.make,
          model: payment.model,
          monthly_payment: payment.monthly_payment.toString(),
          interest_rate: payment.interest_rate.toString(),
          term: payment.term,
          down_payment: payment.down_payment.toString(),
          updated_at: new Date().toISOString()
        }
      }
    });
  };

  const handleDeletePayment = async (payment: CarPayment) => {
    if (!isAdmin) return;

    try {
      if (payment.source === 'user') {
        const { error } = await supabase
          .from('user_responses')
          .update({ deleted: true })  // Soft delete by setting deleted flag
          .eq('id', payment.id)
          .eq('category', 'new-car-payment');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('visitor_submissions')
          .update({ deleted: true })  // Soft delete by setting deleted flag
          .eq('id', payment.id)
          .eq('category', 'new-car-payment');

        if (error) throw error;
      }

      // Remove the deleted payment from the state
      setPayments(prevPayments => prevPayments.filter(p => p.id !== payment.id));
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClearAll = async () => {
    try {
      console.log('Button clicked - starting deletion process...');
      console.log('Current user:', user?.id);
      console.log('Is admin:', isAdmin);

      if (!isAdmin) {
        console.error('User is not an admin');
        return;
      }

      const { success, error } = await clearResults({
        category: 'new-car-payment',
        useStoredProcedure: true,
        procedureName: 'clear_car_payment_data'
      });

      if (!success) {
        console.error('Error clearing car payment data:', error);
        return;
      }

      console.log('All car payment data cleared successfully');
      
      // Clear the local state
      setPayments([]);
      
      // Wait 3 seconds before refreshing to see the logs
      console.log('Waiting 3 seconds before refreshing...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Force a hard refresh
      window.location.reload();
    } catch (error) {
      console.error('Error in deletion process:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    }
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

          {isAdmin && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear All Results
            </button>
          )}
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
                (payment.isUserPayment || payment.isVisitorPayment) ? 'ring-2 ring-theme-300' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-2">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {payment.make} {payment.model}
                    </h3>
                    <p className="text-theme-300">{payment.term}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(payment.isUserPayment || payment.isVisitorPayment) && (
                      <StarIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                    )}
                    {(payment.isUserPayment || payment.isVisitorPayment) && (
                      <button
                        onClick={() => handleEditPayment(payment)}
                        className="p-1 hover:bg-theme-800 rounded-full transition-colors"
                        title="Edit your payment"
                      >
                        <PencilIcon className="h-4 w-4 text-theme-300" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeletePayment(payment)}
                        className="p-1 hover:bg-red-800 rounded-full transition-colors"
                        title="Delete payment"
                      >
                        <XIcon className="h-4 w-4 text-red-400" />
                      </button>
                    )}
                  </div>
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
                <div className="flex justify-between text-xs text-theme-400">
                  <span>Added by {payment.visitor_name}</span>
                  <span>{formatDate(payment.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}