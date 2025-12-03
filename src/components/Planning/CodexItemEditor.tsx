import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Upload, Sparkles, MessageSquare } from 'lucide-react';
import { type VisualBible, type ChatMessage } from '../../types';
import { chatWithDirector } from '../../services/gemini';

interface CodexItemEditorProps {
  itemType: 'character' | 'setting';
  itemId: string;
  visualBible: VisualBible;
  onUpdate: (updatedBible: VisualBible) => void;
  onClose: () => void;
}

const CodexItemEditor: React.FC<CodexItemEditorProps> = ({
  itemType,
  itemId,
  visualBible,
  onUpdate,
  onClose
}) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]); // Base64s
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const item = itemType === 'character'
    ? visualBible.characters[itemId]
    : visualBible.settings[itemId];

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Helper to update chat history both locally and in the persisted Visual Bible
  const updateChatHistory = (newHistory: ChatMessage[]) => {
    setChatHistory(newHistory);

    const updatedBible = { ...visualBible };
    if (itemType === 'character') {
      // Ensure chatHistory exists on character before assigning
      if (!updatedBible.characters[itemId].chatHistory) {
        // @ts-ignore - Adding dynamic property if not in type definition yet
        updatedBible.characters[itemId].chatHistory = [];
      }
      // @ts-ignore
      updatedBible.characters[itemId].chatHistory = newHistory;
    } else {
      if (!updatedBible.settings[itemId].chatHistory) {
        // @ts-ignore
        updatedBible.settings[itemId].chatHistory = [];
      }
      // @ts-ignore
      updatedBible.settings[itemId].chatHistory = newHistory;
    }
    onUpdate(updatedBible);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setUploadedImages(prev => [...prev, base64]);
    };
    reader.readAsDataURL(file);
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'general' | 'front' | 'sideLeft' | 'sideRight' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const updatedBible = { ...visualBible };

      if (itemType === 'character') {
        if (target === 'general') {
          const currentRefs = updatedBible.characters[itemId].appearance.visualReferences || [];
          updatedBible.characters[itemId].appearance.visualReferences = [...currentRefs, base64];
        } else {
          // Turnaround upload
          // Ensure turnaround record exists
          if (!updatedBible.characterTurnarounds[itemId]) {
            updatedBible.characterTurnarounds[itemId] = {
              characterId: itemId,
              views: { front: { base64: '' }, sideLeft: { base64: '' }, sideRight: { base64: '' }, back: { base64: '' } },
              metadata: { resolution: '2K', createdAt: Date.now() },
              status: 'idle'
            };
          }
          // Update specific view
          updatedBible.characterTurnarounds[itemId].views[target] = { base64, thoughtSignature: 'manual_upload' };
          // updatedBible.characterTurnarounds[itemId].status = 'complete'; 
        }
      } else {
        // Setting - only general supported
        const currentRefs = updatedBible.settings[itemId].visualReferences || [];
        updatedBible.settings[itemId].visualReferences = [...currentRefs, base64];
      }

      onUpdate(updatedBible);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReference = (index: number, target: 'general' | 'front' | 'sideLeft' | 'sideRight' | 'back') => {
    const updatedBible = { ...visualBible };

    if (itemType === 'character') {
      if (target === 'general') {
        const currentRefs = updatedBible.characters[itemId].appearance.visualReferences || [];
        updatedBible.characters[itemId].appearance.visualReferences = currentRefs.filter((_, i) => i !== index);
      } else {
        // Turnaround removal
        if (updatedBible.characterTurnarounds[itemId]?.views?.[target]) {
          updatedBible.characterTurnarounds[itemId].views[target] = { base64: '', thoughtSignature: '' };
        }
      }
    } else {
      // Setting - only general supported
      const currentRefs = updatedBible.settings[itemId].visualReferences || [];
      updatedBible.settings[itemId].visualReferences = currentRefs.filter((_, i) => i !== index);
    }

    onUpdate(updatedBible);
  };

  const handleSend = async (targetMode: 'text' | 'vision') => {
    if (!input.trim() && uploadedImages.length === 0) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      sender: 'user',
      content: input,
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined
    };

    const newHistory = [...chatHistory, userMsg];
    updateChatHistory(newHistory);

    setInput('');
    setIsProcessing(true);

    try {
      if (targetMode === 'text') {
        const contextPrompt = `
          Current Item ID: "${itemId}"
          Current Item Type: "${itemType}"
          Current Item Data: ${JSON.stringify(item, null, 2)}
          User Request: ${input}
          
          Update this item using the available functions. 
          IMPORTANT: When calling 'addCharacter' or 'defineSetting', you MUST use the ID "${itemId}" to ensure you update the existing record instead of creating a new one.
        `;

        const response = await chatWithDirector(
          newHistory,
          contextPrompt,
          visualBible,
          true,
          uploadedImages
        );

        if (response.text) {
          const assistantMsg: ChatMessage = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            sender: 'gemini',
            content: response.text || ''
          };
          updateChatHistory([...newHistory, assistantMsg]);
        }

        if (response.functionCalls) {
          const { executeFunctionCall } = await import('../../services/visualBibleFunctions');

          let currentBible = { ...visualBible };
          for (const call of response.functionCalls) {
            currentBible = executeFunctionCall(currentBible, call.name, call.args);
          }

          // Also update chat history in the NEW bible state
          // Note: We use @ts-ignore here because we might not have updated the types.ts yet to include chatHistory on characters/settings
          if (itemType === 'character') {
            // @ts-ignore
            currentBible.characters[itemId].chatHistory = [...newHistory, {
              id: (Date.now() + 1).toString(),
              timestamp: Date.now(),
              sender: 'gemini',
              content: `Updated ${itemType} details via function call.`
            }];
          } else {
            // @ts-ignore
            currentBible.settings[itemId].chatHistory = [...newHistory, {
              id: (Date.now() + 1).toString(),
              timestamp: Date.now(),
              sender: 'gemini',
              content: `Updated ${itemType} details via function call.`
            }];
          }

          onUpdate(currentBible);

          setChatHistory(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            timestamp: Date.now(),
            sender: 'gemini',
            content: `Updated ${itemType} details via function call.`
          }]);
        }

      } else {
        // Vision Mode
        const itemDesc = itemType === 'character'
          ? (item as any).description
          : (item as any).locationDescription;

        const itemVisuals = itemType === 'character'
          ? (item as any).appearance
          : (item as any).keyVisualElements;

        const visionPrompt = `
          Context: ${itemDesc}
          Appearance: ${JSON.stringify(itemVisuals)}
          User Request: ${input}
        `;

        const { generateItemReference } = await import('../../services/gemini');
        const result = await generateItemReference(visionPrompt, uploadedImages);

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          timestamp: Date.now(),
          sender: 'gemini',
          content: `[IMAGE_GENERATED::${result.base64}]`
        };
        updateChatHistory([...newHistory, assistantMsg]);
      }
    } catch (error) {
      console.error('Chat failed:', error);
      updateChatHistory([...newHistory, {
        id: Date.now().toString(),
        timestamp: Date.now(),
        sender: 'gemini',
        content: `Error: ${error}`
      } as ChatMessage]);
    } finally {
      setIsProcessing(false);
      setUploadedImages([]);
    }
  };

  return (
    <div className="!w-[50vw] scrollbar-none !bg-transparent glass-container !h-[600px] !overflow-visible relative shadow-2xl animate-in fade-in zoom-in-95 duration-300">

      {/* Glass Shell Background */}
      <div className="glass-shell !border-0" />

      {/* Rim Light */}
      <div className="glass-rim">
        <div className="rim-spinner" />
      </div>

      {/* Moat (The Content) */}
      <div className="glass-moat !shadow-2xs !bg-transparent !flex-row !w-[99%] !h-[98%] !rounded-[28px] !border-[2px] !border-white/5 overflow-hidden relative">
        <div className="moat-reflection absolute inset-0 pointer-events-none z-20" />

        {/* Left: Item Details (Live JSON View) */}

        <div className="w-62 border-r border-slate-400/30 p-4 !scrollbar-none shadow-[inset_0px_0_15px_-2px_rgba(0,0,0,0.3)] overflow-y-auto !bg-transparent flex-shrink-0 scrollbar-none">
          <div className="flex !scrollbar-none items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex flex-col items-start gap-1 w-full">
              {itemType === 'character' ? <span className="text-fuchsia-500 text-md uppercase tracking-wider opacity-100">Character</span> : <span className="text-blue-400 text-sm uppercase tracking-widest opacity-100">Setting</span>}
              <div className="w-2/3 h-[1px] bg-white/50 mt-0.5" />
              <div className="w-3/4 h-[1px] bg-white/50 mb-1" />
              <span className="text-lg leading-tight">{item.name}</span>
            </h2>
          </div>

          <div className="space-y-4">
            <div className="group relative">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
              <p className="text-xs text-gray-300 leading-relaxed p-2 bg-white/5 rounded-lg border border-white/5">
                {itemType === 'character' ? (item as any).description : (item as any).locationDescription}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Visual Attributes</label>
              <div className="space-y-1 mb-4">
                {Object.entries(itemType === 'character' ? (item as any).appearance : (item as any)).map(([key, value]) => {
                  if (typeof value === 'string' && value) {
                    return (
                      <div key={key} className="flex flex-col gap-0.5 p-1.5 bg-white/5 rounded border border-white/5">
                        <span className="text-[10px] text-gray-500 capitalize">{key}</span>
                        <span className="text-xs text-gray-200">{value}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Visual References */}
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Visual References</label>
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                {((itemType === 'character' ? (item as any).appearance.visualReferences : (item as any).visualReferences) || []).map((ref: string, i: number) => (
                  <div key={i} className="aspect-square rounded bg-black/50 overflow-hidden border border-white/10 relative group">
                    <img src={ref} alt="Ref" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveReference(i, 'general')}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded bg-white/5 hover:bg-white/10 border border-white/10 border-dashed flex items-center justify-center cursor-pointer transition-colors">
                  <Upload className="w-3 h-3 text-gray-400" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleReferenceUpload(e, 'general')} />
                </label>
              </div>

              {/* Turnaround Views (Character Only) */}
              {itemType === 'character' && (
                <>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Turnaround Views</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['front', 'sideLeft', 'sideRight', 'back'].map((view) => {
                      const turnaround = visualBible.characterTurnarounds[itemId];
                      const viewData = turnaround?.views?.[view as keyof typeof turnaround.views];
                      const hasImage = viewData?.base64;

                      return (
                        <div key={view} className="aspect-3/4 rounded bg-black/50 overflow-hidden border border-white/10 relative group">
                          {hasImage ? (
                            <>
                              <img src={viewData.base64} alt={view} className="w-full h-full object-cover" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveReference(0, view as any);
                                }}
                                className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-20"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                              <span className="text-[8px] uppercase">{view.replace('side', 'side ')}</span>
                            </div>
                          )}
                          <label className={`absolute inset-0 bg-black/50 ${hasImage ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 hover:opacity-100'} flex items-center justify-center cursor-pointer transition-opacity`}>
                            <Upload className="w-3 h-3 text-white" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleReferenceUpload(e, view as any)} />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Conversational Workspace */}
        <div className="flex-1 flex flex-col bg-[#0f0f0f]">
          {/* Header */}
          <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-[10px] font-medium border border-purple-500/30">
                <Sparkles className="w-2.5 h-2.5" />
                Gemini 3 Pro
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-medium border border-blue-500/30">
                <ImageIcon className="w-2.5 h-2.5" />
                Nano Banana
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Chat Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
          >
            {chatHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-3">
                <MessageSquare className="w-8 h-8 opacity-20" />
                <p className="text-xs">Discuss this {itemType} with the Director.</p>
              </div>
            )}
            {chatHistory.map((msg) => {
              const isImageMsg = msg.content?.startsWith('[IMAGE_GENERATED::');
              const imageBase64 = isImageMsg ? msg.content?.split('::')[1].replace(']', '') : null;

              if (isImageMsg && imageBase64) {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[85%] p-2 rounded-2xl bg-white/10 rounded-tl-sm overflow-hidden">
                      <img src={`data:image/png;base64,${imageBase64}`} alt="Generated" className="w-full h-auto rounded-lg" />
                      <div className="mt-2 flex justify-end">
                        <button
                          className="text-[10px] bg-blue-600 px-2 py-1 rounded text-white hover:bg-blue-500"
                          onClick={() => {
                            // Logic to save this as the official reference
                            console.log('Save as reference clicked');
                          }}
                        >
                          Save to Bible
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl ${msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white/10 text-gray-200 rounded-tl-sm'
                    }`}>
                    <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            {uploadedImages.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {uploadedImages.map((img, i) => (
                  <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20 group">
                    <img src={img} alt="Upload" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <div className="relative">
                <input
                  type="file"
                  id="image-upload"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-gray-400" />
                </label>
              </div>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend('text')}
                  placeholder={`Refine ${item.name}...`}
                  className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSend('text')}
                  disabled={isProcessing || (!input && uploadedImages.length === 0)}
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <Send className="w-3 h-3" />
                </button>

                <button
                  onClick={() => handleSend('vision')}
                  disabled={isProcessing || (!input && uploadedImages.length === 0)}
                  className="h-10 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <ImageIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default CodexItemEditor;
