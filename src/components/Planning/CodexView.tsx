import React, { useState } from "react";
import {
  User,
  MapPin,
  Palette,
  Camera,
  Book,
  ChevronDown,
  ChevronRight,
  Edit2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { type VisualBible } from "../../types";

// --------------------------------------------------------------------------
// GLASS STYLES (Renamed as requested)
// --------------------------------------------------------------------------

interface CodexViewProps {
  visualBible: VisualBible;
  onEdit?: (section: string, id: string) => void;
}

const CodexView: React.FC<CodexViewProps> = ({ visualBible, onEdit }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["characters"])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const SectionHeader = ({
    id,
    icon: Icon,
    title,
    count,
  }: {
    id: string;
    icon: any;
    title: string;
    count: number;
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-3 rounded-4xl bg-white/30 hover:bg-white/40 transition-all mb-2"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-bold uppercase tracking-wider">
          {title}
        </span>
        <span className="text-xs text-[var(--text-secondary)]">({count})</span>
      </div>
      {expandedSections.has(id) ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Characters */}
      <div>
        <SectionHeader
          id="characters"
          icon={User}
          title="Characters"
          count={Object.keys(visualBible.characters).length}
        />
        {expandedSections.has("characters") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-2 pt-4">
            {Object.entries(visualBible.characters).map(([id, char]) => (
              <div key={id} className="glass-container">
                {/* 1. Physical Shell */}
                <div className="glass-shell" />

                {/* 2. Rim Light WHY THE FUCK IS THIS MAKING MY GPU MELT? ITS SO FUCKING SIMPLE.  */}
                <div className="glass-rim">
                  <div className="rim-spinner" />
                </div>

                {/* 3. Sheen  (NOT EVEN FUCKING USING THIS RIGHT NOW BUT KEEPING FOR LATER*/}
                {/*<div className="glass-sheen">*/}
                {/*<div className="sheen-wiper" />*/}
                {/*</div>*/}

                {/* 4. Flares THESE ARE LIT JUST FUCKING LINES */}
                {/*<div className="flare-top-left" />*/}
                <div className="flare-bottom-right" />
                <div className="flare-bottom" />
                {/*<div className="flare-left" />*/}

                {/* 5. Moat (The Content) */}
                <div className="glass-moat flex flex-col">
                  <div className="moat-reflection" />

                  {/* Actual Content in the Moat */}
                  {/* HEADER IMAGE SECTION */}
                  <div className="relative w-full h-56 overflow-hidden flex-shrink-0 bg-slate-900 group">
                    {(() => {
                      const isValidUrl = (url: string | undefined): url is string =>
                        typeof url === 'string' && (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:'));

                      const validVisualRef = char.appearance.visualReferences?.find(isValidUrl);
                      const turnaroundRef = visualBible.characterTurnarounds?.[id]?.views?.front?.base64;
                      const validTurnaround = isValidUrl(turnaroundRef) ? turnaroundRef : undefined;
                      const imageSrc = validVisualRef || validTurnaround;

                      if (imageSrc) {
                        return (
                          <img
                            src={imageSrc}
                            alt={char.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        );
                      }
                      return (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                          <span className="text-slate-400 font-bold text-4xl opacity-20 uppercase tracking-widest">No Signal</span>
                        </div>
                      );
                    })()}

                    {/* Name Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90" />
                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <h4 className="font-bold text-2xl text-white tracking-tight drop-shadow-md">
                        {char.name}
                      </h4>
                      <div className="text-xs text-purple-300 font-medium tracking-wider uppercase opacity-80">
                        {char.emotionalArc.split(' ').slice(0, 4).join(' ')}...
                      </div>
                    </div>

                    {/* Edit Button (Absolute Top Right) */}
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit("character", id);
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* CONTENT BODY */}
                  <div className="px-5 py-3 flex-1 flex flex-col space-y-4 overflow-y-auto scrollbar- ">

                    {/* Description */}
                    <p className="text-sm text-slate-600 leading-[1.25] font-light">
                      {char.description}
                    </p>

                    {/* Key Features Tags */}
                    {char.keyFeatures.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {char.keyFeatures.slice(0, 4).map((feature, i) => (
                          <span key={i} className="px-2 py-1 rounded-lg bg-slate-50/80 shadow-[inset_0px_0px_3px_-1px_#00005050] text-[10px] text-slate-400 uppercase tracking-wide">
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Hair</span>
                        <span className="text-xs text-slate-400 truncate" title={char.appearance.hair}>{char.appearance.hair}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Eyes</span>
                        <span className="text-xs text-slate-400 truncate" title={char.appearance.eyes}>{char.appearance.eyes}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Build</span>
                        <span className="text-xs text-slate-400 truncate" title={char.appearance.build}>{char.appearance.build}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Attire</span>
                        <span className="text-xs text-slate-400 truncate" title={char.appearance.attire}>{char.appearance.attire}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(visualBible.characters).length === 0 && (
              <p className="text-xs text-[var(--text-muted)] italic pl-2">
                No characters defined yet
              </p>
            )}
          </div>
        )}
      </div>

      {/* Settings (Keeping standard cards for contrast, or update if desired) */}
      <div>
        <SectionHeader
          id="settings"
          icon={MapPin}
          title="Settings"
          count={Object.keys(visualBible.settings).length}
        />
        {expandedSections.has("settings") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-4">
            {Object.entries(visualBible.settings).map(([id, setting]) => (
              <div
                key={id}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-sm">{setting.name}</h4>
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit("setting", id);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  {setting.locationDescription}
                </p>
                <div className="text-xs space-y-1">
                  {setting.timePeriod && (
                    <div>
                      <span className="font-medium">Era:</span>{" "}
                      {setting.timePeriod}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Atmosphere:</span>{" "}
                    {setting.atmosphere}
                  </div>
                  {setting.keyVisualElements.length > 0 && (
                    <div className="mt-2">
                      <span className="font-medium">Visual Elements:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {setting.keyVisualElements.map((elem, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-slate-100 rounded text-xs"
                          >
                            {elem}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {Object.keys(visualBible.settings).length === 0 && (
              <p className="text-xs text-[var(--text-muted)] italic pl-2">
                No settings defined yet
              </p>
            )}
          </div>
        )}
      </div>

      {/* Color Palette */}
      <div>
        <SectionHeader
          id="palette"
          icon={Palette}
          title="Color Palette"
          count={visualBible.colorPalette.hexCodes.length}
        />
        {expandedSections.has("palette") && (
          <div className="pl-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="text-xs space-y-2">
                <div>
                  <span className="font-medium">Mood:</span>{" "}
                  {visualBible.colorPalette.mood}
                </div>
                <div>
                  <span className="font-medium">Description:</span>{" "}
                  {visualBible.colorPalette.description}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {visualBible.colorPalette.hexCodes.map((hex, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-black/10 shadow-sm"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-xs font-mono">{hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cinematography */}
      <div>
        <SectionHeader
          id="cinematography"
          icon={Camera}
          title="Cinematography"
          count={1}
        />
        {expandedSections.has("cinematography") && (
          <div className="pl-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-xs space-y-1">
              <div>
                <span className="font-medium">Lens:</span>{" "}
                {visualBible.cinematography.lensType}
              </div>
              <div>
                <span className="font-medium">Film Grain:</span>{" "}
                {visualBible.cinematography.filmGrain}
              </div>
              <div>
                <span className="font-medium">Lighting:</span>{" "}
                {visualBible.cinematography.lightingStyle}
              </div>
              <div>
                <span className="font-medium">Movement:</span>{" "}
                {visualBible.cinematography.cameraMovement}
              </div>
              <div>
                <span className="font-medium">Angles:</span>{" "}
                {visualBible.cinematography.cameraAngles}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Themes & Motifs */}
      <div>
        <SectionHeader
          id="themes"
          icon={Book}
          title="Themes & Motifs"
          count={
            visualBible.narrativeThemes.length + visualBible.keyMotifs.length
          }
        />
        {expandedSections.has("themes") && (
          <div className="pl-4 space-y-2">
            {visualBible.narrativeThemes.length > 0 && (
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                <h5 className="text-xs font-bold mb-2">Narrative Themes</h5>
                <div className="flex flex-wrap gap-1">
                  {visualBible.narrativeThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-slate-100 rounded text-xs"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {visualBible.keyMotifs.length > 0 && (
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                <h5 className="text-xs font-bold mb-2">Visual Motifs</h5>
                <div className="space-y-2">
                  {visualBible.keyMotifs.map((motif, i) => (
                    <div key={i} className="text-xs">
                      <div className="font-medium">{motif.description}</div>
                      <div className="text-slate-500 flex flex-wrap gap-1 mt-1">
                        {motif.visualExamples.map((ex, j) => (
                          <span
                            key={j}
                            className="px-2 py-0.5 bg-slate-100 rounded"
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodexView;
