import { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

const plans = [
  {
    id: 'FREE',
    name: 'Free Trial',
    price: '$0',
    period: '/month',
    features: [
      '100 emails per day',
      '1 connected inbox',
      'Basic analytics',
      '3 campaigns',
      '100 contacts'
    ]
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: '$19',
    period: '/month',
    features: [
      '1,000 emails per day',
      '3 connected inboxes',
      'Advanced analytics',
      '10 campaigns',
      '1,000 contacts',
      'Team members (3)',
      'Email support'
    ]
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    price: '$49',
    period: '/month',
    features: [
      '5,000 emails per day',
      '10 connected inboxes',
      'Full analytics suite',
      '50 campaigns',
      '10,000 contacts',
      'Team members (10)',
      'Priority support',
      'Custom tracking domain'
    ]
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '$99',
    period: '/month',
    features: [
      'Unlimited emails',
      '50 connected inboxes',
      'Enterprise analytics',
      '200 campaigns',
      '100,000 contacts',
      'Team members (25)',
      '24/7 phone support',
      'Custom tracking domain',
      'API access',
      'Webhooks'
    ]
  }
];

const BillingPage = () => {
  const [currentPlan, setCurrentPlan] = useState<string>('FREE');
  const [subscription, setSubscription] = useState<any>(null);

  // TODO: Fetch subscription data from API

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription and billing information</p>
      </div>

      {/* Current subscription */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {plans.find(p => p.id === currentPlan)?.name}
            </div>
            <div className="text-gray-500">
              {subscription?.status === 'ACTIVE'
                ? `Active until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                : 'Free trial'}
            </div>
          </div>
          <div>
            <span className="text-green-600 font-medium">Active</span>
          </div>
        </div>
      </div>

      {/* Available plans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg border-2 p-6 ${
                currentPlan === plan.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {currentPlan === plan.id ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => {
                      // TODO: Redirect to Stripe checkout
                      console.log(`Upgrade to ${plan.name}`);
                    }}
                  >
                    {plan.id === 'FREE' ? 'Downgrade' : 'Upgrade'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment methods & invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
          <div className="text-gray-500">No payment method on file</div>
          <Button variant="outline" className="mt-4">
            Add Payment Method
          </Button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h2>
          <div className="text-gray-500">No invoices yet</div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
