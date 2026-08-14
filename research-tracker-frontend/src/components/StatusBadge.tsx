import React from 'react';
import { ProjectStatus } from '../types';

const LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  return (
    <span className={`status-badge status-${status}`}>{LABELS[status]}</span>
  );
};

export default StatusBadge;
