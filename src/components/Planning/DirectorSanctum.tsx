import { useEffect, useState } from "react";
import { FilmIcon, Send, Film } from "lucide-react";
import {
  type VisualBible,
  type ChatMessage,
  type CharacterTurnaround,
} from "../../types";
import CodexView from "./CodexView";
import CharacterTurnaroundPanel from "./CharacterTurnaroundPanel";

interface DirectorSanctumProps {
  visualBible: VisualBible;
  messages: ChatMessage[];
  onGenerateVisualBible: (
    narrative: string,
    styleNotes: string
  ) => Promise<void>;
  onGenerateScenes: (narrative: string) => Promise<void>;
  onSendMessage: (text: string) => void;
  onUpdateBible: (updates: Partial<VisualBible>) => void;
  phase: "planning" | "decomposition" | "production" | "review";
}

const DirectorSanctum: React.FC<DirectorSanctumProps> = ({
  visualBible,
  onGenerateVisualBible,
  onGenerateScenes,
  onUpdateBible,
  phase,
}) => {
  const [narrative, setNarrative] = useState("");
  const [styleNotes, setStyleNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeEditorItem, setActiveEditorItem] = useState<{
    type: "character" | "setting";
    id: string;
  } | null>(null);

  useEffect(() => {
    console.log(
      "DirectorSanctum: activeEditorItem changed to:",
      activeEditorItem
    );
  }, [activeEditorItem]);

  const handleGenerateVisualBible = async () => {
    if (!narrative.trim()) return;
    setIsGenerating(true);
    try {
      await onGenerateVisualBible(narrative, styleNotes);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateScenes = async () => {
    if (!narrative.trim()) return;
    setIsGenerating(true);
    try {
      await onGenerateScenes(narrative);
    } finally {
      setIsGenerating(false);
    }
  };

  if (phase === "planning") {
    return (
      <div className="!w-full flex flex-1 items-start justify-start bg-cyan-500 h-full p-6 space-y-6">

        <div>
          <h2
            className="text-4xl text-zinc-200 font-bold mb-6">
            Director's Sanctum
          </h2>
          <p
            className="text-sm text-zinc-400 p-4">
            You put your shit here, and we'll make it into a movie.
          </p>
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 flex flex-col">
            <label
              className="text-sm text-zinc-200 font-medium mb-2">
              Narrative
            </label>
            <div className="rim-spinner"></div>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Paste your story, novel, screenplay, or narrative here..."
              className={`flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-light shadow-sm transition-all focus:shadow-inner focus:outline-none resize-none 
                ${narrative
                  ? "not-italic"
                  : "italic text-gray-400"
                }`}
            />
          </div>

          <div className="flex flex-col">
            <label
              className="text-sm font-medium mb-2">
              Style Notes (Optional)
            </label>
            <textarea
              value={styleNotes}
              onChange={(e) => setStyleNotes(e.target.value)}
              placeholder="Style notes . . ."
              className={`border border-slate-200 rounded-xl px-3 py-2 text-xs font-light italic shadow-sm transition-all focus:shadow-inner focus:outline-none resize-none h-24 
                ${styleNotes
                  ? "not-italic"
                  : "italic text-gray-400"
                }`}
            />
          </div>

          <button
            onClick={handleGenerateVisualBible}
            disabled={!narrative.trim() || isGenerating}
            className="w-full bg-slate-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Film className="w-3 h-3 text-slate-200" />
            {isGenerating
              ? "Generating Visual Bible..."
              : "Generate Visual Bible"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "decomposition") {
    const [activeTab, setActiveTab] = useState<"codex" | "turnarounds">("codex");

    return (
      <div className="flex flex-col h-full w-full border-r border-white/10 bg-white/5 backdrop-blur-sm translatez-0">

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-2xl text-zinc-200 font-bold mb-2">Visual Bible</h2>
          <p
            className="text-sm text-zinc-400 mb-4">
            Your comprehensive reference sheet for visual consistency
          </p>

          {/* Tabs */}
          <div className="flex gap-2">

            {/* CODEX TAB */}
            <button
              onClick={() => setActiveTab("codex")}
              className={`tab-button ${activeTab === "codex"
                ? "tab-button-active white-lamp"
                : "tab-button-inactive tab-button-inactive-codex white-lamp-muted"
                }`}
            >
              <span
                className="tab-text-rainbow-codex">
                Codex
              </span>

              {/* Shimmer Overlay */}
              {activeTab === "codex" && (
                <div className="tab-shimmer-overlay">
                  <div className="tab-shimmer-gradient animate-shimmer" />
                </div>
              )}
            </button>


            {/* Character Solidification (Turnarounds) Tab */}
            <button
              onClick={() => setActiveTab("turnarounds")}
              className={`tab-button ${activeTab === "turnarounds"
                ? "tab-button-active white-lamp"
                : "tab-button-inactive tab-button-inactive-turnaround white-lamp-muted"
                }`}
            >
              <span
                className={`tab-text-rainbow-turnaround ${activeTab === "turnarounds"
                  ? ""
                  : "tab-text-rainbow-turnaround-inactive"
                  }`}>
                Character Solidification
              </span>

              {/* Shimmer Overlay */}
              {activeTab === "turnarounds" && (
                <div className="tab-shimmer-overlay">
                  <div className="tab-shimmer-gradient animate-shimmer" />
                </div>
              )}
            </button>

          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === "codex" && (
            <div className="p-6">
              <CodexView
                visualBible={visualBible}
                activeEditorItem={activeEditorItem}
                onEdit={(type, id) => {
                  if (document.startViewTransition) {
                    document.startViewTransition(() => {
                      setActiveEditorItem({
                        type: type as "character" | "setting",
                        id,
                      });
                    });
                  } else {
                    setActiveEditorItem({
                      type: type as "character" | "setting",
                      id,
                    });
                  }
                }}
                onCloseEditor={() => {
                  if (document.startViewTransition) {
                    document.startViewTransition(() => {
                      setActiveEditorItem(null);
                    });
                  } else {
                    setActiveEditorItem(null);
                  }
                }}
                onUpdateBible={onUpdateBible}
              />
            </div>
          )}

          {activeTab === "turnarounds" && (
            <CharacterTurnaroundPanel
              visualBible={visualBible}
              onTurnaroundGenerated={(characterId, turnaround) => {
                onUpdateBible({
                  characterTurnarounds: {
                    ...visualBible.characterTurnarounds,
                    [characterId]: turnaround,
                  },
                });
              }}
            />
          )}

          {/* Generate Scenes Section - now an expandable details element */}
          <div className="p-6 pt-0">
            <details className="border border-white/20 rounded-3xl p-4 bg-white/10">
              <summary className="cursor-pointer text-sm font-bold uppercase tracking-wider flex items-center justify-between select-none">
                Generate Scenes
                <span className="text-xs text-[var(--text-secondary)] normal-case font-normal ml-2">
                  (Click to expand)
                </span>
              </summary>
              <div className="mt-4">
                <p className="text-xs text-[var(--text-secondary)] mb-3">
                  <span className="font-semibold opacity-70">
                    Paste your full narrative below to break it into individual
                    scenes for production
                  </span>
                </p>
                <textarea
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Paste your complete narrative here (the same one you used for Visual Bible, I have no idea why this is even here..."
                  className="w-full bg-white/50 border border-black/10 rounded p-4 text-sm focus:outline-none focus:border-black/30 resize-none h-40 mb-3"
                />
                <button
                  onClick={handleGenerateScenes}
                  disabled={isGenerating || !narrative.trim()}
                  className="w-full bg-black text-white px-6 py-3 rounded font-medium flex items-center justify-center gap-2 hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                  {isGenerating
                    ? "Breaking Into Scenes..."
                    : `Generate Scenes (${visualBible.granularityLevel})`}
                </button>
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Granularity: <strong>{visualBible.granularityLevel}</strong> •
                  This will create{" "}
                  {visualBible.granularityLevel === "Sentence by Sentence"
                    ? "many"
                    : visualBible.granularityLevel === "Key Beats"
                      ? "fewer"
                      : "moderate"}{" "}
                  scenes
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    );
  }

  // Production/Review phase - simple config panel
  return (
    <div className="p-6 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider">
        Configuration
      </h3>

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Project Name
        </label>
        <input
          type="text"
          value={visualBible.name}
          onChange={(e) => onUpdateBible({ name: e.target.value })}
          className="w-full bg-white/50 border border-white/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-black/20"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          Granularity
        </label>
        <select
          value={visualBible.granularityLevel}
          onChange={(e) =>
            onUpdateBible({
              granularityLevel: e.target
                .value as VisualBible["granularityLevel"],
            })
          }
          className="w-full bg-white/50 border border-white/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-black/20"
        >
          <option>Detailed Paragraph</option>
          <option>Sentence by Sentence</option>
          <option>Key Beats</option>
        </select>
      </div>
    </div>
  );
};

export default DirectorSanctum;
