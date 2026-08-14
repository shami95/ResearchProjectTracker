import React, { useEffect, useMemo, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import { Link } from 'react-router-dom';
import axiosClient, { extractErrorMessage } from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Project, ProjectStatus, Milestone, DocumentItem } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const STAT_ORDER: ProjectStatus[] = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED',
];

interface EnrichedMilestone extends Milestone {
  projectTitle: string;
}

interface EnrichedDocument extends DocumentItem {
  projectTitle: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<EnrichedMilestone[]>([]);
  const [documents, setDocuments] = useState<EnrichedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const projectsRes = await axiosClient.get<Project[]>('/projects');
        setProjects(projectsRes.data);

        const [milestoneLists, documentLists] = await Promise.all([
          Promise.all(
            projectsRes.data.map((p) =>
              axiosClient
                .get<Milestone[]>(`/projects/${p.id}/milestones`)
                .then((res) => res.data.map((m) => ({ ...m, projectTitle: p.title })))
            )
          ),
          Promise.all(
            projectsRes.data.map((p) =>
              axiosClient
                .get<DocumentItem[]>(`/projects/${p.id}/documents`)
                .then((res) => res.data.map((d) => ({ ...d, projectTitle: p.title })))
            )
          ),
        ]);
        setMilestones(milestoneLists.flat());
        setDocuments(documentLists.flat());
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pendingMilestones = useMemo(
    () =>
      milestones
        .filter((m) => !m.isCompleted)
        .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999')),
    [milestones]
  );

  const recentDocuments = useMemo(
    () =>
      [...documents].sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || '')),
    [documents]
  );

  const counts = useMemo(() => {
    const map: Record<ProjectStatus, number> = {
      PLANNING: 0,
      ACTIVE: 0,
      ON_HOLD: 0,
      COMPLETED: 0,
      ARCHIVED: 0,
    };
    projects.forEach((p) => {
      map[p.status] = (map[p.status] || 0) + 1;
    });
    return map;
  }, [projects]);

  const myProjects = useMemo(
    () => projects.filter((p) => p.piId === user?.userId),
    [projects, user]
  );

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5),
    [projects]
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow">Research Dashboard Overview</div>
          <h1>Research at a Glance</h1>
          <p>
            Stay up to date with your latest research activities, progress, and key insights.
          </p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <LoadingSpinner label="Loading dashboard…" />
      ) : (
        <>
          <Row className="g-3 mb-5">
            {STAT_ORDER.map((status) => (
              <Col key={status} xs={6} md={4} lg>
                <Card className={`spine-card stat-card status-${status} h-100`}>
                  <Card.Body>
                    <StatusBadge status={status} />
                    <div className="stat-card-value font-display">{counts[status]}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className="g-4 mb-5 align-items-stretch">
            <Col lg={7} className="dashboard-col">
              <div className="section-label">Recently updated projects</div>
              {recentProjects.length === 0 ? (
                <div className="empty-state">No projects yet.</div>
              ) : (
                <div className="d-flex flex-column gap-2 flex-grow-1">
                  {recentProjects.map((p) => (
                    <Card
                      key={p.id}
                      as={Link}
                      to={`/projects/${p.id}`}
                      className={`spine-card status-${p.status} text-decoration-none text-reset`}
                    >
                      <Card.Body className="d-flex justify-content-between align-items-center">
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.title}</div>
                          <div className="text-muted-2" style={{ fontSize: '0.85rem' }}>
                            PI: {p.piName || '—'}
                          </div>
                        </div>
                        <StatusBadge status={p.status} />
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Col>

            <Col lg={5} className="dashboard-col">
              <div className="section-label">Your projects</div>
              {(user?.role === 'PI' || user?.role === 'ADMIN') ? (
                myProjects.length === 0 ? (
                  <div className="empty-state">
                    You aren't listed as PI on any project yet.
                    <div className="mt-3">
                      <Link to="/projects" className="btn-cta">
                        Create your first project
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2 flex-grow-1">
                    {myProjects.slice(0, 5).map((p) => (
                      <Card key={p.id} as={Link} to={`/projects/${p.id}`} className={`spine-card status-${p.status} text-decoration-none text-reset`}>
                        <Card.Body className="py-2 px-3">
                          <div style={{ fontWeight: 600 }}>{p.title}</div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )
              ) : (
                <div className="empty-state">
                  Browse all projects from the Projects tab. Members can add
                  milestones and upload documents to any project.
                </div>
              )}
            </Col>
          </Row>

          <Row className="g-4 align-items-stretch">
            <Col lg={6} className="dashboard-col">
              <div className="d-flex justify-content-between align-items-baseline">
                <div className="section-label">Milestones</div>
                <Link to="/milestones" className="btn-link-pill">
                  View all
                </Link>
              </div>
              <div className="text-muted-2 mb-2" style={{ fontSize: '0.85rem' }}>
                {pendingMilestones.length} pending · {milestones.length} total
              </div>
              {pendingMilestones.length === 0 ? (
                <div className="empty-state">No pending milestones.</div>
              ) : (
                <div className="d-flex flex-column gap-2 flex-grow-1">
                  {pendingMilestones.slice(0, 5).map((m) => (
                    <Card key={m.id} as={Link} to={`/projects/${m.projectId}`} className="spine-card text-decoration-none text-reset">
                      <Card.Body className="d-flex justify-content-between align-items-center py-2 px-3">
                        <div>
                          <div style={{ fontWeight: 600 }}>{m.title}</div>
                          <div className="text-muted-2" style={{ fontSize: '0.85rem' }}>
                            {m.projectTitle}
                          </div>
                        </div>
                        <div className="text-muted-2" style={{ fontSize: '0.8rem' }}>
                          {m.dueDate ? `Due ${m.dueDate}` : 'No due date'}
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Col>

            <Col lg={6} className="dashboard-col">
              <div className="d-flex justify-content-between align-items-baseline">
                <div className="section-label">Documents</div>
                <Link to="/documents" className="btn-link-pill">
                  View all
                </Link>
              </div>
              <div className="text-muted-2 mb-2" style={{ fontSize: '0.85rem' }}>
                {documents.length} uploaded
              </div>
              {recentDocuments.length === 0 ? (
                <div className="empty-state">No documents uploaded yet.</div>
              ) : (
                <div className="d-flex flex-column gap-2 flex-grow-1">
                  {recentDocuments.slice(0, 5).map((d) => (
                    <Card key={d.id} as={Link} to={`/projects/${d.projectId}`} className="spine-card text-decoration-none text-reset">
                      <Card.Body className="d-flex justify-content-between align-items-center py-2 px-3">
                        <div>
                          <div style={{ fontWeight: 600 }}>{d.title}</div>
                          <div className="text-muted-2" style={{ fontSize: '0.85rem' }}>
                            {d.projectTitle}
                          </div>
                        </div>
                        <div className="text-muted-2" style={{ fontSize: '0.8rem' }}>
                          {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : '—'}
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
