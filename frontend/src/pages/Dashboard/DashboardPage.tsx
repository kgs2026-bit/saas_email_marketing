import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  EnvelopeIcon,
  MegaphoneIcon,
  UsersIcon,
  TrendingUpIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/auth-store';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const DashboardPage = () => {
  const { currentWorkspace } = useAuthStore();
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalInboxes: 0,
    totalContacts: 0,
    emailsSent: 0,
    openRate: 0,
    replyRate: 0
  });
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);

  // TODO: Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      // Placeholder data
      setStats({
        totalCampaigns: 12,
        activeCampaigns: 3,
        totalInboxes: 2,
        totalContacts: 1250,
        emailsSent: 15420,
        openRate: 23.5,
        replyRate: 4.2
      });

      setRecentCampaigns([
        {
          id: '1',
          name: 'Enterprise Outreach Q1 2024',
          status: 'ACTIVE',
          sent: 2450,
          opened: 587,
          replies: 98
        },
        {
          id: '2',
          name: 'Product Launch Announcement',
          status: 'PAUSED',
          sent: 1200,
          opened: 312,
          replies: 45
        },
        {
          id: '3',
          name: 'Enterprise Trial Follow-up',
          status: 'COMPLETED',
          sent: 500,
          opened: 142,
          replies: 31
        }
      ]);
    };

    fetchData();
  }, []);

  const statCards = [
    {
      name: 'Total Campaigns',
      value: stats.totalCampaigns,
      icon: MegaphoneIcon,
      color: 'bg-blue-500',
      link: '/campaigns'
    },
    {
      name: 'Active Campaigns',
      value: stats.activeCampaigns,
      icon: MegaphoneIcon,
      color: 'bg-green-500',
      link: '/campaigns?status=ACTIVE'
    },
    {
      name: 'Connected Inboxes',
      value: stats.totalInboxes,
      icon: EnvelopeIcon,
      color: 'bg-purple-500',
      link: '/inboxes'
    },
    {
      name: 'Total Contacts',
      value: stats.totalContacts.toLocaleString(),
      icon: UsersIcon,
      color: 'bg-orange-500',
      link: '/contacts'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome {useAuthStore().user?.name} to {currentWorkspace?.name}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-x-3">
          <Link to="/campaigns/new">
            <Button>New Campaign</Button>
          </Link>
          <Link to="/inboxes/new">
            <Button variant="outline">Add Inbox</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.name} to={stat.link}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardBody className="flex items-center">
                <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                  <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">{stat.name}</div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Performance Overview</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-500">Total Emails Sent</div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.emailsSent.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Open Rate</div>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-gray-900">{stats.openRate}%</span>
                  <TrendingUpIcon className="ml-2 h-5 w-5 text-green-500" />
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Reply Rate</div>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-gray-900">{stats.replyRate}%</span>
                  <TrendingUpIcon className="ml-2 h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>

            {/* Placeholder for chart */}
            <div className="mt-6 p-8 bg-gray-50 rounded-md text-center text-gray-500">
              Open rate and reply rate chart will be displayed here
            </div>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <Link to="/campaigns/new">
              <Button variant="outline" className="w-full justify-start">
                <MegaphoneIcon className="h-5 w-5 mr-3" />
                Create New Campaign
              </Button>
            </Link>
            <Link to="/contacts/upload">
              <Button variant="outline" className="w-full justify-start">
                <UsersIcon className="h-5 w-5 mr-3" />
                Upload Contacts
              </Button>
            </Link>
            <Link to="/inboxes/new">
              <Button variant="outline" className="w-full justify-start">
                <EnvelopeIcon className="h-5 w-5 mr-3" />
                Add New Inbox
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUpIcon className="h-5 w-5 mr-3" />
                View Analytics
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Campaigns</h2>
          <Link to="/campaigns" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opened
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Replies
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentCampaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      campaign.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : campaign.status === 'PAUSED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.sent.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.opened.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.replies.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/campaigns/${campaign.id}`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
