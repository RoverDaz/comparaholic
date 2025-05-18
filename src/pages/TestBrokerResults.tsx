import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface BrokerInfo {
  id: string;
  form_data: any;
  raw_data: string;
}

export function TestBrokerResults() {
  const [brokers, setBrokers] = useState<BrokerInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrokers() {
      try {
        const { data: responses, error } = await supabase
          .from('user_form_responses')
          .select('*')
          .eq('category', 'real-estate-broker');

        if (error) throw error;

        console.log('Full response data:', responses);

        // Transform and include raw data for debugging
        const transformedBrokers = responses?.map(response => ({
          id: response.id,
          form_data: response.form_data,
          raw_data: JSON.stringify(response.form_data, null, 2)
        })) || [];

        setBrokers(transformedBrokers);
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setLoading(false);
      }
    }

    fetchBrokers();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Test Broker Results</h1>
      <div className="space-y-4">
        {brokers.length === 0 ? (
          <p className="text-theme-300">No brokers found</p>
        ) : (
          brokers.map(broker => (
            <div key={broker.id} className="bg-theme-900 p-4 rounded-lg">
              <p className="text-white">ID: {broker.id}</p>
              <p className="text-white">Form Data:</p>
              <pre className="mt-2 p-4 bg-theme-800 rounded text-sm text-theme-300 overflow-auto">
                {broker.raw_data}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}