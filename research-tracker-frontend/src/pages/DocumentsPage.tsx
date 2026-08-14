import React, { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { Link } from 'react-router-dom';
import axiosClient, { API_BASE_URL, extractErrorMessage } from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Project, DocumentItem } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

interface EnrichedDocument extends DocumentItem {
  projectTitle: string;
}

const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<EnrichedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const canUpload = user?.role === 'MEMBER' || user?.role === 'PI' || user?.role === 'ADMIN';

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectsRes = await axiosClient.get<Project[]>('/projects');
      setProjects(projectsRes.data);
      const results = await Promise.all(
        projectsRes.data.map((p) =>
          axiosClient
            .get<DocumentItem[]>(`/projects/${p.id}/documents`)
            .then((res) => res.data.map((d) => ({ ...d, projectTitle: p.title })))
        )
      );
      setDocuments(
        results.flat().sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''))
      );
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

  const openModal = () => {
    setTargetProjectId(projects[0]?.id || '');
    setTitle('');
    setDescription('');
    setFile(null);
    setModalError(null);
    setShowModal(true);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProjectId) {
      setModalError('Please choose a project.');
      return;
    }
    if (!file) {
      setModalError('Please choose a file.');
      return;
    }
    setSubmitting(true);
    setModalError(null);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('file', file);
      await axiosClient.post(`/projects/${targetProjectId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
          <h1>Documents</h1>
          <p>Reference materials and files uploaded to research projects.</p>
        </div>
        {canUpload && (
          <Button className="btn-gold" onClick={openModal} disabled={projects.length === 0}>
            + Upload document
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <LoadingSpinner label="Gathering documents…" />
      ) : documents.length === 0 ? (
        <div className="empty-state">No documents uploaded yet.</div>
      ) : (
        <Table hover responsive className="bg-white" style={{ borderRadius: 10, overflow: 'hidden' }}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Project</th>
              <th>Uploaded by</th>
              <th>Uploaded at</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id}>
                <td>{d.title}</td>
                <td>
                  <Link to={`/projects/${d.projectId}`}>{d.projectTitle}</Link>
                </td>
                <td>{d.uploadedByName || '—'}</td>
                <td>{d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : '—'}</td>
                <td>
                  <a href={`${API_BASE_URL}${d.urlOrPath}`} target="_blank" rel="noopener noreferrer">
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleUpload}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: '1.1rem' }}>Upload document</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}
            <Form.Group className="mb-3" controlId="docProject">
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
            <Form.Group className="mb-3" controlId="docTitleGlobal">
              <Form.Label>Title</Form.Label>
              <Form.Control required value={title} onChange={(e) => setTitle(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="docDescriptionGlobal">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="docFileGlobal">
              <Form.Label>File</Form.Label>
              <Form.Control
                type="file"
                required
                onChange={(e) => {
                  const target = e.target as HTMLInputElement;
                  setFile(target.files ? target.files[0] : null);
                }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Spinner animation="border" size="sm" /> : 'Upload'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentsPage;
