import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormStore } from '../store/formStore';
import { supabase } from '../lib/supabase';

export function TestBrokerForm() {
  const [agency, setAgency] = useState('');
  const [agentName, setAgentName] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setFullFormState } = useFormStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create the form data object with exact key names
      const formData = {
        agency: agency,
        agent_name: agentName,
        commission_rate: commissionRate
      };

      console.log('Submitting form data:', formData);

      // Insert into Supabase
      const { error: supabaseError } = await supabase
        .from('user_form_responses')
        .insert({
          category: 'real-estate-broker',
          form_data: formData
        });

      if (supabaseError) throw supabaseError;

      // Save to form store
      setFullFormState(formData);

      // Navigate to test results
      navigate('/test-broker-results');
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Test Broker Form</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 text-red-200 rounded-md border border-red-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-theme-300 mb-2">
            Agency
          </label>
          <select
            value={agency}
            onChange={(e) => setAgency(e.target.value)}
            className="w-full px-4 py-2 bg-theme-800 text-white rounded-lg border border-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-500"
            required
          >
            <option value="">Select an agency</option>
            <option value="Royal Lepage">Royal Lepage</option>
            <option value="Remax">Remax</option>
            <option value="M Immobilier">M Immobilier</option>
            <option value="Centris">Centris</option>
            <option value="Century21">Century21</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-300 mb-2">
            Agent Name
          </label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full px-4 py-2 bg-theme-800 text-white rounded-lg border border-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-500"
            placeholder="Enter agent name"
            required
            minLength={2}
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-300 mb-2">
            Commission Rate (%)
          </label>
          <select
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            className="w-full px-4 py-2 bg-theme-800 text-white rounded-lg border border-theme-700 focus:outline-none focus:ring-2 focus:ring-theme-500"
            required
          >
            <option value="">Select commission rate</option>
            {Array.from({ length: 29 }, (_, i) => ((i + 4) * 0.25).toFixed(2)).map(rate => (
              <option key={rate} value={rate}>{rate}%</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-theme-500 text-white rounded-lg hover:bg-theme-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Test Form'}
        </button>
      </form>
    </div>
  );
}