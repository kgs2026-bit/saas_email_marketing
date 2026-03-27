import { useState } from 'react';
import { UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

const TeamPage = () => {
  const [teamMembers] = useState([
    { id: '1', name: 'John Doe', email: 'john@company.com', role: 'ADMIN', joinedAt: '2024-01-15' },
    { id: '2', name: 'Jane Smith', email: 'jane@company.com', role: 'MEMBER', joinedAt: '2024-02-01' },
    { id: '3', name: 'Mike Johnson', email: 'mike@company.com', role: 'MEMBER', joinedAt: '2024-02-15' }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600">Manage your workspace team</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button>
            <PlusIcon className="h-5 w-5 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {teamMembers.map((member) => (
            <li key={member.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-600">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      member.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                    <span className="text-sm text-gray-500">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                    {member.role !== 'ADMIN' && (
                      <button className="text-gray-400 hover:text-gray-600">
                        {/* More options */}
                      </button>
                    )}
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

export default TeamPage;
