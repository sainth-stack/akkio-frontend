import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCrown } from 'react-icons/fa';
import './UpgradeOverlay.scss';

export default function UpgradeOverlay() {
  const navigate = useNavigate();

  return (
    <div className="upgradeOverlay">
      <div className="upgradeOverlay__content">
        <div className="upgradeOverlay__icon">
          <FaCrown size={48} color="#FFD700" />
        </div>
        <h2>Upgrade to Premium</h2>
        <p>You have run out of AI credits. Upgrade your plan to continue using this feature.</p>
        <button 
          className="upgradeOverlay__button"
          onClick={() => navigate('/settings')}
        >
          View Plans
        </button>
      </div>
    </div>
  );
}

