import React, { useEffect, useMemo, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import { Link } from 'react-router-dom';
import axiosClient, { extractErrorMessage } from '../api/axiosClient';
import { Project, Milestone } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

interface EnrichedMilestone extends Milestone {
  projectTitle: string;
}

const MilestonesPage: React.FC = () => {
  const [milestones, setMilestones] = useState<EnrichedMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');

  useEffect(() => {
    const load = async () => {
      try {
        const projectsRes = await axiosClient.get<Project[]>('/projects');
        const projects = projectsRes.data;
        const results = await Promise.all(
          projects.map((p) =>
            axiosClient
              .get<Milestone[]>(`/projects/${p.id}/milestones`)
              .then((res) => res.data.map((m) => ({ ...m, projectTitle: p.title })))
          )
        );
        setMilestones(results.flat());
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const list = milestones.filter((m) => {
      if (filter === 'PENDING') return !m.isCompleted;
      if (filter === 'COMPLETED') return m.isCompleted;
      return true;
    });
    return list.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  }, [milestones, filter]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow">Across all projects</div>
          <h1>Milestones</h1>
          <p>Every milestone tracked across the institute's research projects.</p>
        </div>
        <Form.Select
          style={{ width: 200 }}
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="PENDING">Pending only</option>
          <option value="COMPLETED">Completed only</option>
          <option value="ALL">All milestones</option>
        </Form.Select>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <LoadingSpinner label="Gathering milestones…" />
      ) : filtered.length === 0 ? (
        <div className="empty-state">Nothing to show here.</div>
      ) : (
        <Table hover responsive className="bg-white" style={{ borderRadius: 10, overflow: 'hidden' }}>
          <thead>
            <tr>
              <th>Status</th>
              <th>Milestone</th>
              <th>Project</th>
              <th>Due date</th>
              <th>Added by</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td>{m.isCompleted ? '✅' : '⏳'}</td>
                <td style={{ textDecoration: m.isCompleted ? 'line-through' : 'none' }}>{m.title}</td>
                <td>
                  <Link to={`/projects/${m.projectId}`}>{m.projectTitle}</Link>
                </td>
                <td>{m.dueDate || '—'}</td>
                <td>{m.createdByName || '—'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default MilestonesPage;
