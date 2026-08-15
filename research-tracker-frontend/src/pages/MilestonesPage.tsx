import React, { useEffect, useMemo, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { Link } from 'react-router-dom';
import axiosClient, { extractErrorMessage } from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Project, Milestone } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

interface EnrichedMilestone extends Milestone {
  projectTitle: string;
}

const MilestonesPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<EnrichedMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');

  const [showModal, setShowModal] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const canCreate = user?.role === 'MEMBER' || user?.role === 'PI' || user?.role === 'ADMIN';

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectsRes = await axiosClient.get<Project[]>('/projects');
      setProjects(projectsRes.data);
      const results = await Promise.all(
        projectsRes.data.map((p) =>
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

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const list = milestones.filter((m) => {
      if (filter === 'PENDING') return !m.isCompleted;
      if (filter === 'COMPLETED') return m.isCompleted;
      return true;
    });
    return list.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  }, [milestones, filter]);

  const openModal = () => {
    setTargetProjectId(projects[0]?.id || '');
    setTitle('');
    setDescription('');
    setDueDate('');
    setModalError(null);
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProjectId) {
      setModalError('Please choose a project.');
      return;
    }
    setSubmitting(true);
    setModalError(null);
    try {
      await axiosClient.post(`/projects/${targetProjectId}/milestones`, {
        title,
        description,
        dueDate: dueDate || null,
      });
      setShowModal(false);
      loadAll();
    } catch (err) {
      setModalError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow">Across all projects</div>
          <h1>Milestones</h1>
          <p>Every milestone tracked across the institute's research projects.</p>
        </div>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <Form.Select
            style={{ width: 180 }}
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="PENDING">Pending only</option>
            <option value="COMPLETED">Completed only</option>
            <option value="ALL">All milestones</option>
          </Form.Select>
          {canCreate && (
            <Button className="btn-gold" onClick={openModal} disabled={projects.length === 0}>
              + Add milestone
            </Button>
          )}
        </div>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleCreate}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: '1.1rem' }}>Add milestone</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}
            <Form.Group className="mb-3" controlId="globalMilestoneProject">
              <Form.Label>Project</Form.Label>
              <Form.Select
                required
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId="globalMilestoneTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control required value={title} onChange={(e) => setTitle(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="globalMilestoneDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="globalMilestoneDueDate">
              <Form.Label>Due date</Form.Label>
              <Form.Control
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Spinner animation="border" size="sm" /> : 'Add milestone'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default MilestonesPage;
