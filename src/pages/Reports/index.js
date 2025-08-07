import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  FaTrash, FaEnvelope, FaExternalLinkAlt, FaDownload
} from 'react-icons/fa';
import './index.css'; // (updated filename for clarity)
import { akkiourl } from '../../utils/const';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionLoading, setActionLoading] = useState({ delete: false, email: false });

  const getUserEmail = () => {
    const userData = JSON.parse(localStorage.getItem('user'));
    return userData?.email || 'rangamrammohan123@gmail.com';
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const email = getUserEmail();
      const response = await fetch(`${akkiourl}/get_reports_by_email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `email=${encodeURIComponent(email)}`
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data || []);
      } else {
        toast.error('Failed to fetch reports');
      }
    } catch (error) {
      toast.error('Error fetching reports');
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    setActionLoading(prev => ({ ...prev, delete: true }));
    try {
      const email = getUserEmail();
      const response = await fetch(`${akkiourl}/delete_report_by_id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `email=${encodeURIComponent(email)}&report_id=${reportId}`
      });
      if (response.ok) {
        toast.success('Report deleted');
        if (selectedReport === reportId) setSelectedReport(null);
        fetchReports();
      } else {
        toast.error('Failed to delete report');
      }
    } catch {
      toast.error('Error deleting report');
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const emailReport = async (reportId) => {
    setActionLoading(prev => ({ ...prev, email: true }));
    try {
      const email = getUserEmail();
      const response = await fetch(`${akkiourl}/email_report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `email=${encodeURIComponent(email)}&report_ids=${reportId}`
      });
      if (response.ok) {
        toast.success('Report emailed');
      } else {
        toast.error('Failed to email report');
      }
    } catch {
      toast.error('Error emailing report');
    } finally {
      setActionLoading(prev => ({ ...prev, email: false }));
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  useEffect(() => { fetchReports(); }, []);

  return (
    <div className="pro__reports-main">
      <div className="pro__reports-header">
        <div>
          <h1>Reports</h1>
          <div className="pro__reports-subtitle">Your saved reports are below.</div>
        </div>
      </div>

      {loading ? (
        <div className="pro__reports-loader">
          <div className="pro__spinner" />
          <span>Loading reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="pro__empty-state">
          <FaDownload size={48} />
          <h2>No Reports Yet</h2>
          <p>Start creating and saving your first report.</p>
        </div>
      ) : (
        <div className="pro__reports-content">
          <div className="pro__list-header">
            <span>Total Reports: <b>{reports.length}</b></span>
          </div>
          <div className="pro__reports-grid">
            {reports.map((report) => (
              <div
                key={report.id}
                className={`pro__report-card${selectedReport === report.id ? ' active' : ''}`}
                onClick={() => setSelectedReport(report.id)}
              >
                <div className="pro__card-top">
                  <h3 className="pro__report-title">
                    {report.title || 'Untitled Document'}
                  </h3>
                </div>
                <div className="pro__description">
                  {report.description || <em>No description provided.</em>}
                </div>
                <span className="pro__report-date" style={{marginBottom:'20px'}}>
                    {formatDate(report.created_at)}
                  </span>
                <div className="pro__card-actions">
                  <a
                    href={report.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pro__btn pro--view"
                    title="View"
                  >
                    <FaExternalLinkAlt /> View
                  </a>
                  <button
                    className="pro__btn pro--email"
                    onClick={e => { e.stopPropagation(); emailReport(report.id); }}
                    disabled={actionLoading.email}
                    title="Send Email"
                  >
                    <FaEnvelope />
                    {actionLoading.email ? "Sending..." : "Email"}
                  </button>
                  <button
                    className="pro__btn pro--delete"
                    onClick={e => { e.stopPropagation(); deleteReport(report.id); }}
                    disabled={actionLoading.delete}
                    title="Delete"
                  >
                    <FaTrash />
                    {actionLoading.delete ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
