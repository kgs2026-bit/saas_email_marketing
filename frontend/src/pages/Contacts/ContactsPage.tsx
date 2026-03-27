import { Link } from 'react-router-dom';
import { PlusIcon, UsersIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

const ContactsPage = () => {
  const contacts = [
    { id: '1', email: 'john.doe@company.com', name: 'John Doe', company: 'TechCorp', status: 'ACTIVE' },
    { id: '2', email: 'jane.smith@startup.io', name: 'Jane Smith', company: 'StartupIO', status: 'ACTIVE' },
    { id: '3', email: 'mike.johnson@enterprise.com', name: 'Mike Johnson', company: 'Enterprise Inc', status: 'UNSUBSCRIBED' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600">Manage your contact lists</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link to="/contacts/lists">
            <Button variant="outline">View Lists</Button>
          </Link>
          <Link to="/contacts/upload">
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Contacts
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UsersIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      contact.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {contact.status}
                    </span>
                    <button className="text-gray-400 hover:text-gray-600">
                      {/* More options */}
                    </button>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">{contact.company}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ContactsPage;
