import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  MegaphoneIcon,
  UsersIcon,
  EnvelopeIcon,
  ChartBarIcon,
  UserGroupIcon,
  CreditCardIcon,
  CogIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/auth-store';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, workspaces, currentWorkspace, setCurrentWorkspace, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: `/workspace/${currentWorkspace?.slug}/dashboard`, icon: HomeIcon },
    { name: 'Campaigns', href: `/workspace/${currentWorkspace?.slug}/campaigns`, icon: MegaphoneIcon },
    { name: 'Contacts', href: `/workspace/${currentWorkspace?.slug}/contacts`, icon: UsersIcon },
    { name: 'Inboxes', href: `/workspace/${currentWorkspace?.slug}/inboxes`, icon: EnvelopeIcon },
    { name: 'Analytics', href: `/workspace/${currentWorkspace?.slug}/analytics`, icon: ChartBarIcon },
    { name: 'Team', href: `/workspace/${currentWorkspace?.slug}/team`, icon: UserGroupIcon },
    { name: 'Billing', href: `/workspace/${currentWorkspace?.slug}/billing`, icon: CreditCardIcon },
    { name: 'Settings', href: `/workspace/${currentWorkspace?.slug}/settings`, icon: CogIcon }
  ];

  const handleLogout = async () => {
    await logout();
  };

  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const workspace = workspaces.find(w => w.id === e.target.value);
    if (workspace) {
      setCurrentWorkspace(workspace);
      window.location.href = `/workspace/${workspace.slug}/dashboard`;
    }
  };

  if (!user || !currentWorkspace) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                Email Automation
              </h1>
              <select
                value={currentWorkspace.id}
                onChange={handleWorkspaceChange}
                className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name} ({workspace.plan})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.name} ({currentWorkspace.role})
              </span>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
