import React from 'react';
import { Film } from 'lucide-react';
import { useMonstrosityEngine, type AppPhase } from '../hooks/useMonstrosityEngine';
import BookIcon from './icons/BookIcon';
import CharacterIcon from './icons/CharacterIcon';
import FilmReelIcon from './icons/FilmReelIcon';

interface SidebarProps {
    currentPhase: AppPhase;
    setCurrentPhase: React.Dispatch<React.SetStateAction<AppPhase>>;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPhase, setCurrentPhase }) => {
    const {
        visualBible,
        scenes,
        pipelineStatus,
        pipelineProgress
    } = useMonstrosityEngine();

    return (
        <aside className="flex-shrink-0 w-[5.5rem] h-full justify-center p-2 z-20 flex flex-col relative">
            <div className="h-[calc(90vh)] sidebar flex w-full flex-col relative">
                <div className="h-[97%] bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.7)_5%,rgba(255,255,255,0.6)_60%,rgba(255,255,255,0.5)_70%,rgba(255,255,255,0)_90%)] absolute left-0 top-1/2 -translate-y-1/2 w-[0.3px] pointer-events-none">
                </div>

                {/* Film icon at top */}
                <div className="flex top-0 justify-center p-6 flex-shrink-0">
                    <h1 className="text-xl text-slate-500 font-bold tracking-tight flex items-center gap-2">
                        <Film className="w-5 h-5" />
                    </h1>
                </div>
                <div className="h-[1px] w-[75%] left-1/2 -translate-x-1/2 relative bg-slate-600" />

                {/* Centered phase navigation buttons */}
                <div className="flex-1 flex items-center -translate-y-6 justify-center">
                    <div className="p-2 space-y-3 w-full">

                        {/* Planning Phase - Book Icon */}
                        <button
                            className={`group sidebar-button ${currentPhase === 'planning'
                                ? 'sidebar-button-active'
                                : 'sidebar-button-inactive'
                                }`}
                            onClick={() => setCurrentPhase('planning')}
                        >
                            <BookIcon size={32} />
                        </button>

                        {/* Decomposition Phase - Character Icon */}
                        <button
                            className={`group sidebar-button ${currentPhase === 'decomposition'
                                ? 'sidebar-button-active'
                                : 'sidebar-button-inactive'
                                }`}
                            disabled={!visualBible.characters || Object.keys(visualBible.characters).length === 0}
                            onClick={() => setCurrentPhase('decomposition')}
                        >
                            <CharacterIcon size={32} />
                        </button>

                        {/* Production Phase - Film Reel Icon */}
                        <button
                            onClick={() => setCurrentPhase('production')}
                            className={`group sidebar-button ${currentPhase === 'production'
                                ? 'sidebar-button-active'
                                : 'sidebar-button-inactive'
                                }`}
                            disabled={scenes.length === 0}
                        >
                            <FilmReelIcon size={32} />
                        </button>
                    </div>
                </div>

                {/* Pipeline status pinned to bottom */}
                {currentPhase === 'production' && (
                    <div className="p-2 bg-white/20 rounded-b-[13px] flex-shrink-0">
                        <div className="text-xs text-[var(--text-secondary)] mb-1">
                            Pipeline: {pipelineStatus}
                        </div>
                        {pipelineStatus === 'running' && (
                            <div className="text-xs">
                                Scene {pipelineProgress.currentSceneIndex + 1} / {pipelineProgress.totalScenes}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;

