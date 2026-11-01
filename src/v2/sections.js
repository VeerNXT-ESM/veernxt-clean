import { GraduationCap, Briefcase, Landmark, Scale } from 'lucide-react';

// The four links in the site header. Learning is the Learning Center page.
export const V2_SECTIONS = [
  { key: 'learning', label: 'Learning', icon: GraduationCap, to: '/learning-center', color: '#1F3A2E', blurb: 'Exams, study material, mock tests and previous year papers.' },
  { key: 'jobs', label: 'Jobs', icon: Briefcase, to: '/jobs', color: '#8a5a12', blurb: 'Government and private sector openings matched to you.' },
  { key: 'finance', label: 'Finance', icon: Landmark, to: '/financial-guidance', color: '#2a4d6e', blurb: 'Plan your money, loans, insurance and goals.' },
  { key: 'legal', label: 'Legal', icon: Scale, to: '/legal-aid', color: '#6b2d3a', blurb: 'Free legal guidance and the Legal Aid Cell.' },
];
