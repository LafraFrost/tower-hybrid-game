import React, { useState } from 'react';
import ProjectorView from './components/ProjectorView';
import PlayerHUD from './components/PlayerHUD';

const App: React.FC = () => {
    // In a real app, this would be determined by the URL (e.g., /host vs /play)
    // or a login state. For this prototype, we use a simple toggle.
    const [viewMode, setViewMode] = useState<'SELECT' | 'PROJECTOR' | 'PLAYER'>('SELECT');

    if (viewMode === 'PROJECTOR') {
        return (
            <div>
                <button 
                    onClick={() => setViewMode('SELECT')} 
                    className="fixed top-2 right-2 z-50 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded opacity-50 hover:opacity-100"
                >
                    Exit View
                </button>
                <ProjectorView />
            </div>
        );
    }

    if (viewMode === 'PLAYER') {
        return (
            <div>
                <button 
                    onClick={() => setViewMode('SELECT')} 
                    className="fixed top-2 right-2 z-50 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded opacity-50 hover:opacity-100"
                >
                    Exit
                </button>
                <PlayerHUD />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-game-darker text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-game-dark p-8 rounded-2xl border border-gray-700 shadow-2xl text-center space-y-8">
                <div>
                    <h1 className="text-4xl font-bold text-game-accent mb-2">TOWER HYBRID</h1>
                    <p className="text-gray-400">Prototype Selection</p>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={() => setViewMode('PROJECTOR')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex items-center justify-between transition-all group"
                    >
                        <div className="text-left">
                            <span className="block font-bold text-lg">Projector View</span>
                            <span className="text-sm text-blue-200">Public Screen (TV/Projector)</span>
                        </div>
                        <span className="text-2xl group-hover:scale-110 transition-transform">📺</span>
                    </button>

                    <button 
                        onClick={() => setViewMode('PLAYER')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl flex items-center justify-between transition-all group"
                    >
                        <div className="text-left">
                            <span className="block font-bold text-lg">Player View</span>
                            <span className="text-sm text-green-200">Personal Device (Mobile)</span>
                        </div>
                        <span className="text-2xl group-hover:scale-110 transition-transform">📱</span>
                    </button>
                </div>

                <p className="text-xs text-gray-500 mt-8">
                    Select a role to visualize the interface. 
                    <br/>Data is currently simulated locally.
                </p>
            </div>
        </div>
    );
};

export default App;