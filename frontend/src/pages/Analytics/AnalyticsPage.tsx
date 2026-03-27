import { useState } from 'react';
import {
  ChartBarIcon,
  EnvelopeIcon,
  UserIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('7d');

  const metrics = {
    totalSent: 15420,
    openRate: 23.5,
    clickRate: 4.2,
    replyRate: 4.2,
    bounceRate: 2.1
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your email performance</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <EnvelopeIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <div className="text-sm text-gray-500">Total Sent</div>
              <div className="text-2xl font-bold text-gray-900">{metrics.totalSent.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <div className="text-sm text-gray-500">Open Rate</div>
              <div className="text-2xl font-bold text-gray-900">{metrics.openRate}%</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ArrowUpIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <div className="text-sm text-gray-500">Click Rate</div>
              <div className="text-2xl font-bold text-gray-900">{metrics.clickRate}%</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <UserIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <div className="text-sm text-gray-500">Reply Rate</div>
              <div className="text-2xl font-bold text-gray-900">{metrics.replyRate}%</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ArrowDownIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <div className="text-sm text-gray-500">Bounce Rate</div>
              <div className="text-2xl font-bold text-gray-900">{metrics.bounceRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Over Time</h3>
          <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
            [Line chart: Opens, Clicks, Replies over time]
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Comparison</h3>
          <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
            [Bar chart: Campaign performance comparison]
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
