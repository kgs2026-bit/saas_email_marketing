import { Link } from 'react-router-dom';
import { PlusIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

const CampaignsPage = () => {
  const campaigns = [
    {
      id: '1',
      name: 'Enterprise Outreach Q1 2024',
      status: 'ACTIVE',
      fromName: 'John Doe',
      fromEmail: 'john@company.com',
      steps: 3,
      contacts: 2500,
      sent: 2450,
      opened: 587,
      replies: 98
    },
    {
      id: '2',
      name: 'Product Launch Announcement',
      status: 'PAUSED',
      fromName: 'Sales Team',
      fromEmail: 'sales@company.com',
      steps: 4,
      contacts: 1000,
      sent: 1200,
      opened: 312,
      replies: 45
    },
    {
      id: '3',
      name: 'Enterprise Trial Follow-up',
      status: 'COMPLETED',
      fromName: 'Support',
      fromEmail: 'support@company.com',
      steps: 2,
      contacts: 500,
      sent: 500,
      opened: 142,
      replies: 31
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      ARCHIVED: 'bg-red-100 text-red-800'
    };
    return styles[status] || styles.DRAFT;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600">Manage your email campaigns</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/campaigns/new">
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <MegaphoneIcon className="h-6 w-6 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    From: {campaign.fromName} &lt;{campaign.fromEmail}&gt;
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/campaigns/${campaign.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Edit
                  </Link>
                  <span className="text-gray-300">|</span>
                  <button className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                    {campaign.status === 'ACTIVE' ? 'Pause' : 'Start'}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Sequence Steps</div>
                  <div className="text-lg font-semibold text-gray-900">{campaign.steps}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Contacts</div>
                  <div className="text-lg font-semibold text-gray-900">{campaign.contacts.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Sent</div>
                  <div className="text-lg font-semibold text-gray-900">{campaign.sent.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Replies</div>
                  <div className="text-lg font-semibold text-gray-900">{campaign.replies}</div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {campaigns.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No campaigns</h3>
            <p className="mt-1 text-gray-500">Get started by creating your first campaign.</p>
            <div className="mt-6">
              <Link to="/campaigns/new">
                <Button>Create Campaign</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignsPage;
