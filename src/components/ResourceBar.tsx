import React from 'react';

export default function ResourceBar({ resources }: { resources: any }) {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: '10px 25px',
      borderRadius: '30px',
      border: '2px solid #DAA520',
      zIndex: 2000,
      color: 'white',
      fontWeight: 'bold',
      boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
    }}>
      <div title="Legno">🪵 {resources?.wood ?? 0}</div>
      <div title="Pietra">🪨 {resources?.stone ?? 0}</div>
      <div title="Oro">💰 {resources?.gold ?? 0}</div>
    </div>
  );
}

export function MenuButton() {
  return (
    <button
      onClick={() => { window.location.href = '/'; }}
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        padding: '10px 15px',
        backgroundColor: '#444',
        color: 'white',
        border: '1px solid #777',
        borderRadius: '8px',
        cursor: 'pointer',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
      }}
    >
      ⬅️ Menu Principale
    </button>
  );
}

export function ResetButton({ onReset }: { onReset?: () => void }) {
  return (
    <button
      onClick={() => onReset && onReset()}
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        padding: '10px 15px',
        backgroundColor: '#8b0000',
        color: 'white',
        border: '1px solid #550000',
        borderRadius: '8px',
        cursor: 'pointer',
        zIndex: 2000,
      }}
    >
      Reset
    </button>
  );
}
