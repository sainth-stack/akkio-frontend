import React from 'react';
import { Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import s4Logo from '../../../../../assets/images/s4.png';
import eccLogo from '../../../../../assets/images/ecc.png';
import btpLogo from '../../../../../assets/images/btp.png';
import batchLogo from '../../../../../assets/images/batch.png';

const SapOptionsPopup = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleS4Click = () => {
    onClose();
    localStorage.removeItem('sapApiUrl');
    localStorage.removeItem('sapType');
    navigate('/explore?mode=sap&sapType=s4');
  };

  const handleEccClick = () => {
    message.info('SAP ECC - Coming soon');
  };

  const handleBtpClick = () => {
    onClose();
    localStorage.setItem('sapType', 'btp');
    navigate('/explore?mode=sap&sapType=btp');
  };

  const handleBatchClick = () => {
    onClose();
    localStorage.setItem('sapType', 'batch');
    navigate('/explore?mode=sap&sapType=batch');
  };

  const options = [
    {
      id: 's4',
      label: 'SAP S/4HANA',
      logo: s4Logo,
      onClick: handleS4Click,
      available: true
    },
    {
      id: 'ecc',
      label: 'SAP ECC',
      logo: eccLogo,
      onClick: handleEccClick,
      available: false
    },
    {
      id: 'btp',
      label: 'SAP BTP',
      logo: btpLogo,
      onClick: handleBtpClick,
      available: true
    },
    {
      id: 'batch',
      label: 'SAP Batch',
      logo: batchLogo,
      onClick: handleBatchClick,
      available: true
    }
  ];

  return (
    <Modal
      title="Select SAP Source"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
        padding: '8px 0'
      }}>
        {options.map((opt) => (
          <div
            key={opt.id}
            onClick={opt.onClick}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 20,
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              cursor: opt.available ? 'pointer' : 'not-allowed',
              opacity: opt.available ? 1 : 0.7,
              backgroundColor: opt.available ? '#fff' : '#f9fafb',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (opt.available) {
                e.currentTarget.style.borderColor = '#1976d2';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <img
              src={opt.logo}
              alt={opt.label}
              style={{ width: 80, height: 40, objectFit: 'contain', marginBottom: 12 }}
            />
            <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
              {opt.label}
            </span>
            {!opt.available && (
              <span style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Coming soon</span>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default SapOptionsPopup;
