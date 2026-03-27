import { Link } from 'react-router-dom';
import { PlusIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

const InboxesPage = () => {
  const inboxes = [
    { id: '1', email: 'sales@company.com', provider: 'GMAIL', isActive: true, sentToday: 45, dailyLimit: 100 },
    { id: '2', email: 'outreach@company.com', provider: 'SMTP', isActive: true, sentToday: 32, dailyLimit: 100 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connected Inboxes</h1>
          <p className="text-gray-600">Manage email accounts for sending</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/inboxes/new">
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Inbox
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inboxes.map((inbox) => (
          <div key={inbox.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <EnvelopeIcon className="h-8 w-8 text-gray-400" />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">{inbox.email}</div>
                  <div className="text-xs text-gray-500">{inbox.provider}</div>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                inbox.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {inbox.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Daily usage</span>
                <span className="font-medium">{inbox.sentToday} / {inbox.dailyLimit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${(inbox.sentToday / inbox.dailyLimit) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}

        {/* Add inbox card */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-500 hover:bg-gray-50">
          <EnvelopeIcon className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Add New Inbox</h3>
          <p className="text-sm text-gray-500 mb-4">Connect Gmail or SMTP to send emails</p>
          <Link to="/inboxes/new">
            <Button variant="outline">Add Inbox</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InboxesPage;
