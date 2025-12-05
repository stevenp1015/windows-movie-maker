import React, { useState } from 'react';
import { type PreCreatedEntity } from '../../types/preEntity';
import { EntityEditor } from './EntityEditor';

interface EntityCreationPanelProps {
    entities: PreCreatedEntity[];
    onEntitiesChange: (entities: PreCreatedEntity[]) => void;
}

export const EntityCreationPanel: React.FC<EntityCreationPanelProps> = ({
    entities,
    onEntitiesChange,
}) => {
    const [activeTab, setActiveTab] = useState<'character' | 'setting' | 'prop'>('character');
    const [editingEntity, setEditingEntity] = useState<PreCreatedEntity | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const filteredEntities = entities.filter((e) => e.type === activeTab);

    const handleSave = (entity: PreCreatedEntity) => {
        const existing = entities.find((e) => e.id === entity.id);
        if (existing) {
            // Update existing
            onEntitiesChange(entities.map((e) => (e.id === entity.id ? entity : e)));
        } else {
            // Add new
            onEntitiesChange([...entities, entity]);
        }
        setEditingEntity(null);
        setIsCreating(false);
    };

    const handleDelete = (id: string) => {
        onEntitiesChange(entities.filter((e) => e.id !== id));
    };

    const handleEdit = (entity: PreCreatedEntity) => {
        setEditingEntity(entity);
        setIsCreating(true);
    };

    if (isCreating) {
        return (
            <EntityEditor
                entity={editingEntity || undefined}
                entityType={activeTab}
                onSave={handleSave}
                onCancel={() => {
                    setIsCreating(false);
                    setEditingEntity(null);
                }}
            />
        );
    }

    return (
        <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Pre-Define Entities</h3>
                <span className="text-xs text-zinc-400">
                    {entities.length} {entities.length === 1 ? 'entity' : 'entities'}
                </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10">
                {(['character', 'setting', 'prop'] as const).map((tab) => {
                    const count = entities.filter((e) => e.type === tab).length;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                px-4 py-2 text-sm font-medium capitalize transition-all
                ${activeTab === tab
                                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                                    : 'text-zinc-400 hover:text-white'
                                }
              `}
                        >
                            {tab}s {count > 0 && `(${count})`}
                        </button>
                    );
                })}
            </div>

            {/* Entity List */}
            <div className="space-y-2">
                {filteredEntities.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-sm">
                        No {activeTab}s defined yet
                    </div>
                ) : (
                    filteredEntities.map((entity) => (
                        <div
                            key={entity.id}
                            className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10
                       border border-white/10 rounded-lg transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                {/* Thumbnail */}
                                {(entity.turnaroundImages?.front ||
                                    entity.generalReferences?.[0]) && (
                                        <div className="w-12 h-12 bg-black/40 rounded overflow-hidden">
                                            <img
                                                src={
                                                    entity.turnaroundImages?.front ||
                                                    entity.generalReferences?.[0] ||
                                                    ''
                                                }
                                                alt={entity.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                {/* Info */}
                                <div>
                                    <div className="font-medium text-white">{entity.name}</div>
                                    {entity.description && (
                                        <div className="text-xs text-zinc-400 line-clamp-1">
                                            {entity.description}
                                        </div>
                                    )}
                                    <div className="text-xs text-zinc-500 mt-1">
                                        {entity.turnaroundImages &&
                                            Object.values(entity.turnaroundImages).filter(Boolean)
                                                .length > 0 && (
                                                <span className="mr-3">
                                                    {
                                                        Object.values(entity.turnaroundImages).filter(
                                                            Boolean
                                                        ).length
                                                    }{' '}
                                                    turnaround
                                                    {Object.values(entity.turnaroundImages).filter(
                                                        Boolean
                                                    ).length !== 1
                                                        ? 's'
                                                        : ''}
                                                </span>
                                            )}
                                        {entity.generalReferences &&
                                            entity.generalReferences.length > 0 && (
                                                <span>
                                                    {entity.generalReferences.length} reference
                                                    {entity.generalReferences.length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(entity)}
                                    className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400
                           rounded text-xs font-medium transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(entity.id)}
                                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400
                           rounded text-xs font-medium transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add New Button */}
            <button
                onClick={() => setIsCreating(true)}
                className="w-full px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40
                 text-cyan-400 rounded-lg font-medium transition-colors"
            >
                + Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </button>
        </div>
    );
};
