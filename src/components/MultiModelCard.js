import React from 'react';
import { Tag, Progress } from 'antd';
import { FaRobot, FaBrain, FaCheckCircle, FaTrashAlt } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const MultiModelCard = ({ model, userEmail, onRefresh, isSelected, onDelete, onClick }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#22c55e';
      case 'training':
      case 'processing':
      case 'in_progress':
        return '#3b82f6';
      case 'failed':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const handleCardClick = (e) => {
    // Only allow click if completed
    if (model.status !== 'completed') return;

    if (onClick) {
      onClick(model);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="file-card"
      style={{
        position: 'relative',
        cursor: model.status === 'completed' ? 'pointer' : 'not-allowed',
        opacity: model.status === 'completed' ? 1 : 0.7,
        // outline: isSelected ? '3px solid #22c55e' : 'none',
        borderRadius: 12,
        background: 'white',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 10px rgba(2, 6, 23, 0.05)',
        transition: 'transform .15s ease, box-shadow .2s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 20px rgba(2, 6, 23, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 4px 10px rgba(2, 6, 23, 0.05)';
      }}
    >
      {/* Thumbnail Area */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16/10',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          background: 'linear-gradient(135deg, #f59e0b, #ec4899)', // Gradient for multi-model
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          color: 'white',
          borderBottom: '1px solid #f3f4f6'
        }}
      >
        <FaBrain size={48} />

        {/* Status Badge in Thumbnail - simplified */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          background: 'white',
          padding: '2px 8px',
          borderRadius: 6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <Tag style={{ color: getStatusColor(model.status), margin: 0, border: 'none', background: 'transparent', padding: 0, fontWeight: 600, fontSize: 11 }}>
            {model.status.toUpperCase()}
          </Tag>
        </div>
      </div>

      {/* Content Area */}
      <div className="file-name" style={{
        padding: '16px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          fontWeight: 600,
          fontSize: 16,
          color: '#111827',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 8
        }}>
          {model.model_name}
        </div>

        {/* Description / System Prompt */}
        <div style={{
          fontSize: 13,
          color: '#4b5563',
          marginBottom: 12,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.4'
        }}>
          {model.system_prompt || "No description provided."}
        </div>

        {/* Metadata */}
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 'auto' }}>
          {model.completed_at ? (
            <div>{new Date(model.completed_at).toLocaleDateString()}</div>
          ) : (
            <div>{new Date(model.created_at).toLocaleDateString()}</div>
          )}
        </div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <FaCheckCircle
          title="Selected"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: '#22c55e',
            background: 'white',
            borderRadius: '50%',
            padding: 2,
            fontSize: 26,
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            zIndex: 10
          }}
        />
      )}

      {/* Delete Action - Always show for multi-models */}
      <FaTrashAlt
        className="delete-icon"
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          color: '#e74c3c',
          background: 'white',
          borderRadius: '50%',
          padding: 4,
          fontSize: 22,
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          cursor: 'pointer',
          zIndex: 10,
          opacity: 0.9,
          transition: 'opacity 0.2s ease'
        }}
        title="Delete model"
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; }}
        onClick={(e) => {
          e.stopPropagation();
          if (onDelete) {
            onDelete(model);
          }
        }}
      />
    </div>
  );
};

export default MultiModelCard;

