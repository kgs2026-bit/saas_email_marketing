import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  PlusIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';

const CampaignDetailPage = () => {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Placeholder data - will fetch from API
  useEffect(() => {
    // Simulate fetch
    setCampaign({
      id: campaignId,
      name: 'Enterprise Outreach Q1 2024',
      status: 'ACTIVE',
      fromName: 'John Doe',
      fromEmail: 'john@company.com',
      subject: 'Quick question about {{company}}',
      body: '<p>Hi {{firstName}},</p><p>I noticed...</p>',
      steps: [
        { stepNumber: 1, subject: 'Quick question', delayDays: 0, delayHours: 0, isEnabled: true },
        { stepNumber: 2, subject: 'Follow-up', delayDays: 3, delayHours: 0, isEnabled: true },
        { stepNumber: 3, subject: 'Final follow-up', delayDays: 5, delayHours: 0, isEnabled: true }
      ],
      stats: {
        totalContacts: 2500,
        sent: 2450,
        opened: 587,
        clicked: 89,
        replied: 98,
        bounced: 25
      }
    });
  }, [campaignId]);

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'steps', name: 'Sequence' },
    { id: 'contacts', name: 'Contacts' },
    { id: 'analytics', name: 'Analytics' }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex text-sm text-gray-500">
        <Link to="/campaigns" className="hover:text-gray-700">Campaigns</Link>
        <ChevronRightIcon className="h-4 w-4 mx-2" />
        <span className="text-gray-900">{campaign.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
          <div className="mt-2 flex items-center space-x-4">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              campaign.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : campaign.status === 'PAUSED'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {campaign.status}
            </span>
            <span className="text-sm text-gray-500">
              From: {campaign.fromName} &lt;{campaign.fromEmail}&gt;
            </span>
          </div>
        </div>
        <div className="mt-4 lg:mt-0 flex space-x-3">
          {campaign.status === 'ACTIVE' ? (
            <Button variant="outline" size="sm">
              <PauseIcon className="h-4 w-4 mr-2" />
              Pause
            </Button>
          ) : (
            <Button size="sm">
              <PlayIcon className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}
          <Button variant="outline" size="sm">
            <StopIcon className="h-4 w-4 mr-2" />
            Stop
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{campaign.stats.totalContacts.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Contacts</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{campaign.stats.sent.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Sent</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{campaign.stats.opened}</div>
                <div className="text-sm text-gray-500">Opened</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{campaign.stats.replied}</div>
                <div className="text-sm text-gray-500">Replies</div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Campaign Stats</h3>
            </CardHeader>
            <CardBody>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4">Opens</td>
                    <td className="px-6 py-4">{campaign.stats.opened}</td>
                    <td className="px-6 py-4">
                      {((campaign.stats.opened / campaign.stats.sent) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Clicks</td>
                    <td className="px-6 py-4">{campaign.stats.clicked}</td>
                    <td className="px-6 py-4">
                      {((campaign.stats.clicked / campaign.stats.sent) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Replies</td>
                    <td className="px-6 py-4">{campaign.stats.replied}</td>
                    <td className="px-6 py-4">
                      {((campaign.stats.replied / campaign.stats.sent) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">Bounces</td>
                    <td className="px-6 py-4">{campaign.stats.bounced}</td>
                    <td className="px-6 py-4">
                      {((campaign.stats.bounced / campaign.stats.sent) * 100).toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'steps' && (
        <Card>
          <CardBody>
            <div className="space-y-4">
              {campaign.steps.map((step: any, index: number) => (
                <div key={step.stepNumber} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500">Step {step.stepNumber}</span>
                        {step.isEnabled ? (
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Active</span>
                        ) : (
                          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Disabled</span>
                        )}
                      </div>
                      <h4 className="mt-1 text-lg font-medium text-gray-900">{step.subject}</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        Delay: {step.delayDays} days {step.delayHours} hours
                      </p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Step
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'contacts' && (
        <Card>
          <CardBody>
            <p className="text-gray-500">Contact list will be displayed here</p>
          </CardBody>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <Card>
          <CardBody>
            <p className="text-gray-500">Detailed analytics will be displayed here</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default CampaignDetailPage;
