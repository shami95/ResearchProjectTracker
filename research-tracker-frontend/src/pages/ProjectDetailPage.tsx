import React, { useCallback, useEffect, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosClient, { API_BASE_URL, extractErrorMessage } from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import {
  Project,
  Milestone,
  MilestoneRequest,
  DocumentItem,
  ProjectStatus,
  PROJECT_STATUSES,
} from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const emptyMilestoneForm: MilestoneRequest = {
  title: '',
  description: '',
  dueDate: null,
  isCompleted: false,
};

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  // Milestone modal state
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [milestoneForm, setMilestoneForm] = useState<MilestoneRequest>(emptyMilestoneForm);
  const [milestoneSubmitting, setMilestoneSubmitting] = useState(false);
  const [milestoneError, setMilestoneError] = useState<string | null>(null);

  // Document upload modal state
  const [showDocModal, setShowDocModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const isOwnerPi = !!project && project.piId === user?.userId;
  const canEditProject = isAdmin || isOwnerPi;
  const canCreateMilestoneOrDoc =
    user?.role === 'MEMBER' || user?.role === 'PI' || user?.role === 'ADMIN';

  const loadAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [projectRes, milestonesRes, documentsRes] = await Promise.all([
        axiosClient.get<Project>(`/projects/${id}`),
        axiosClient.get<Milestone[]>(`/projects/${id}/milestones`),
        axiosClient.get<DocumentItem[]>(`/projects/${id}/documents`),
      ]);
      setProject(projectRes.data);
      setMilestones(milestonesRes.data);
      setDocuments(documentsRes.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleStatusChange = async (status: ProjectStatus) => {
    if (!id) return;
    setStatusUpdating(true);
    try {
      const res = await axiosClient.patch<Project>(`/projects/${id}/status`, { status });
      setProject(res.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    if (!window.confirm('Delete this project permanently? This cannot be undone.')) return;
    setDeletingProject(true);
    try {
      await axiosClient.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      setError(extractErrorMessage(err));
      setDeletingProject(false);
    }
  };

  // ---------- Milestones ----------

  const openCreateMilestone = () => {
    setEditingMilestoneId(null);
    setMilestoneForm(emptyMilestoneForm);
    setMilestoneError(null);
    setShowMilestoneModal(true);
  };

  const openEditMilestone = (m: Milestone) => {
    setEditingMilestoneId(m.id);
    setMilestoneForm({
      title: m.title,
      description: m.description || '',
      dueDate: m.dueDate,
      isCompleted: m.isCompleted,
    });
    setMilestoneError(null);
    setShowMilestoneModal(true);
  };

  const submitMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setMilestoneSubmitting(true);
    setMilestoneError(null);
    try {
      if (editingMilestoneId) {
        await axiosClient.put(`/milestones/${editingMilestoneId}`, milestoneForm);
      } else {
        await axiosClient.post(`/projects/${id}/milestones`, milestoneForm);
      }
      setShowMilestoneModal(false);
      loadAll();
    } catch (err) {
      setMilestoneError(extractErrorMessage(err));
    } finally {
      setMilestoneSubmitting(false);
    }
  };

  const toggleMilestoneComplete = async (m: Milestone) => {
    try {
      await axiosClient.put(`/milestones/${m.id}`, {
        title: m.title,
        description: m.description,
        dueDate: m.dueDate,
        isCompleted: !m.isCompleted,
      });
      loadAll();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const deleteMilestone = async (milestoneId: string) => {
    if (!window.confirm('Delete this milestone?')) return;
    try {
      await axiosClient.delete(`/milestones/${milestoneId}`);
      loadAll();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const canModifyMilestone = (m: Milestone) =>
    isAdmin || isOwnerPi || m.createdById === user?.userId;

  // ---------- Documents ----------

  const openUploadDoc = () => {
    setDocTitle('');
    setDocDescription('');
    setDocFile(null);
    setDocError(null);
    setShowDocModal(true);
  };

  const submitDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!docFile) {
      setDocError('Please choose a file to upload.');
      return;
    }
    setDocSubmitting(true);
    setDocError(null);
    try {
      const formData = new FormData();
      formData.append('title', docTitle);
      formData.append('description', docDescription);
      formData.append('file', docFile);
      await axiosClient.post(`/projects/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowDocModal(false);
      loadAll();
    } catch (err) {
      setDocError(extractErrorMessage(err));
    } finally {
      setDocSubmitting(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await axiosClient.delete(`/documents/${docId}`);
      loadAll();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSpinner fullPage label="Loading project…" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="page-container">
        <Alert variant="danger">{error}</Alert>
        <Link to="/projects">← Back to projects</Link>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="page-container">
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      <div className="page-header">
        <div>
          <div className="eyebrow">Project</div>
          <h1>{project.title}</h1>
          <p>
            PI: {project.piName || '—'} · {project.startDate || 'No start date'} to{' '}
            {project.endDate || 'ongoing'}
          </p>
        </div>
        <div className="d-flex gap-2 align-items-start flex-wrap">
          <StatusBadge status={project.status} />
          {canEditProject && (
            <Form.Select
              size="sm"
              style={{ width: 160 }}
              value={project.status}
              disabled={statusUpdating}
              onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  Set: {s.replace('_', ' ')}
                </option>
              ))}
            </Form.Select>
          )}
          {canEditProject && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => navigate(`/projects/${project.id}/edit`)}
            >
              Edit
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="outline-danger"
              size="sm"
              disabled={deletingProject}
              onClick={handleDeleteProject}
            >
              {deletingProject ? 'Deleting…' : 'Delete'}
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <Card.Text>{project.summary || 'No summary provided.'}</Card.Text>
          {project.tags && (
            <div className="d-flex gap-2 flex-wrap mt-2">
              {project.tags.split(',').map((t) => (
                <Badge key={t} bg="light" text="dark" style={{ border: '1px solid var(--color-border)' }}>
                  {t.trim()}
                </Badge>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      <Row className="g-4">
        {/* Milestones */}
        <Col lg={6}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="section-label mb-0">Milestones</div>
            {canCreateMilestoneOrDoc && (
              <Button size="sm" className="btn-primary" onClick={openCreateMilestone}>
                + Add milestone
              </Button>
            )}
          </div>

          {milestones.length === 0 ? (
            <div className="empty-state">No milestones yet.</div>
          ) : (
            <ListGroup>
              {milestones
                .slice()
                .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
                .map((m) => (
                  <ListGroup.Item key={m.id} className="d-flex justify-content-between align-items-start gap-2">
                    <div className="flex-grow-1">
                      <Form.Check
                        type="checkbox"
                        checked={m.isCompleted}
                        disabled={!canModifyMilestone(m)}
                        onChange={() => toggleMilestoneComplete(m)}
                        label={
                          <span style={{ textDecoration: m.isCompleted ? 'line-through' : 'none' }}>
                            <strong>{m.title}</strong>
                          </span>
                        }
                      />
                      {m.description && (
                        <div className="text-muted-2 ms-4" style={{ fontSize: '0.85rem' }}>
                          {m.description}
                        </div>
                      )}
                      <div className="text-muted-2 ms-4" style={{ fontSize: '0.78rem' }}>
                        {m.dueDate ? `Due ${m.dueDate}` : 'No due date'} · Added by {m.createdByName || '—'}
                      </div>
                    </div>
                    {canModifyMilestone(m) && (
                      <div className="d-flex gap-1 flex-shrink-0">
                        <Button variant="outline-secondary" size="sm" onClick={() => openEditMilestone(m)}>
                          Edit
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => deleteMilestone(m.id)}>
                          Delete
                        </Button>
                      </div>
                    )}
                  </ListGroup.Item>
                ))}
            </ListGroup>
          )}
        </Col>

        {/* Documents */}
        <Col lg={6}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="section-label mb-0">Documents</div>
            {canCreateMilestoneOrDoc && (
              <Button size="sm" className="btn-primary" onClick={openUploadDoc}>
                + Upload document
              </Button>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="empty-state">No documents uploaded yet.</div>
          ) : (
            <ListGroup>
              {documents.map((d) => (
                <ListGroup.Item key={d.id} className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <a
                      href={`${API_BASE_URL}${d.urlOrPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontWeight: 600 }}
                    >
                      {d.title}
                    </a>
                    {d.description && (
                      <div className="text-muted-2" style={{ fontSize: '0.85rem' }}>
                        {d.description}
                      </div>
                    )}
                    <div className="text-muted-2" style={{ fontSize: '0.78rem' }}>
                      Uploaded by {d.uploadedByName || '—'}
                    </div>
                  </div>
                  {(isAdmin || isOwnerPi) && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={() => deleteDocument(d.id)}
                    >
                      Delete
                    </Button>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
      </Row>

      {/* Milestone modal */}
      <Modal show={showMilestoneModal} onHide={() => setShowMilestoneModal(false)} centered>
        <Form onSubmit={submitMilestone}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: '1.1rem' }}>
              {editingMilestoneId ? 'Edit milestone' : 'Add milestone'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {milestoneError && <Alert variant="danger">{milestoneError}</Alert>}
            <Form.Group className="mb-3" controlId="milestoneTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                required
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="milestoneDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group controlId="milestoneDueDate">
              <Form.Label>Due date</Form.Label>
              <Form.Control
                type="date"
                value={milestoneForm.dueDate || ''}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value || null })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowMilestoneModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-primary" disabled={milestoneSubmitting}>
              {milestoneSubmitting ? <Spinner animation="border" size="sm" /> : 'Save'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Document upload modal */}
      <Modal show={showDocModal} onHide={() => setShowDocModal(false)} centered>
        <Form onSubmit={submitDocument}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: '1.1rem' }}>Upload document</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {docError && <Alert variant="danger">{docError}</Alert>}
            <Form.Group className="mb-3" controlId="docTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control required value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="docDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={docDescription}
                onChange={(e) => setDocDescription(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="docFile">
              <Form.Label>File</Form.Label>
              <Form.Control
                type="file"
                required
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  setDocFile(target.files ? target.files[0] : null);
                }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowDocModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-primary" disabled={docSubmitting}>
              {docSubmitting ? <Spinner animation="border" size="sm" /> : 'Upload'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;
