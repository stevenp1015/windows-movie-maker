import { useState } from 'react';
import { Film, Play, Pause, Settings } from 'lucide-react';
import './index.css';
import DirectorSanctum from './components/Planning/DirectorSanctum';
import TimelineView from './components/Timeline/TimelineView';
import { useMonstrosityEngine } from './hooks/useMonstrosityEngine';
import { chatWithDirector } from './services/gemini';

function App() {
  const [activeView, setActiveView] = useState<'planning' | 'production'>('planning');
  
  const {
    visualBible,
    scenes,
    conversations,
    activeConversationId,
    currentPhase,
    setCurrentPhase,
    pipelineStatus,
    pipelineProgress,
    systemLogs,
    updateVisualBible,
    generateVisualBible,
    generateScenes,
    addMessage,
    startPipeline,
    pausePipeline,
    isLoading,
    forceApproveScene,
    regenerateScene,
    injectSceneFeedback,
    viewSceneImage
  } = useMonstrosityEngine();

  const handleGenerateVisualBible = async (narrative: string, styleNotes: string) => {
    try {
      await generateVisualBible(narrative, styleNotes);
    } catch (error) {
      console.error('Visual Bible generation failed:', error);
    }
  };

  const handleGenerateScenes = async (narrative: string) => {
    try {
      await generateScenes(narrative);
    } catch (error) {
      console.error('Scene generation failed:', error);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversationId) return;

    const userMsg = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      sender: 'user' as const,
      content: text
    };
    
    addMessage(activeConversationId, userMsg);

    try {
      const response = await chatWithDirector(
        conversations.find(c => c.id === activeConversationId)?.messages || [],
        text,
        visualBible
      );

      // Handle text response
      if (response.text) {
        addMessage(activeConversationId, {
          id: (Date.now() + 1).toString(),
          timestamp: Date.now(),
          sender: 'gemini',
          content: response.text,
          functionCall: response.functionCalls?.[0] // Store first function call if present
        });
      }

      // Handle function calls
      if (response.functionCalls) {
        // Execute function calls and update Visual Bible
        for (const fnCall of response.functionCalls) {
          // This will be handled by the DirectorSanctum component
          console.log('Function call suggested:', fnCall);
        }
      }
    } catch (error) {
      console.error('Chat failed:', error);
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">Loading Monstrosity...</div>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <aside className="w-80 overflow-y-auto flex-shrink-0 glass-panel z-20 flex flex-col border-r border-white/50">
        <div className="p-6 border-b border-black/5">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Film className="w-5 h-5" />
            MONSTROSITY
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Narrative → Video Pipeline
          </p>
        </div>

        {/* Phase Navigation */}
        <div className="p-4 border-b border-black/5">
          <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">Navigation</div>
          <div className="space-y-1">
            <button
              onClick={() => setCurrentPhase('planning')}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                currentPhase === 'planning' 
                  ? 'bg-black text-white font-bold' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            >
              📋 Planning
            </button>
            <button
              onClick={() => setCurrentPhase('decomposition')}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                currentPhase === 'decomposition' 
                  ? 'bg-black text-white font-bold' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              disabled={!visualBible.characters || Object.keys(visualBible.characters).length === 0}
            >
              ✂️ Decomposition
            </button>
            <button
              onClick={() => setCurrentPhase('production')}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                currentPhase === 'production' 
                  ? 'bg-black text-white font-bold' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              disabled={scenes.length === 0}
            >
              🎬 Production
            </button>
          </div>
          
          {currentPhase === 'production' && (
            <div className="mt-3 p-2 bg-white/20 rounded">
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

        {/* Pipeline Controls (Production Phase) */}
        {currentPhase === 'production' && (
          <div className="p-4 border-b border-black/5 space-y-2">
            {pipelineStatus === 'idle' && (
              <button
                onClick={startPipeline}
                disabled={scenes.length === 0}
                className="w-full bg-black text-white px-4 py-2 rounded font-medium flex items-center justify-center gap-2 hover:bg-black/80 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Start Production
              </button>
            )}
            
            {pipelineStatus === 'running' && (
              <button
                onClick={pausePipeline}
                className="w-full bg-red-600 text-white px-4 py-2 rounded font-medium flex items-center justify-center gap-2 hover:bg-red-700"
              >
                <Pause className="w-4 h-4" />
                Pause Pipeline
              </button>
            )}
          </div>
        )}

        {/* Phase-specific Sidebar Content */}
        {(currentPhase === 'planning' || currentPhase === 'decomposition') && (
          <DirectorSanctum
            visualBible={visualBible}
            messages={activeConversation?.messages || []}
            onGenerateVisualBible={handleGenerateVisualBible}
            onGenerateScenes={handleGenerateScenes}
            onSendMessage={handleSendMessage}
            onUpdateBible={updateVisualBible}
            phase={currentPhase}
          />
        )}

        {currentPhase === 'production' && (
          <div className="p-4">
            <div className="glass-panel p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Settings className="w-3 h-3" />
                Configuration
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[var(--text-secondary)]">Scenes:</span> {scenes.length}
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Granularity:</span> {visualBible.granularityLevel}
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Max Retries:</span> {visualBible.maxImageRetries}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Logs */}
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2">System Logs</h3>
          <div className="flex-1 overflow-y-auto space-y-1 text-xs font-mono">
            {systemLogs.slice(-20).map((log, i) => (
              <div
                key={i}
                className={`
                  ${log.type === 'error' ? 'text-red-600' : ''}
                  ${log.type === 'success' ? 'text-green-600' : ''}
                  ${log.type === 'warning' ? 'text-orange-600' : ''}
                  ${log.type === 'info' ? 'text-[var(--text-secondary)]' : ''}
                `}
              >
                [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="glass-panel border-b border-white/50 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{visualBible.name}</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {scenes.length} scenes • {visualBible.colorPalette.mood} mood
            </p>
          </div>
        </header>

        {/* Timeline */}
        <div className="flex-1 overflow-hidden">
          {currentPhase === 'production' || currentPhase === 'review' ? (
            <TimelineView
              scenes={scenes}
              onRegenerateScene={regenerateScene}
              onForceApproveScene={forceApproveScene}
              onInjectSceneFeedback={injectSceneFeedback}
              onViewSceneImage={viewSceneImage}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
              <div className="text-center">
                <Film className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm">
                  {currentPhase === 'planning' && 'Paste your narrative to begin'}
                  {currentPhase === 'decomposition' && 'Review Visual Bible and generate scenes'}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
