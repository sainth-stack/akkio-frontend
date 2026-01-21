import React, { useState, useEffect } from 'react';
import styles from './Settings.module.scss';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaCheck } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';

const TABS = [
  { id: 'plan', label: 'Plan & Billing' },
  { id: 'general', label: 'General' },
  { id: 'analytics', label: 'AI Credits Analytics' },
];

export default function Settings() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('plan');
  
  // General Settings State
  const [workspaceName, setWorkspaceName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [themeColor, setThemeColor] = useState('#6366f1');
  const [currentPlan, setCurrentPlan] = useState('free');
  
  // Analytics State
  const [analyticsSummary, setAnalyticsSummary] = useState({
    remaining_credits: 0,
    total_used: 0,
    daily_average: 0,
    active_users: 1
  });
  const [chartData, setChartData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Handle query param for tab selection
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.email) {
        setUserEmail(user.email);
        fetchSettings(user.email);
        // Seed data if needed (optional, for demo)
        seedData(user.email);
      }
    } catch (e) {
      console.error("Error parsing user from local storage", e);
    }
  }, []);

  useEffect(() => {
    if (userEmail) {
      if (activeTab === 'analytics') {
        fetchAnalytics(userEmail);
      } else if (activeTab === 'general') {
        fetchSettings(userEmail);
      }
    }
  }, [activeTab, userEmail]);

  const seedData = async (email) => {
    try {
        await axios.post('http://localhost:8000/api/settings/seed-data', { email });
    } catch (e) {}
  };

  const fetchSettings = async (email) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/settings/general?email=${email}`);
      if (res.data) {
        setWorkspaceName(res.data.workspace_name || '');
        setIconUrl(res.data.icon_url || '');
        setThemeColor(res.data.theme_color || '#6366f1');
        setCurrentPlan(res.data.plan_id || 'free');
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await axios.post('http://localhost:8000/api/settings/general', {
        email: userEmail,
        workspace_name: workspaceName,
        icon_url: iconUrl,
        theme_color: themeColor
      });
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const fetchAnalytics = async (email) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/settings/analytics?email=${email}`);
      if (res.data) {
        setAnalyticsSummary(res.data.summary);
        setChartData(res.data.chart_data);
        setTransactions(res.data.transactions);
      }
    } catch (error) {
      console.error("Failed to fetch analytics", error);
    } finally {
      setLoading(false);
    }
  };

  const upgradePlan = async (planId) => {
    try {
      await axios.post('http://localhost:8000/api/settings/plan', {
        email: userEmail,
        plan_id: planId
      });
      setCurrentPlan(planId);
      toast.success(`Upgraded to ${planId} plan!`);
    } catch (error) {
      toast.error("Failed to upgrade plan");
    }
  };

  const renderAnalytics = () => (
    <div>
      <div className={styles.analyticsGrid}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Total Credits Used</div>
          <div className={styles.cardValue}>{analyticsSummary.total_used?.toFixed(2)}</div>
          <div className={styles.cardSub}>{transactions.length} transactions</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Remaining Credits</div>
          <div className={styles.cardValue}>{analyticsSummary.remaining_credits}</div>
          <div className={styles.cardSub}>No limit</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Daily Average</div>
          <div className={styles.cardValue}>{analyticsSummary.daily_average?.toFixed(2)}</div>
          <div className={styles.cardSub}>Credits per day</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Active Users</div>
          <div className={styles.cardValue}>{analyticsSummary.active_users}</div>
          <div className={styles.cardSub}>Unique users</div>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <div className={styles.chartTitle}>Daily Usage Trend</div>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
            <Tooltip />
            <Area type="monotone" dataKey="credits" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCredits)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.transactions}>
        <div className={styles.chartTitle}>Recent Transactions</div>
        <div style={{overflowX: 'auto'}}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>TIME</th>
                <th>USER</th>
                <th>SOURCE</th>
                <th>TYPE</th>
                <th>CREDITS</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr key={i}>
                  <td>
                    <div style={{fontWeight: 500}}>{tx.date}</div>
                    <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{tx.time}</div>
                  </td>
                  <td>{tx.user}</td>
                  <td><span className={`${styles.badge} ${styles.purple}`}>{tx.source}</span></td>
                  <td><span className={`${styles.badge} ${styles.blue}`}>{tx.type}</span></td>
                  <td style={{fontWeight: 600}}>{tx.credits.toFixed(2)}</td>
                  <td>{tx.details}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                    <td colSpan={6} style={{textAlign: 'center', color: '#6b7280'}}>No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPlan = () => (
    <div className={styles.plansGrid}>
      <div className={`${styles.planCard} ${currentPlan === 'pro' ? styles.activePlan : ''}`}>
        <div className={styles.planName}>Pro</div>
        <div className={styles.planPrice}>$39<span>/month</span></div>
        <div style={{color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem'}}>Billed $468/year</div>
        <ul className={styles.planFeatures}>
          <li><FaCheck className={styles.checkIcon} /> 6,000 AI credits/mo</li>
          <li><FaCheck className={styles.checkIcon} /> 5 GB storage</li>
          <li><FaCheck className={styles.checkIcon} /> 1 editor seat</li>
          <li><FaCheck className={styles.checkIcon} /> Custom domains available</li>
        </ul>
        <button 
            className={`${styles.planBtn} ${currentPlan === 'pro' ? styles.outline : styles.primary}`}
            onClick={() => upgradePlan('pro')}
        >
            {currentPlan === 'pro' ? 'Current Plan' : 'Upgrade'}
        </button>
      </div>

      <div className={`${styles.planCard} ${currentPlan === 'advanced' ? styles.activePlan : ''}`}>
        <div className={styles.planName}>Advanced</div>
        <div className={styles.planPrice}>$149<span>/month</span></div>
        <div style={{color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem'}}>Billed $1788/year</div>
        <ul className={styles.planFeatures}>
          <li><FaCheck className={styles.checkIcon} /> 30,000 AI credits/mo</li>
          <li><FaCheck className={styles.checkIcon} /> 25 GB storage</li>
          <li><FaCheck className={styles.checkIcon} /> 5 editor seats</li>
          <li><FaCheck className={styles.checkIcon} /> 20 user seats</li>
        </ul>
        <button 
            className={`${styles.planBtn} ${currentPlan === 'advanced' ? styles.outline : styles.primary}`}
            onClick={() => upgradePlan('advanced')}
        >
            {currentPlan === 'advanced' ? 'Current Plan' : 'Upgrade'}
        </button>
      </div>

      <div className={`${styles.planCard} ${styles.featured} ${currentPlan === 'ultra' ? styles.activePlan : ''}`}>
        <div className={styles.featuredTag}>Best Value</div>
        <div className={styles.planName}>Ultra</div>
        <div className={styles.planPrice}>$374<span>/month</span></div>
        <div style={{color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem'}}>Billed $4488/year</div>
        <ul className={styles.planFeatures}>
          <li><FaCheck className={styles.checkIcon} /> 100,000 AI credits/mo</li>
          <li><FaCheck className={styles.checkIcon} /> 100 GB storage</li>
          <li><FaCheck className={styles.checkIcon} /> Unlimited seats</li>
          <li><FaCheck className={styles.checkIcon} /> Dedicated AI engineer (Bonus)</li>
        </ul>
        <button 
            className={`${styles.planBtn} ${currentPlan === 'ultra' ? styles.outline : styles.primary}`}
            onClick={() => upgradePlan('ultra')}
        >
            {currentPlan === 'ultra' ? 'Current Plan' : 'Upgrade'}
        </button>
      </div>
    </div>
  );

  const renderGeneral = () => (
    <div>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Workspace Interface</div>
        <div className={styles.formGroup}>
          <label>Workspace name</label>
          <input 
            type="text" 
            className={styles.input} 
            value={workspaceName} 
            onChange={(e) => setWorkspaceName(e.target.value)} 
          />
        </div>
        <div className={styles.formGroup}>
          <label>Icon URL</label>
          <input 
            type="text" 
            className={styles.input} 
            placeholder="https://..." 
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Theme color</label>
          <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
            <input 
              type="color" 
              value={themeColor} 
              onChange={(e) => setThemeColor(e.target.value)}
              style={{height: '40px', width: '60px', padding: 0, border: 'none', background: 'none'}}
            />
            <span style={{color: '#6b7280'}}>{themeColor}</span>
          </div>
        </div>
        <button className={styles.saveBtn} onClick={saveSettings}>Save Changes</button>
      </div>

      <div className={`${styles.section} ${styles.dangerZone}`}>
        <div className={styles.sectionTitle}>Delete Workspace</div>
        <p style={{color: '#4b5563', marginBottom: '1.5rem'}}>
          Permanently remove your Workspace and all of its contents from MindPal. This action is not reversible — please continue with caution.
        </p>
        <button className={styles.deleteBtn} onClick={() => toast.warn("Delete not implemented yet")}>Delete workspace</button>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Settings {workspaceName && `for ${workspaceName}`}</h1>
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'plan' && renderPlan()}
        {activeTab === 'general' && renderGeneral()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
}
