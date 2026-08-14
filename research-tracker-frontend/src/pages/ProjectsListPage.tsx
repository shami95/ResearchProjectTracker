import React, { useEffect, useMemo, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Link } from 'react-router-dom';
import axiosClient, { extractErrorMessage } from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Project, ProjectStatus, PROJECT_STATUSES } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const ProjectsListPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');

  const canCreate = user?.role === 'PI' || user?.role === 'ADMIN';

  useEffect(() => {
    axiosClient
      .get<Project[]>('/projects')
      .then((res) => setProjects(res.data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.tags || '').toLowerCase().includes(q) ||
        (p.piName || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [projects, search, statusFilter]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow">Research Projects</div>
          <h1>Projects</h1>
          <p>Browse and manage every project tracked in the system.</p>
        </div>
        {canCreate && (
          <Button as={Link as any} to="/projects/new" className="btn-gold">
            + New project
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-2 mb-4">
        <Col md={7}>
          <Form.Control
            type="search"
            placeholder="Search by title, tag, or PI…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
        <Col md={5}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'ALL')}
          >
            <option value="ALL">All statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {loading ? (
        <LoadingSpinner label="Loading projects…" />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          No projects match your filters.
        </div>
      ) : (
        <Row className="g-3">
          {filtered.map((p) => (
            <Col md={6} key={p.id}>
              <Card
                as={Link}
                to={`/projects/${p.id}`}
                className={`spine-card status-${p.status} text-decoration-none text-reset h-100`}
              >
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="mb-0" style={{ fontSize: '1.1rem' }}>
                      {p.title}
                    </Card.Title>
                    <StatusBadge status={p.status} />
                  </div>
                  <Card.Text className="text-muted-2" style={{ fontSize: '0.9rem' }}>
                    {p.summary?.slice(0, 140) || 'No summary provided.'}
                    {p.summary && p.summary.length > 140 ? '…' : ''}
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center mt-3" style={{ fontSize: '0.82rem' }}>
                    <span className="text-muted-2">PI: {p.piName || '—'}</span>
                    <span className="text-muted-2">
                      {p.tags ? p.tags.split(',').slice(0, 3).join(' · ') : ''}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default ProjectsListPage;
