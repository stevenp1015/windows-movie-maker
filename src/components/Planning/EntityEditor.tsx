import React, { useState } from 'react';
import { type PreCreatedEntity } from '../../types/preEntity';
import { ImageUploader } from '../Common/ImageUploader';

interface EntityEditorProps {
    entity?: PreCreatedEntity;
    entityType: 'character' | 'setting' | 'prop';
    onSave: (entity: PreCreatedEntity) => void;
    onCancel: () => void;
}

export const EntityEditor: React.FC<EntityEditorProps> = ({
    entity,
    entityType,
    onSave,
    onCancel,
}) => {
    const [name, setName] = useState(entity?.name || '');
    const [description, setDescription] = useState(entity?.description || '');
    const [miscNotes, setMiscNotes] = useState(entity?.miscNotes || '');

    // Character fields
    const [turnaroundFront, setTurnaroundFront] = useState<string[]>(
        entity?.turnaroundImages?.front ? [entity.turnaroundImages.front] : []
    );
    const [turnaroundSideLeft, setTurnaroundSideLeft] = useState<string[]>(
        entity?.turnaroundImages?.sideLeft ? [entity.turnaroundImages.sideLeft] : []
    );
    const [turnaroundSideRight, setTurnaroundSideRight] = useState<string[]>(
        entity?.turnaroundImages?.sideRight ? [entity.turnaroundImages.sideRight] : []
    );
    const [turnaroundBack, setTurnaroundBack] = useState<string[]>(
        entity?.turnaroundImages?.back ? [entity.turnaroundImages.back] : []
    );

    // Setting fields
    const [locationType, setLocationType] = useState<'interior' | 'exterior' | 'mixed'>(
        entity?.locationType || 'interior'
    );

    // Prop fields
    const [significance, setSignificance] = useState(entity?.significance || '');

    // General references (all types)
    const [generalReferences, setGeneralReferences] = useState<string[]>(
        entity?.generalReferences || []
    );

    const handleSave = () => {
        const newEntity: PreCreatedEntity = {
            id: entity?.id || `${entityType}_${Date.now()}`,
            type: entityType,
            name,
            description,
            miscNotes,
            generalReferences,
        };

        if (entityType === 'character') {
            newEntity.turnaroundImages = {
                front: turnaroundFront[0],
                sideLeft: turnaroundSideLeft[0],
                sideRight: turnaroundSideRight[0],
                back: turnaroundBack[0],
            };
        }

        if (entityType === 'setting') {
            newEntity.locationType = locationType;
        }

        if (entityType === 'prop') {
            newEntity.significance = significance;
        }

        onSave(newEntity);
    };

    return (
        <div className="glass-panel p-6 space-y-4 max-w-3xl">
            <h3 className="text-xl font-bold text-white capitalize">
                {entity ? `Edit ${entityType}` : `New ${entityType}`}
            </h3>

            {/* Name */}
            <div>
                <label className="text-sm text-zinc-200 font-medium mb-2">Name *</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg
                        text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                    placeholder={`Enter ${entityType} name`}
                />
            </div>

            {/* Description */}
            <div>
                <label className="text-sm text-zinc-200 font-medium mb-2">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg
                        text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400
                        resize-none"
                    placeholder={`Describe this ${entityType}...`}
                />
            </div>

            {/* Miscellaneous Notes */}
            <div>
                <label className="text-sm text-zinc-200 font-medium mb-2">
                    Miscellaneous Notes
                    <span className="text-xs text-zinc-500 ml-2">(for AI generation)</span>
                </label>
                <textarea
                    value={miscNotes}
                    onChange={(e) => setMiscNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg
                        text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400
                        resize-none"
                    placeholder="Any additional notes that don't fit in the description..."
                />
            </div>

            {/* Character-specific fields */}
            {entityType === 'character' && (
                <div className="space-y-4 border-t border-white/10 pt-4">
                    <h4 className="text-sm font-semibold text-cyan-400">Character Turnarounds (Optional)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <ImageUploader
                            label="Front View"
                            hint="Upload front view"
                            maxImages={1}
                            currentImages={turnaroundFront}
                            onImagesChange={setTurnaroundFront}
                        />
                        <ImageUploader
                            label="Side Left View"
                            hint="Upload left side"
                            maxImages={1}
                            currentImages={turnaroundSideLeft}
                            onImagesChange={setTurnaroundSideLeft}
                        />
                        <ImageUploader
                            label="Side Right View"
                            hint="Upload right side"
                            maxImages={1}
                            currentImages={turnaroundSideRight}
                            onImagesChange={setTurnaroundSideRight}
                        />
                        <ImageUploader
                            label="Back View"
                            hint="Upload back view"
                            maxImages={1}
                            currentImages={turnaroundBack}
                            onImagesChange={setTurnaroundBack}
                        />
                    </div>
                </div>
            )}

            {/* Setting-specific fields */}
            {entityType === 'setting' && (
                <div className="space-y-4 border-t border-white/10 pt-4">
                    <div>
                        <label className="text-sm text-zinc-200 font-medium mb-2">Location Type</label>
                        <select
                            value={locationType}
                            onChange={(e) => setLocationType(e.target.value as any)}
                            className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg
                       text-white focus:outline-none focus:border-cyan-400"
                        >
                            <option value="interior">Interior</option>
                            <option value="exterior">Exterior</option>
                            <option value="mixed">Mixed</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Prop-specific fields */}
            {entityType === 'prop' && (
                <div className="space-y-4 border-t border-white/10 pt-4">
                    <div>
                        <label className="text-sm text-zinc-200 font-medium mb-2">Significance</label>
                        <input
                            type="text"
                            value={significance}
                            onChange={(e) => setSignificance(e.target.value)}
                            className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg
                       text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                            placeholder="Why is this prop important?"
                        />
                    </div>
                </div>
            )}

            {/* General Reference Images (all types) */}
            <div className="border-t border-white/10 pt-4">
                <ImageUploader
                    label="General Reference Images"
                    hint="Upload additional reference images"
                    maxImages={10}
                    currentImages={generalReferences}
                    onImagesChange={setGeneralReferences}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <button
                    onClick={handleSave}
                    disabled={!name.trim()}
                    className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-700
                   text-white rounded-lg font-medium transition-colors
                   disabled:cursor-not-allowed disabled:text-zinc-500"
                >
                    {entity ? 'Update' : 'Create'} {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
                </button>
                <button
                    onClick={onCancel}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white
                   rounded-lg font-medium transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};
