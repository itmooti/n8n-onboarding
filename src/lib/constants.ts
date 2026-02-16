import type { PlanInfo, PhaseInfo } from '../types/onboarding';

export const PLANS: Record<string, PlanInfo> = {
  essentials: {
    key: 'essentials',
    name: 'Essentials',
    price: 75,
    yearlyPrice: 63,
    color: '#0f1128',
    features: [
      'Fully managed infrastructure',
      'Automated backups',
      'Maintenance & Reliability',
      'Managed environment',
    ],
  },
  'support-plus': {
    key: 'support-plus',
    name: 'Support Plus',
    price: 175,
    yearlyPrice: 146,
    color: '#0f1128',
    features: [
      'Everything in Essentials',
      'AI-powered support',
      'Ticketed troubleshooting',
      'Workflow design help',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Automations Pro',
    price: 375,
    yearlyPrice: 313,
    color: '#e9484d',
    features: [
      'Everything in Support Plus',
      '1 Built Workflow / Mo',
      'We monitor everything 24/7',
      'Performance reports',
    ],
  },
  embedded: {
    key: 'embedded',
    name: 'Embedded Team',
    price: 3500,
    yearlyPrice: 2917,
    color: '#ef9563',
    features: [
      'Dedicated Architect',
      'Continuous Optimisation',
      'Advanced AI features',
      'No per-workflow costs',
    ],
  },
};

export const PHASES: PhaseInfo[] = [
  { label: 'Business Discovery', steps: [1, 2, 3] },
  { label: 'Package Fit', steps: [4, 5, 6] },
  { label: 'Add-Ons', steps: [7, 8, 9, 10, 11, 12, 13] },
  { label: 'Business Profile', steps: [14, 15] },
  { label: 'Confirmation', steps: [16] },
];

export const TOTAL_STEPS = 16;

export const AUTOMATION_AREAS = [
  { icon: 'Mail', label: 'Email & Communications' },
  { icon: 'Smartphone', label: 'Social Media' },
  { icon: 'Bot', label: 'AI Chat Agents' },
  { icon: 'BarChart3', label: 'Reporting & Analytics' },
  { icon: 'DollarSign', label: 'Invoicing & Payments' },
  { icon: 'Users', label: 'Lead Management & CRM' },
  { icon: 'FileText', label: 'Document Processing' },
  { icon: 'RefreshCw', label: 'Data Sync Between Apps' },
  { icon: 'Calendar', label: 'Scheduling & Calendars' },
  { icon: 'ShoppingCart', label: 'E-Commerce & Orders' },
  { icon: 'Target', label: 'Marketing Campaigns' },
  { icon: 'Phone', label: 'Customer Support' },
  { icon: 'UserCheck', label: 'HR & Onboarding' },
  { icon: 'Lock', label: 'Compliance & Approvals' },
  { icon: 'Package', label: 'Inventory & Supply Chain' },
  { icon: 'Brain', label: 'AI Content Creation' },
  { icon: 'Link', label: 'API & Integrations' },
  { icon: 'MessageSquare', label: 'Team Notifications' },
];

export const ROLES = [
  'Sales',
  'Marketing',
  'Operations',
  'Customer Support',
  'Finance',
  'HR',
  'IT',
  'Executive',
  'Other',
];

export const BOOKING_URL = 'https://itmooti.com/15#/?month=2026-02';
