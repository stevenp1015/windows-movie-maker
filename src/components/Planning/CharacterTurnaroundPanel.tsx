import React, { useState } from 'react';
import { User, Loader, CheckCircle, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { type VisualBible, type CharacterTurnaround } from '../../types';
import { generateCharacterTurnaround } from '../../services/characterTurnaround';

interface CharacterTurnaroundPanelProps {
  visualBible: VisualBible;
  onTurnaroundGenerated: (characterId: string, turnaround: CharacterTurnaround) => void;
}

const CharacterTurnaroundPanel: React.FC<CharacterTurnaroundPanelProps> = ({
  visualBible,
  onTurnaroundGenerated
}) => {
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, view: '' });
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const handleGenerateTurnaround = async (characterId: string) => {
    const character = visualBible.characters[characterId];
    if (!character) return;

    setGeneratingFor(characterId);
    setProgress({ current: 0, total: 4, view: '' });

    try {
      const turnaround = await generateCharacterTurnaround(
        characterId,
        character,
        visualBible,
        (step, total, viewName) => {
          setProgress({ current: step, total, view: viewName });
        }
      );

      onTurnaroundGenerated(characterId, turnaround);
      setGeneratingFor(null);
      setProgress({ current: 0, total: 0, view: '' });
    } catch (error) {
      console.error('Turnaround generation failed:', error);
      setGeneratingFor(null);
      alert(`Failed to generate turnaround: ${error}`);
    }
  };

  const handleViewImage = (base64: string) => {
    setViewingImage(base64);
  };

  const closeImageViewer = () => {
    setViewingImage(null);
  };

  const characters = Object.entries(visualBible.characters);

  if (characters.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--text-muted)]">
        <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No characters defined yet</p>
        <p className="text-xs mt-1">Add characters to your Visual Bible first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 bg-purple-50 border-b border-purple-200">
        <h3 className="text-sm font-bold text-purple-900">Character Solidification</h3>
        <p className="text-xs text-purple-700 mt-1">
          Generate 2K reference turnarounds for perfect character consistency
        </p>
      </div>

      {/* Character List */}
      <div className="space-y-3 px-4">
        {characters.map(([characterId, character]) => {
          const turnaround = visualBible.characterTurnarounds[characterId];
          const isGenerating = generatingFor === characterId;
          const isComplete = turnaround?.status === 'complete';

          return (
            <div
              key={characterId}
              className="reflective-card border-2 border-white/60 overflow-hidden"
            >
              {/* Character Header */}
              <div
                className="p-3 bg-white/50 cursor-pointer hover:bg-white/70 transition-colors"
                onClick={() => setSelectedCharacter(
                  selectedCharacter === characterId ? null : characterId
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-sm">{character.name}</span>
                    {isComplete && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  {!isGenerating && !isComplete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateTurnaround(characterId);
                      }}
                      className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 flex items-center gap-1"
                    >
                      Generate Turnaround
                    </button>
                  )}
                  {isGenerating && (
                    <div className="flex items-center gap-2 text-xs text-purple-700">
                      <Loader className="w-3 h-3 animate-spin" />
                      <span>
                        {progress.view} ({progress.current}/{progress.total})
                      </span>
                    </div>
                  )}
                  {isComplete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateTurnaround(characterId);
                      }}
                      className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Regenerate
                    </button>
                  )}
                </div>
              </div>

              {/* Turnaround Views (Expanded) */}
              {selectedCharacter === characterId && isComplete && turnaround && (
                <div className="p-4 bg-gray-50 border-t border-black/5">
                  <div className="grid grid-cols-2 gap-3">
                    {(['front', 'sideLeft', 'sideRight', 'back'] as const).map((viewName) => {
                      const view = turnaround.views[viewName];
                      const viewLabels = {
                        front: 'Front',
                        sideLeft: 'Side (L)',
                        sideRight: 'Side (R)',
                        back: 'Back'
                      };

                      return (
                        <div key={viewName} className="space-y-1">
                          <div className="text-xs font-bold text-gray-700">
                            {viewLabels[viewName]}
                          </div>
                          {view?.base64 ? (
                            <div className="aspect-[2/3] bg-gray-200 rounded overflow-hidden group relative">
                              <img
                                src={view.base64.startsWith('data:') ? view.base64 : `data:image/png;base64,${view.base64}`}
                                alt={`${character.name} - ${viewLabels[viewName]}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  onClick={() => handleViewImage(view.base64)}
                                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                                >
                                  <Eye className="w-4 h-4 text-black" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-[2/3] bg-gray-300 rounded flex items-center justify-center">
                              <AlertCircle className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Metadata */}
                  <div className="mt-3 pt-3 border-t border-black/5 text-xs text-gray-600">
                    <div>Resolution: {turnaround.metadata.resolution}</div>
                    <div>
                      Generated: {new Date(turnaround.metadata.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Generating Progress */}
              {selectedCharacter === characterId && isGenerating && (
                <div className="p-6 bg-purple-50 border-t border-purple-200">
                  <div className="flex flex-col items-center justify-center">
                    <Loader className="w-8 h-8 animate-spin text-purple-600 mb-3" />
                    <div className="text-sm font-bold text-purple-900">
                      Generating {progress.view}...
                    </div>
                    <div className="text-xs text-purple-700 mt-1">
                      Step {progress.current} of {progress.total}
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2 mt-3">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full-size Image Viewer Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={closeImageViewer}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={viewingImage.startsWith('data:') ? viewingImage : `data:image/png;base64,${viewingImage}`}
              alt="Full size view"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterTurnaroundPanel;
