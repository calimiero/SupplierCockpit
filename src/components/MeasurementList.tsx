import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface Measurement {
  id: string;
  value: number;
  measured_at: string;
  quality_parameters: {
    name: string;
    unit: string;
    min_value: number | null;
    max_value: number | null;
  };
  suppliers: {
    name: string;
  };
}

interface Filter {
  startDate: string;
  endDate: string;
  parameter: string;
  status: 'all' | 'within' | 'outside';
}

export function MeasurementList() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [parameters, setParameters] = useState<Array<{ id: string; name: string }>>([]);
  const [filters, setFilters] = useState<Filter>({
    startDate: '',
    endDate: '',
    parameter: '',
    status: 'all',
  });

  useEffect(() => {
    loadParameters();
    loadMeasurements();
  }, [filters]);

  const loadParameters = async () => {
    const { data, error } = await supabase
      .from('quality_parameters')
      .select('id, name');
    
    if (error) {
      console.error('Error loading parameters:', error);
      return;
    }

    setParameters(data || []);
  };

  const loadMeasurements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let query = supabase
        .from('measurements')
        .select(`
          id,
          value,
          measured_at,
          quality_parameters (
            name,
            unit,
            min_value,
            max_value
          ),
          suppliers (
            name
          )
        `)
        .eq('supplier_id', user.id)
        .order('measured_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('measured_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('measured_at', filters.endDate);
      }
      if (filters.parameter) {
        query = query.eq('parameter_id', filters.parameter);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      if (filters.status !== 'all') {
        filteredData = filteredData.filter(measurement => {
          const isWithinLimits =
            (measurement.quality_parameters.min_value === null ||
              measurement.value >= measurement.quality_parameters.min_value) &&
            (measurement.quality_parameters.max_value === null ||
              measurement.value <= measurement.quality_parameters.max_value);
          
          return filters.status === 'within' ? isWithinLimits : !isWithinLimits;
        });
      }

      setMeasurements(filteredData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (measurement: Measurement) => {
    setEditingId(measurement.id);
    setEditValue(measurement.value.toString());
    setUpdateSuccess(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
    setUpdateSuccess(false);
  };

  const handleUpdate = async (measurement: Measurement) => {
    try {
      const newValue = parseFloat(editValue);
      
      if (isNaN(newValue)) {
        throw new Error('Please enter a valid number');
      }

      const { error } = await supabase
        .from('measurements')
        .update({ value: newValue })
        .eq('id', measurement.id);

      if (error) throw error;

      setUpdateSuccess(true);
      setMeasurements(measurements.map(m => 
        m.id === measurement.id ? { ...m, value: newValue } : m
      ));

      // Reset edit state after a short delay
      setTimeout(() => {
        setEditingId(null);
        setEditValue('');
        setUpdateSuccess(false);
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('measurements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMeasurements(measurements.filter(m => m.id !== id));
      setDeletingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading measurements...</div>;
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Measurement History</h2>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Parameter</label>
            <select
              value={filters.parameter}
              onChange={(e) => setFilters({ ...filters, parameter: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Parameters</option>
              {parameters.map((param) => (
                <option key={param.id} value={param.id}>
                  {param.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as Filter['status'] })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All</option>
              <option value="within">Within Limits</option>
              <option value="outside">Outside Limits</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parameter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {measurements.map((measurement) => {
              const isWithinLimits =
                (measurement.quality_parameters.min_value === null ||
                  measurement.value >= measurement.quality_parameters.min_value) &&
                (measurement.quality_parameters.max_value === null ||
                  measurement.value <= measurement.quality_parameters.max_value);

              return (
                <tr key={measurement.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {measurement.quality_parameters.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {measurement.quality_parameters.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === measurement.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          step="any"
                        />
                        <span className="text-sm text-gray-500">
                          {measurement.quality_parameters.unit}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-900">
                        {measurement.value}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(measurement.measured_at), 'PPpp')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isWithinLimits
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isWithinLimits ? 'Within Limits' : 'Out of Limits'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      {editingId === measurement.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(measurement)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                          {updateSuccess && (
                            <span className="text-green-600">Updated!</span>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(measurement)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          {deletingId === measurement.id ? (
                            <>
                              <button
                                onClick={() => handleDelete(measurement.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeletingId(measurement.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}