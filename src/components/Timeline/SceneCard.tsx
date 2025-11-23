import React, { useState } from 'react';
import { type SceneNode } from '../../types';
import { 
  Image as ImageIcon, 
  Film, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit3,
  ThumbsUp,
  MessageSquare,
  Zap,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface SceneCardProps {
  scene: SceneNode;
  onRegenerate: (id: string, customPrompt?: string) => void;
  onForceApprove?: (id: string) => void;
  onInjectFeedback?: (id: string, feedback: string) => void;
  onViewImage?: (base64: string) => void;
}

const SceneCard: React.FC<SceneCardProps> = ({ 
  scene, 
  onRegenerate, 
  onForceApprove,
  onInjectFeedback,
  onViewImage 
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [feedbackInput, setFeedbackInput] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    if (status.includes('failed')) return 'var(--accent-error)';
    if (status.includes('validated') || status === 'complete') return 'var(--accent-success)';
    if (status.includes('generating')) return 'var(--accent-warning)';
    return 'var(--text-muted)';
  };

  const getStatusLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      'pending': 'QUEUE',
      'planning_failed': 'PLAN FAIL',
      'image_generating': 'GEN IMG',
      'image_failed': 'IMG FAIL',
      'image_validated': 'VALIDATED',
      'image_failed_retries': 'NEEDS REVIEW',
      'video_generating': 'GEN VID',
      'video_failed': 'VID FAIL',
      'complete': 'COMPLETE'
    };
    return labelMap[status] || status.toUpperCase();
  };

  // Generate AI summary from narrative segment (first 100 chars or until period)
  const sceneSummary = scene.narrativeSegment.length > 100 
    ? scene.narrativeSegment.substring(0, scene.narrativeSegment.indexOf('.') + 1 || 100) + '...'
    : scene.narrativeSegment;

  const requiresIntervention = scene.overallStatus === 'image_failed_retries' || 
                                scene.overallStatus === 'image_failed';

  const latestValidation = scene.validationLog[scene.validationLog.length - 1];

  return (
    <div className={`reflective-card w-96 flex-shrink-0 flex flex-col bg-white border-2 ${
      requiresIntervention ? 'border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.3)]' : 'border-white/60'
    }`}>
      {/* Header */}
      <div className="p-3 border-b border-black/10 bg-white/50 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="font-mono text-sm font-bold text-[var(--text-primary)]">
            SCENE {scene.index + 1}
          </span>
          <div className="flex items-center gap-2">
            <span 
              className="text-[10px] font-mono px-2 py-0.5 rounded border"
              style={{ 
                color: getStatusColor(scene.overallStatus),
                borderColor: getStatusColor(scene.overallStatus)
              }}
            >
              {getStatusLabel(scene.overallStatus)}
            </span>
            <div 
              className="w-2 h-2 rounded-full animate-pulse" 
              style={{ backgroundColor: getStatusColor(scene.overallStatus) }}
            />
          </div>
        </div>
        
        {/* Scene Summary (Human-Readable) */}
        <p className="text-xs text-[var(--text-secondary)] italic">
          {sceneSummary}
        </p>
      </div>

      {/* Image/Video Display */}
      <div className="aspect-video bg-gray-100 relative group overflow-hidden">
        {scene.imageData?.base64 ? (
          <>
            <img 
              src={`data:image/png;base64,${scene.imageData.base64}`}
              alt={`Scene ${scene.index + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => onViewImage?.(scene.imageData!.base64)}
            />
            {/* Image Overlay Controls */}
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button 
                onClick={() => onViewImage?.(scene.imageData!.base64)}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="View Full Size"
              >
                <Eye className="w-4 h-4 text-black" />
              </button>
              <button 
                onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Regenerate with Custom Prompt"
              >
                <RefreshCw className="w-4 h-4 text-black" />
              </button>
              {requiresIntervention && onForceApprove && (
                <button 
                  onClick={() => onForceApprove(scene.id)}
                  className="p-2 bg-green-500 rounded-full hover:bg-green-600 transition-colors"
                  title="Force Approve"
                >
                  <ThumbsUp className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)]">
            <ImageIcon className="w-12 h-12 mb-2 opacity-20 animate-pulse" />
            <span className="text-xs font-mono">
              {scene.overallStatus === 'pending' ? 'QUEUED' : 'GENERATING...'}
            </span>
            {scene.imageData?.attempts && scene.imageData.attempts > 0 && (
              <span className="text-[10px] mt-1 font-mono text-orange-500">
                ATTEMPT {scene.imageData.attempts}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Custom Prompt Input (shown on demand) */}
      {showCustomPrompt && (
        <div className="p-3 bg-blue-50 border-b border-blue-200">
          <label className="text-xs font-bold mb-1 block">Custom Prompt Override:</label>
          <textarea
            className="w-full px-2 py-1 text-xs border rounded font-mono"
            rows={3}
            placeholder="Enter custom prompt or leave blank to use AI-generated prompt..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                onRegenerate(scene.id, customPrompt || undefined);
                setShowCustomPrompt(false);
                setCustomPrompt('');
              }}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Regenerate
            </button>
            <button
              onClick={() => {
                setShowCustomPrompt(false);
                setCustomPrompt('');
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Intervention Warning */}
      {requiresIntervention && (
        <div className="p-3 bg-red-50 border-b border-red-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-red-900">USER INTERVENTION REQUIRED</p>
            <p className="text-xs text-red-700 mt-1">
              Max retries exhausted. Review validation feedback below and either:
            </p>
            <div className="flex gap-2 mt-2">
              {onForceApprove && (
                <button
                  onClick={() => onForceApprove(scene.id)}
                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1"
                >
                  <ThumbsUp className="w-3 h-3" />
                  Force Approve
                </button>
              )}
              <button
                onClick={() => setShowCustomPrompt(true)}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                Custom Regen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Sections */}
      <div className="p-3 flex-1 flex flex-col gap-2 text-xs">
        
        {/* FULL NARRATIVE SEGMENT */}
        <button
          onClick={() => toggleSection('narrative')}
          className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3" />
            <span className="font-bold">Full Narrative</span>
          </div>
          {expandedSections.has('narrative') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {expandedSections.has('narrative') && (
          <div className="pl-5 pr-2 py-2 bg-gray-50/50 rounded text-xs text-[var(--text-secondary)] italic border-l-2 border-gray-300">
            "{scene.narrativeSegment}"
          </div>
        )}

        {/* AI-GENERATED IMAGE PROMPT */}
        <button
          onClick={() => toggleSection('prompt')}
          className="flex items-center justify-between p-2 bg-purple-50 rounded hover:bg-purple-100"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-purple-600" />
            <span className="font-bold text-purple-900">Image Generation Prompt</span>
          </div>
          {expandedSections.has('prompt') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {expandedSections.has('prompt') && (
          <div className="pl-5 pr-2 py-2 bg-purple-50/50 rounded text-xs font-mono border-l-2 border-purple-300 max-h-40 overflow-y-auto">
            {scene.currentImagePrompt || scene.basePrompt || 'No prompt generated yet'}
          </div>
        )}

        {/* VALIDATION REPORTS */}
        {scene.validationLog.length > 0 && (
          <>
            <button
              onClick={() => toggleSection('validation')}
              className={`flex items-center justify-between p-2 rounded ${
                latestValidation?.passed 
                  ? 'bg-green-50 hover:bg-green-100' 
                  : 'bg-red-50 hover:bg-red-100'
              }`}
            >
              <div className="flex items-center gap-2">
                {latestValidation?.passed ? (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-600" />
                )}
                <span className={`font-bold ${latestValidation?.passed ? 'text-green-900' : 'text-red-900'}`}>
                  Validation ({scene.validationLog.length})
                </span>
                <span className={`text-[10px] font-mono ${latestValidation?.passed ? 'text-green-700' : 'text-red-700'}`}>
                  Score: {latestValidation?.score}/10
                </span>
              </div>
              {expandedSections.has('validation') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expandedSections.has('validation') && (
              <div className="pl-5 pr-2 py-2 space-y-2">
                {scene.validationLog.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2 rounded border-l-2 ${
                      log.passed ? 'bg-green-50/50 border-green-400' : 'bg-red-50/50 border-red-400'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono font-bold">{log.type}</span>
                      <span className="text-[10px] font-mono">{log.score}/10</span>
                    </div>
                    <p className="text-xs text-gray-700 mb-1">{log.critique}</p>
                    {log.fixInstructions && (
                      <div className="mt-2 pt-2 border-t border-black/10">
                        <span className="text-[10px] font-bold text-orange-700">FIX INSTRUCTIONS:</span>
                        <p className="text-xs text-orange-900 mt-1">{log.fixInstructions}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* INJECT FEEDBACK */}
        {onInjectFeedback && (
          <>
            <button
              onClick={() => toggleSection('feedback')}
              className="flex items-center justify-between p-2 bg-blue-50 rounded hover:bg-blue-100"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3 h-3 text-blue-600" />
                <span className="font-bold text-blue-900">Inject Feedback</span>
              </div>
              {expandedSections.has('feedback') ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expandedSections.has('feedback') && (
              <div className="pl-5 pr-2 py-2 bg-blue-50/50 rounded border-l-2 border-blue-300">
                <textarea
                  className="w-full px-2 py-1 text-xs border rounded"
                  rows={3}
                  placeholder="Describe what should be changed in this scene..."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (feedbackInput.trim()) {
                      onInjectFeedback(scene.id, feedbackInput);
                      setFeedbackInput('');
                    }
                  }}
                  disabled={!feedbackInput.trim()}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Feedback
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-black/5 bg-white/30">
        <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-muted)]">
          <div className="flex gap-3">
            {scene.videoData?.uri && (
              <div className="flex items-center gap-1 text-green-600">
                <Film className="w-3 h-3" />
                <span>VIDEO</span>
              </div>
            )}
            {scene.imageData?.base64 && (
              <div className="flex items-center gap-1 text-blue-600">
                <ImageIcon className="w-3 h-3" />
                <span>IMAGE</span>
              </div>
            )}
          </div>
          <span>
            {scene.imageData?.attempts || 0} ATTEMPTS
          </span>
        </div>
      </div>
    </div>
  );
};

export default SceneCard;
