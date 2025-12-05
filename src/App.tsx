import { useState } from 'react';
import { Film, Play, Pause, Settings } from 'lucide-react';
import './index.css';
import Sidebar from './components/Sidebar';
import DirectorSanctum from './components/Planning/DirectorSanctum';
import TimelineView from './components/Timeline/TimelineView';
import { useMonstrosityEngine } from './hooks/useMonstrosityEngine';
import { chatWithDirector } from './services/gemini';
import BackgroundEffect from './background-effect';
import { type PreCreatedEntity } from './types/preEntity';
import { EnhancedLogPanel } from './components/EnhancedLogPanel';

function App() {
  const [activeView, setActiveView] = useState<'planning' | 'production'>('planning');
  const [preCreatedEntities, setPreCreatedEntities] = useState<PreCreatedEntity[]>([]);

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
    generateBeats, // NEW: Beat-based decomposition
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

  const handleGenerateBeats = async (narrative: string) => {
    try {
      const beats = await generateBeats(narrative);
      console.log('[App] Generated beats:', beats);
    } catch (error) {
      console.error('Beat generation failed:', error);
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

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  return (
    <div className="flex flex-1 h-screen w-screen overflow-hidden relative">
      <BackgroundEffect />

      {/* Sidebar */}
      <div className="flex flex-col h-full justify-center">
        <Sidebar
          currentPhase={currentPhase}
          setCurrentPhase={setCurrentPhase}
        />
      </div>


      {/* Enhanced Log Panel */}
      <EnhancedLogPanel />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* STEPS 1 & 2 */}
        {/* Planning and Decomposition phases */}
        {(currentPhase === "planning" || currentPhase === "decomposition") && (
          <DirectorSanctum
            visualBible={visualBible}
            messages={activeConversation?.messages || []}
            onGenerateVisualBible={handleGenerateVisualBible}
            onGenerateScenes={handleGenerateScenes}
            onGenerateBeats={handleGenerateBeats}
            onSendMessage={handleSendMessage}
            onUpdateBible={updateVisualBible}
            phase={currentPhase}
            preCreatedEntities={preCreatedEntities}
            onPreCreatedEntitiesChange={setPreCreatedEntities}
          />
        )}


        {/* STEP 3: Production phase (Timeline) */}
        {currentPhase === "production" && (
          <div className="p-4 space-y-2">
            <div className="h-12 glass-panel flex items-center px-6 gap-6 text-sm font-mono text-[var(--text-secondary)] z-10">
              <span>TOTAL SCENES: {scenes.length}</span>
              <span>GENERATED: {scenes.filter(s => s.overallStatus === 'complete').length}</span>
              <span>PENDING: {scenes.filter(s => s.overallStatus === 'pending').length}</span>
              <div className="ml-auto flex items-center">
                {/*Start/Pause button*/}
                {pipelineStatus === "idle" && (
                  <button
                    onClick={startPipeline}
                    disabled={scenes.length === 0}
                    className="bg-slate-800 border-slate-700 h-8 w-auto px-2 py-4 !text-white !text-md font-mono white-lamp flex items-center gap-2"
                  >
                    <Play className="mix-blend-screen w-6 h-6" />
                    <span className="text-md font-mono">
                      Start Production
                    </span>
                  </button>
                )}

                {pipelineStatus === "running" && (
                  <button
                    onClick={pausePipeline}
                    className="w-full bg-red-600 text-white px-2 py-4 rounded font-medium flex items-center justify-center gap-2 hover:bg-red-700"
                  >
                    <Pause className="w-4 h-4" />
                    Pause Pipeline
                  </button>
                )}
              </div>
            </div>
          </div>

        )}


        {/* Timeline Cards */}
        <div className="flex-1 overflow-hidden">
          {currentPhase === "production" || currentPhase === "review" ? (
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
                  {currentPhase === "planning" &&
                    "Paste your narrative to begin"}
                  {currentPhase === "decomposition" &&
                    "Review Visual Bible and generate scenes"}
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
