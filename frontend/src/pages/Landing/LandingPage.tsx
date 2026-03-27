import { Link } from 'react-router-dom';
import { ChevronRightIcon, SparklesIcon, RocketLaunchIcon, ChartBarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

const LandingPage = () => {
  const features = [
    {
      name: 'Human-Like Sending',
      description: 'Random delays, sending windows, and smart rotation to maximize deliverability and avoid spam filters.',
      icon: SparklesIcon
    },
    {
      name: 'Multi-Inbox Support',
      description: 'Connect multiple Gmail accounts and SMTP inboxes. Automatically rotate between them.',
      icon: RocketLaunchIcon
    },
    {
      name: 'Advanced Analytics',
      description: 'Track opens, clicks, replies, and bounces in real-time. Detailed reports and insights.',
      icon: ChartBarIcon
    },
    {
      name: 'Secure & Compliant',
      description: 'Encrypted credentials, GDPR-ready, and secure multi-tenant architecture.',
      icon: ShieldCheckIcon
    }
  ];

  const plans = [
    {
      name: 'Free Trial',
      price: '$0',
      period: '/month',
      description: 'Perfect for testing the platform',
      features: [
        '100 emails per day',
        '1 connected inbox',
        'Basic analytics',
        '3 campaigns',
        '100 contacts'
      ],
      cta: 'Start Free Trial',
      href: '/register'
    },
    {
      name: 'Starter',
      price: '$19',
      period: '/month',
      description: 'For small teams getting started',
      features: [
        '1,000 emails per day',
        '3 connected inboxes',
        'Advanced analytics',
        '10 campaigns',
        '1,000 contacts',
        'Team members (3)',
        'Email support'
      ],
      cta: 'Get Started',
      href: '/register',
      popular: true
    },
    {
      name: 'Growth',
      price: '$49',
      period: '/month',
      description: 'For growing businesses',
      features: [
        '5,000 emails per day',
        '10 connected inboxes',
        'Full analytics suite',
        '50 campaigns',
        '10,000 contacts',
        'Team members (10)',
        'Priority support',
        'Custom tracking domain'
      ],
      cta: 'Get Started',
      href: '/register'
    },
    {
      name: 'Pro',
      price: '$99',
      period: '/month',
      description: 'For high-volume senders',
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
      ],
      cta: 'Get Started',
      href: '/register'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Sales Lead, TechStart Inc.',
      content: 'This platform has completely transformed our outbound sales. Our reply rates went from 2% to 8% in just 2 weeks.',
      avatar: 'SJ'
    },
    {
      name: 'Michael Chen',
      role: 'Founder, GrowthLabs',
      content: 'The automation features are incredible. I can run multiple campaigns with different sequences and track everything from one dashboard.',
      avatar: 'MC'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Marketing Manager, ScaleCo',
      content: 'Best investment we\'ve made. The multi-inbox rotation keeps our deliverability high and the analytics help us optimize continuously.',
      avatar: 'ER'
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero section */}
      <header className="relative bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Automate Your Cold Email Outreach
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Send automated emails with human-like patterns. Maximize deliverability, track performance,
              and scale your outreach like never before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-100 w-full sm:w-auto">
                  Start Free Trial
                  <ChevronRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 w-full sm:w-auto"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale Your Outreach
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features built for modern sales and marketing teams.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-gray-900">{feature.name}</h3>
                </div>
                <p className="text-gray-600 ml-14">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Choose the plan that fits your needs. All plans include a 14-day free trial.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg shadow-lg p-8 relative ${
                  plan.popular
                    ? 'border-2 border-primary-500 transform scale-105'
                    : 'border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-primary-500 text-white text-sm font-bold px-4 py-2 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <ChevronRightIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to={plan.href} className="block">
                  <Button variant={plan.popular ? 'primary' : 'outline'} className="w-full">
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by Sales Teams Worldwide
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-semibold text-lg">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Supercharge Your Outreach?
          </h2>
          <p className="text-xl text-primary-200 mb-8">
            Join thousands of companies already using our platform.
          </p>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-white text-primary-700 hover:bg-gray-100"
            >
              Get Started Free
              <ChevronRightIcon className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Email Automation</h3>
              <p className="text-gray-400">
                The smartest way to automate your cold email outreach.
              </p>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-gray-400 hover:text-white">Features</Link></li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
                <li><Link to="/integrations" className="text-gray-400 hover:text-white">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link to="/blog" className="text-gray-400 hover:text-white">Blog</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Email Automation SaaS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
