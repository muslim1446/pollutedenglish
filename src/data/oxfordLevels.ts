import { OxfordLevel, OxfordLevelMeta } from '../types';

export const OXFORD_LEVELS: OxfordLevelMeta[] = [
  {
    id: 'all',
    code: 'All',
    name: 'All Levels',
    cefr: 'A1 to C1',
    description: 'Practice with words and phrases across all difficulty levels'
  },
  {
    id: 'A1',
    code: 'A1',
    name: 'Beginner',
    cefr: 'A1',
    description: 'Everyday numbers, simple objects, and common words'
  },
  {
    id: 'A2',
    code: 'A2',
    name: 'Elementary',
    cefr: 'A2',
    description: 'Daily schedules, travel phrases, time, and familiar expressions'
  },
  {
    id: 'B1',
    code: 'B1',
    name: 'Intermediate',
    cefr: 'B1',
    description: 'School conversations, travel announcements, and clear discussions'
  },
  {
    id: 'B2',
    code: 'B2',
    name: 'Upper Intermediate',
    cefr: 'B2',
    description: 'Fast speech, noisy environments, and challenging announcements'
  },
  {
    id: 'C1',
    code: 'C1',
    name: 'Advanced',
    cefr: 'C1',
    description: 'Subtle sound differences, rapid natural speech, and detailed discussions'
  }
];

export function getOxfordLevelMeta(level?: OxfordLevel): OxfordLevelMeta {
  if (!level || level === 'all') return OXFORD_LEVELS[0];
  return OXFORD_LEVELS.find((l) => l.id === level) || OXFORD_LEVELS[0];
}
