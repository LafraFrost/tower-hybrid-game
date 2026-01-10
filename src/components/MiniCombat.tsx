import React, { useState, useEffect } from 'react';

interface MiniCombatProps {
  buildingName: string;
  onVictory: () => void;
  onDefeat: () => void;
}

export const MiniCombat: React.FC<MiniCombatProps> = ({ buildingName, onVictory, onDefeat }) => {
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(50);
  const [message, setMessage] = useState(`Difendi ${buildingName} dai Goblin!`);
  const [combatActive, setCombatActive] = useState(true);

  const handleAttack = () => {
    const damage = Math.floor(Math.random() * 20) + 10;
    const newEnemyHealth = Math.max(0, enemyHealth - damage);
    setEnemyHealth(newEnemyHealth);

    if (newEnemyHealth <= 0) {
      setCombatActive(false);
      setMessage(`✅ Vittoria! ${buildingName} è salvo!`);
      setTimeout(() => onVictory(), 2000);
      return;
    }

    // Enemy counter-attack
    const enemyDamage = Math.floor(Math.random() * 15) + 5;
    const newPlayerHealth = Math.max(0, playerHealth - enemyDamage);
    setPlayerHealth(newPlayerHealth);

    if (newPlayerHealth <= 0) {
      setCombatActive(false);
      setMessage('❌ Sconfitta! I Goblin hanno distrutto l\'edificio!');
      setTimeout(() => onDefeat(), 2000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      fontFamily: 'Arial, sans-serif',
      color: 'white',
    }}>
      <div style={{
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        border: '3px solid #ff6b35',
        borderRadius: '10px',
        padding: '30px',
        maxWidth: '500px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '28px', marginBottom: '20px', color: '#ff6b35' }}>
          ⚔️ MICRO COMBATTIMENTO ⚔️
        </h1>

        <p style={{ fontSize: '16px', marginBottom: '20px', color: '#ffb700' }}>
          {message}
        </p>

        <div style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '14px', marginBottom: '5px' }}>Tu - Salute: {playerHealth}</div>
            <div style={{
              width: '100%',
              height: '20px',
              backgroundColor: '#333',
              border: '1px solid #666',
              borderRadius: '5px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${playerHealth}%`,
                backgroundColor: playerHealth > 50 ? '#22c55e' : playerHealth > 25 ? '#eab308' : '#ef4444',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '14px', marginBottom: '5px' }}>Nemico - Salute: {enemyHealth}</div>
            <div style={{
              width: '100%',
              height: '20px',
              backgroundColor: '#333',
              border: '1px solid #666',
              borderRadius: '5px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.max(0, (enemyHealth / 50) * 100)}%`,
                backgroundColor: '#ef4444',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        </div>

        {combatActive && (
          <button
            onClick={handleAttack}
            style={{
              backgroundColor: '#ff6b35',
              color: 'white',
              border: 'none',
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ff5722')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ff6b35')}
          >
            ⚔️ ATTACCA
          </button>
        )}
      </div>
    </div>
  );
};
