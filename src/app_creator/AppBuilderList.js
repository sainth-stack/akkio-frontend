import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, message as antdMessage } from 'antd';
import { FaPlus, FaPuzzlePiece, FaEdit, FaTrashAlt, FaSearch } from 'react-icons/fa';
import Spinner from 'react-bootstrap/Spinner';

const AppBuilderList = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL || 'http://localhost:8000', []);
  const email = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || '{}')?.email || '') : '';

  useEffect(() => {
    const fetchApps = async () => {
      if (!email) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/app-builder/apps?user_email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.status === 'success' && Array.isArray(data.apps)) {
          setApps(data.apps);
        }
      } catch (err) {
        console.error('Error fetching apps:', err);
        antdMessage.error('Failed to load apps');
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [email, apiBase]);

  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return apps;
    const q = searchQuery.toLowerCase();
    return apps.filter(
      (app) =>
        (app.app_name && app.app_name.toLowerCase().includes(q)) ||
        (app.prompt && app.prompt.toLowerCase().includes(q)) ||
        (app.project_name && app.project_name.toLowerCase().includes(q))
    );
  }, [apps, searchQuery]);

  const handleDelete = async (app, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${app.app_name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(
        `${apiBase}/api/app-builder/apps/${app.id}?user_email=${encodeURIComponent(email)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.status === 'success') {
        antdMessage.success('App deleted');
        setApps((prev) => prev.filter((a) => a.id !== app.id));
      } else {
        antdMessage.error(data.detail || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      antdMessage.error('Failed to delete app');
    }
  };

  const handleEdit = (app) => {
    navigate(`/app-builder/edit/${app.id}`);
  };

  return (
    <div
      style={{
        padding: '24px 40px',
        minHeight: '100vh',
        backgroundColor: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div style={{ marginBottom: '8px', fontWeight: '500', color: '#111827' }}>All</div>

      <div style={{ marginBottom: '24px' }}>
        <Input
          prefix={<FaSearch style={{ color: '#9ca3af' }} />}
          placeholder="Search..."
          size="large"
          style={{
            borderRadius: '8px',
            maxWidth: '100%',
            backgroundColor: '#f3f4f6',
            border: 'none',
            padding: '8px 12px',
          }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div>
        <h3 style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', marginBottom: '12px' }}>Applications</h3>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Spinner animation="border" />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {/* New App Card */}
            <div
              onClick={() => navigate('/app-builder/new')}
              style={{
                backgroundColor: '#f3f4f6',
                borderRadius: '12px',
                border: 'none',
                minHeight: '200px',
                height: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
            >
              <div style={{ fontSize: '24px', color: '#3b82f6', marginBottom: '8px' }}>
                <FaPlus />
              </div>
              <div style={{ color: '#3b82f6', fontWeight: '500' }}>New app</div>
            </div>

            {/* App cards */}
            {filteredApps.map((app) => (
              <div
                key={app.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '200px',
                  height: 'auto',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4b5563',
                    }}
                  >
                    <FaPuzzlePiece size={20} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button
                      type="text"
                      size="small"
                      icon={<FaEdit style={{ color: '#4b5563' }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(app);
                      }}
                      title="Edit"
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<FaTrashAlt />}
                      onClick={(e) => handleDelete(app, e)}
                      title="Delete"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {app.app_name || app.project_name || 'Untitled app'}
                  </h3>
                </div>

                <div
                  style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    flex: 1,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    marginBottom: '16px',
                    lineHeight: '1.5',
                  }}
                >
                  {app.prompt || 'No description.'}
                </div>

                <div>
                  <Button
                    type="primary"
                    block
                    style={{ borderRadius: '6px', background: '#eef2ff', color: '#4f46e5', border: 'none', fontWeight: '500' }}
                    onClick={() => handleEdit(app)}
                  >
                    Open / Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppBuilderList;
