import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface QualityParameter {
  id: string;
  name: string;
  unit: string;
  min_value: number | null;
  max_value: number | null;
}

export function MeasurementForm() {
  const [parameters, setParameters] = useState<QualityParameter[]>([]);
  const [selectedParameter, setSelectedParameter] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadParameters();
  }, []);

  const loadParameters = async () => {
    const { data, error } = await supabase
      .from('quality_parameters')
      .select('*');
    
    if (error) {
      console.error('Error loading parameters:', error);
      return;
    }

    setParameters(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase.from('measurements').insert([
        {
          parameter_id: selectedParameter,
          value: parseFloat(value),
          measured_at: new Date().toISOString(),
          supplier_id: user.id,
        },
      ]);

      if (error) throw error;
      setSuccess(true);
      setValue('');
      setSelectedParameter('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Record Measurement</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">
              Measurement recorded successfully!
            </div>
          </div>
        )}
        <div>
          <label htmlFor="parameter" className="block text-sm font-medium text-gray-700">
            Quality Parameter
          </label>
          <select
            id="parameter"
            value={selectedParameter}
            onChange={(e) => setSelectedParameter(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select a parameter</option>
            {parameters.map((param) => (
              <option key={param.id} value={param.id}>
                {param.name} ({param.unit})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="value" className="block text-sm font-medium text-gray-700">
            Measurement Value
          </label>
          <input
            type="number"
            id="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            step="any"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? 'Recording...' : 'Record Measurement'}
        </button>
      </form>
    </div>
  );
}