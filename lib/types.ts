export type FindingStatus = 'Reported' | 'Acknowledged' | 'Fix in progress' | 'Resolved';
export type Severity = 'High' | 'Medium' | 'Low';
export type ExperimentStatus = 'Running' | 'Planning' | 'Complete' | 'Blocked' | 'Reported';
export type MilestoneStatus = 'Complete' | 'In Progress' | 'Upcoming';

export interface ResolutionStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  completedDate?: string;
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  site: string;
  severity: Severity;
  status: FindingStatus;
  category: string;
  addedBy: string;
  dateAdded: string;
  lastUpdated: string;
  images: string[];
  resolutionSteps: ResolutionStep[];
  isPinned: boolean;
  relatedFindingIds: string[];
}

export interface ExperimentMetric {
  label: string;
  value: string;
  subtext?: string;
  inProgress?: boolean;
}

export interface Experiment {
  id: string;
  title: string;
  status: ExperimentStatus;
  owner: string;
  lastUpdated: string;
  startDate: string;
  site: string;
  category: string;
  severity: string;
  addedBy: string;
  hypothesis: string;
  approach: string;
  metrics: ExperimentMetric[];
  outcome: string;
  outcomeStatus: 'Pending' | 'Confirmed' | 'Failed';
  relatedFindingIds: string[];
}

export interface TimelinePhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  color: string;
  status: 'completed' | 'in_progress' | 'upcoming';
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  status: MilestoneStatus;
  description: string;
  isHighlighted?: boolean;
}

export interface ShareLink {
  id: string;
  name: string;
  slug: string;
  password: string;
  sections: {
    overview: boolean;
    findings: boolean;
    experiments: boolean;
    timeline: boolean;
  };
  createdDate: string;
  lastAccessed?: string;
}

export interface DataStore {
  findings: Finding[];
  experiments: Experiment[];
  shareLinks: ShareLink[];
  seenFindings: Record<string, string[]>;
  timelinePhases: TimelinePhase[];
  milestones: Milestone[];
}
