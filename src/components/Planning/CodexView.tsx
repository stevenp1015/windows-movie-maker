import { useState } from 'react';
import { User, MapPin, Palette, Camera, Book, ChevronDown, ChevronRight } from 'lucide-react';
import { type VisualBible } from '../../types';

interface CodexViewProps {
  visualBible: VisualBible;
  onEdit?: (section: string, id: string) => void;
}

const CodexView: React.FC<CodexViewProps> = ({ visualBible, onEdit }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['characters']));

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

  const SectionHeader = ({ id, icon: Icon, title, count }: { id: string; icon: any; title: string; count: number }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-3 rounded-12 bg-white/30 hover:bg-white/40 transition-all mb-2"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-bold uppercase tracking-wider">{title}</span>
        <span className="text-xs text-[var(--text-secondary)]">({count})</span>
      </div>
      {expandedSections.has(id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
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
        {expandedSections.has('characters') && (
          <div className="space-y-2 pl-4">
            {Object.entries(visualBible.characters).map(([id, char]) => (
              <div key={id} className="reflective-card p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-sm">{char.name}</h4>
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card expansion if we add that later
                        console.log('Edit clicked for:', id);
                        onEdit('character', id);
                      }}
                      className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 rounded hover:bg-black/5 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-2">{char.description}</p>
                <div className="text-xs space-y-1">
                  <div><span className="font-medium">Hair:</span> {char.appearance.hair}</div>
                  <div><span className="font-medium">Eyes:</span> {char.appearance.eyes}</div>
                  <div><span className="font-medium">Build:</span> {char.appearance.build}</div>
                  <div><span className="font-medium">Attire:</span> {char.appearance.attire}</div>
                  {char.appearance.distinguishingMarks && (
                    <div><span className="font-medium">Marks:</span> {char.appearance.distinguishingMarks}</div>
                  )}
                  {char.keyFeatures.length > 0 && (
                    <div className="mt-2">
                      <span className="font-medium">Key Features:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {char.keyFeatures.map((feature, i) => (
                          <span key={i} className="px-2 py-0.5 bg-black/5 rounded text-xs">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {Object.keys(visualBible.characters).length === 0 && (
              <p className="text-xs text-[var(--text-muted)] italic pl-2">No characters defined yet</p>
            )}
          </div>
        )}
      </div>

      {/* Settings */}
      <div>
        <SectionHeader
          id="settings"
          icon={MapPin}
          title="Settings"
          count={Object.keys(visualBible.settings).length}
        />
        {expandedSections.has('settings') && (
          <div className="space-y-2 pl-4">
            {Object.entries(visualBible.settings).map(([id, setting]) => (
              <div key={id} className="reflective-card p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-sm">{setting.name}</h4>
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Edit clicked for setting:', id);
                        onEdit('setting', id);
                      }}
                      className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 rounded hover:bg-black/5 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-2">{setting.locationDescription}</p>
                <div className="text-xs space-y-1">
                  {setting.timePeriod && <div><span className="font-medium">Era:</span> {setting.timePeriod}</div>}
                  <div><span className="font-medium">Atmosphere:</span> {setting.atmosphere}</div>
                  {setting.keyVisualElements.length > 0 && (
                    <div className="mt-2">
                      <span className="font-medium">Visual Elements:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {setting.keyVisualElements.map((elem, i) => (
                          <span key={i} className="px-2 py-0.5 bg-black/5 rounded text-xs">
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
              <p className="text-xs text-[var(--text-muted)] italic pl-2">No settings defined yet</p>
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
        {expandedSections.has('palette') && (
          <div className="pl-4">
            <div className="reflective-card p-3">
              <div className="text-xs space-y-2">
                <div><span className="font-medium">Mood:</span> {visualBible.colorPalette.mood}</div>
                <div><span className="font-medium">Description:</span> {visualBible.colorPalette.description}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {visualBible.colorPalette.hexCodes.map((hex, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-black/10"
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
        {expandedSections.has('cinematography') && (
          <div className="pl-4">
            <div className="reflective-card p-3 text-xs space-y-1">
              <div><span className="font-medium">Lens:</span> {visualBible.cinematography.lensType}</div>
              <div><span className="font-medium">Film Grain:</span> {visualBible.cinematography.filmGrain}</div>
              <div><span className="font-medium">Lighting:</span> {visualBible.cinematography.lightingStyle}</div>
              <div><span className="font-medium">Movement:</span> {visualBible.cinematography.cameraMovement}</div>
              <div><span className="font-medium">Angles:</span> {visualBible.cinematography.cameraAngles}</div>
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
          count={visualBible.narrativeThemes.length + visualBible.keyMotifs.length}
        />
        {expandedSections.has('themes') && (
          <div className="pl-4 space-y-2">
            {visualBible.narrativeThemes.length > 0 && (
              <div className="reflective-card p-3">
                <h5 className="text-xs font-bold mb-2">Narrative Themes</h5>
                <div className="flex flex-wrap gap-1">
                  {visualBible.narrativeThemes.map((theme, i) => (
                    <span key={i} className="px-2 py-1 bg-black/5 rounded text-xs">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {visualBible.keyMotifs.length > 0 && (
              <div className="reflective-card p-3">
                <h5 className="text-xs font-bold mb-2">Visual Motifs</h5>
                <div className="space-y-2">
                  {visualBible.keyMotifs.map((motif, i) => (
                    <div key={i} className="text-xs">
                      <div className="font-medium">{motif.description}</div>
                      <div className="text-[var(--text-secondary)] flex flex-wrap gap-1 mt-1">
                        {motif.visualExamples.map((ex, j) => (
                          <span key={j} className="px-2 py-0.5 bg-black/5 rounded">
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
