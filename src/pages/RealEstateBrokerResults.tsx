import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon, StarIcon, PencilIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormStore } from '../store/formStore';
import { supabase } from '../lib/supabase';

interface BrokerInfo {
  id: string;
  agency: string;
  agent_name: string;
  commission_rate: number;
  isUserBroker?: boolean;
  user_id?: string;
}

export function RealEstateBrokerResults() {
  const [brokers, setBrokers] = useState<BrokerInfo[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formState } = useFormStore();

  useEffect(() => {
    const isSkipped = location.state?.skip === true;
    console.log('Results page initialized', { isSkipped, hasFormState: Object.keys(formState).length > 0 });

    if (!isSkipped && Object.keys(formState).length === 0) {
      console.log('No form data found, redirecting to form');
      navigate('/compare/real-estate-broker/0');
      return;
    }

    const fetchBrokers = async () => {
      try {
        // Fetch both user form responses and visitor submissions
        const { data: responses, error } = await supabase
          .from('user_form_responses')
          .select('*')
          .eq('category', 'real-estate-broker')
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('Raw responses:', responses);

        let allBrokers: BrokerInfo[] = [];

        // Transform responses into BrokerInfo objects
        if (responses) {
          const transformedBrokers = responses
            .filter(response => 
              response.form_data &&
              response.form_data.agency &&
              response.form_data.agent_name &&
              response.form_data.commission_rate
            )
            .map(response => ({
              id: response.id,
              agency: response.form_data.agency,
              agent_name: response.form_data.agent_name,
              commission_rate: parseFloat(response.form_data.commission_rate),
              isUserBroker: user?.id === response.user_id,
              user_id: response.user_id
            }));

          console.log('Transformed brokers:', transformedBrokers);
          allBrokers = transformedBrokers;
        }

        // Sort brokers by commission rate
        const sortedBrokers = allBrokers.sort((a, b) => 
          sortOrder === 'asc' ? a.commission_rate - b.commission_rate : b.commission_rate - a.commission_rate
        );

        setBrokers(sortedBrokers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching brokers:', error);
        setLoading(false);
      }
    };

    fetchBrokers();
  }, [location.state, navigate, sortOrder, user, formState]);

  const toggleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    
    const sorted = [...brokers].sort((a, b) => 
      newOrder === 'asc' ? a.commission_rate - b.commission_rate : b.commission_rate - a.commission_rate
    );
    
    setBrokers(sorted);
  };

  const handleEditBroker = () => {
    navigate('/compare/real-estate-broker/0?edit=true');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-300 mx-auto"></div>
          <p className="mt-4 text-theme-300">Loading broker information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Real Estate Broker Comparison</h1>
        
        <button
          onClick={toggleSort}
          className="flex items-center px-4 py-2 bg-theme-800 text-white rounded-lg hover:bg-theme-700"
        >
          Sort by Commission Rate
          {sortOrder === 'asc' ? (
            <ArrowUpIcon className="ml-2 h-4 w-4" />
          ) : (
            <ArrowDownIcon className="ml-2 h-4 w-4" />
          )}
        </button>
      </div>

      {brokers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-theme-300">No broker information available yet. Be the first to add yours!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brokers.map(broker => (
            <div 
              key={broker.id} 
              className={`bg-theme-900 rounded-lg p-6 ${
                broker.isUserBroker ? 'ring-2 ring-theme-300' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-2">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{broker.agent_name}</h3>
                    <p className="text-theme-300">{broker.agency}</p>
                    {broker.isUserBroker && (
                      <p className="text-sm text-theme-400">Your current broker</p>
                    )}
                  </div>
                  {broker.isUserBroker && (
                    <div className="flex items-center space-x-2">
                      <StarIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                      <button
                        onClick={handleEditBroker}
                        className="p-1 hover:bg-theme-800 rounded-full transition-colors"
                        title="Edit your broker information"
                      >
                        <PencilIcon className="h-4 w-4 text-theme-300" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {broker.commission_rate.toFixed(2)}%
                  </p>
                  <p className="text-theme-300">commission rate</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-theme-200">
                <div className="flex justify-between">
                  <span>Agency</span>
                  <span>{broker.agency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Commission on $500k</span>
                  <span>${((broker.commission_rate / 100) * 500000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}