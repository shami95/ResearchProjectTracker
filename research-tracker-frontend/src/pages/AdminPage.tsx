import React, { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import axiosClient, { extractErrorMessage } from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { CreateUserRequest, UserResponse, UserRole } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'var(--color-gold-500)',
  PI: 'var(--color-navy-800)',
  MEMBER: 'var(--color-success)',
  VIEWER: 'var(--color-slate)',
};

const ROLES: UserRole[] = ['ADMIN', 'PI', 'MEMBER', 'VIEWER'];

const emptyForm: CreateUserRequest = { username: '', password: '', fullName: '', role: 'MEMBER' };

const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateUserRequest>(emptyForm);
  const [validated, setValidated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadUsers = () => {
    setLoading(true);
    axiosClient
      .get<UserResponse[]>('/users')
      .then((res) => setUsers(res.data))
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setForm(emptyForm);
    setValidated(false);
    setModalError(null);
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    setModalError(null);

    if (!formEl.checkValidity()) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await axiosClient.post<UserResponse>('/users', form);
      setUsers((prev) => [res.data, ...prev]);
      setShowModal(false);
    } catch (err) {
      setModalError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u: UserResponse) => {
    if (u.id === currentUser?.userId) {
      window.alert("You can't delete your own account.");
      return;
    }
    if (!window.confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    setDeletingId(u.id);
    try {
      await axiosClient.delete(`/users/${u.id}`);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow">Admin panel</div>
          <h1>User management</h1>
          <p>Full list of registered accounts across the system.</p>
        </div>
        <Button className="btn-gold" onClick={openCreateModal}>
          + Create user
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <LoadingSpinner label="Loading users…" />
      ) : (
        <Table hover responsive className="bg-white" style={{ borderRadius: 10, overflow: 'hidden' }}>
          <thead>
            <tr>
              <th>Full name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>@{u.username}</td>
                <td>
                  <Badge style={{ backgroundColor: ROLE_COLORS[u.role] || 'gray' }}>{u.role}</Badge>
                </td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    disabled={deletingId === u.id}
                    onClick={() => handleDelete(u)}
                  >
                    {deletingId === u.id ? 'Deleting…' : 'Delete'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form noValidate validated={validated} onSubmit={handleCreate}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: '1.1rem' }}>Create user account</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <Form.Group className="mb-3" controlId="newUserFullName">
              <Form.Label>Full name</Form.Label>
              <Form.Control
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              <Form.Control.Feedback type="invalid">Full name is required.</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="newUserUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                required
                minLength={3}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
              <Form.Control.Feedback type="invalid">
                Username must be at least 3 characters.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="newUserPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <Form.Control.Feedback type="invalid">
                Password must be at least 6 characters.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="newUserRole">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Spinner animation="border" size="sm" /> : 'Create user'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPage;
