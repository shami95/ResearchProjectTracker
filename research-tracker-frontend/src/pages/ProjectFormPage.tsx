import React, { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient, { extractErrorMessage } from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { Project, ProjectRequest, UserResponse } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const ProjectFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [piId, setPiId] = useState('');

  const [piOptions, setPiOptions] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      axiosClient
        .get<UserResponse[]>('/users')
        .then((res) => setPiOptions(res.data.filter((u) => u.role === 'PI')))
        .catch(() => {
          /* non-fatal: admin can still create as themselves */
        });
    }
  }, [user]);

  useEffect(() => {
    if (!isEdit) return;
    axiosClient
      .get<Project>(`/projects/${id}`)
      .then((res) => {
        const p = res.data;
        setTitle(p.title);
        setSummary(p.summary || '');
        setTags(p.tags || '');
        setStartDate(p.startDate || '');
        setEndDate(p.endDate || '');
        setPiId(p.piId || '');
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);

    if (!form.checkValidity()) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    const payload: ProjectRequest = {
      title,
      summary,
      tags,
      startDate: startDate || null,
      endDate: endDate || null,
      ...(user?.role === 'ADMIN' && piId ? { piId } : {}),
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await axiosClient.put(`/projects/${id}`, payload);
        navigate(`/projects/${id}`);
      } else {
        const res = await axiosClient.post<Project>('/projects', payload);
        navigate(`/projects/${res.data.id}`);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSpinner label="Loading project…" />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <div className="eyebrow">{isEdit ? 'Edit project' : 'New project'}</div>
          <h1>{isEdit ? 'Update project details' : 'Start a new research project'}</h1>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="projectTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Coastal Erosion Monitoring with Satellite Imagery"
          />
          <Form.Control.Feedback type="invalid">
            Title is required.
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="projectSummary">
          <Form.Label>Summary</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="A short description of the project's goals and scope"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="projectTags">
          <Form.Label>Tags</Form.Label>
          <Form.Control
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="AI, environment, coastal science"
          />
          <Form.Text className="text-muted-2">Comma-separated.</Form.Text>
        </Form.Group>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="projectStartDate">
              <Form.Label>Start date</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="projectEndDate">
              <Form.Label>Expected end date</Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        {user?.role === 'ADMIN' && (
          <Form.Group className="mb-4" controlId="projectPi">
            <Form.Label>Principal Investigator</Form.Label>
            <Form.Select value={piId} onChange={(e) => setPiId(e.target.value)}>
              <option value="">
                {isEdit ? 'Keep current PI' : 'Assign myself as PI'}
              </option>
              {piOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} (@{u.username})
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted-2">
              As an admin, you may assign this project to any PI.
            </Form.Text>
          </Form.Group>
        )}

        <div className="d-flex gap-2">
          <Button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving…
              </>
            ) : isEdit ? (
              'Save changes'
            ) : (
              'Create project'
            )}
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ProjectFormPage;
