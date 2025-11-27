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
  const [isVisible, setIsVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger animation after mount
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to finish before calling onClose
    setTimeout(onClose, 300);
  };

  const item = itemType === 'character'
    ? visualBible.characters[itemId]
    : visualBible.settings[itemId];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Backdrop - clickable to close */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Slide-over Panel */}
      <div className={`relative w-full max-w-4xl h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex pointer-events-auto transform transition-transform duration-300 ease-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Left: Item Details (Live JSON View) - Now narrower */}
        <div className="w-[350px] border-r border-white/10 p-6 overflow-y-auto bg-black/20 flex-shrink-0 custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {itemType === 'character' ? <span className="text-purple-400">Character</span> : <span className="text-blue-400">Setting</span>}
              <span className="text-gray-400">/</span>
              {item.name}
            </h2>
          </div>

          <div className="space-y-6">
            <div className="group relative">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
              <p className="text-sm text-gray-300 leading-relaxed p-3 bg-white/5 rounded-lg border border-white/5">
                {itemType === 'character' ? (item as any).description : (item as any).locationDescription}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Visual Attributes</label>
              <div className="space-y-2 mb-6">
                {Object.entries(itemType === 'character' ? (item as any).appearance : (item as any)).map(([key, value]) => {
                  if (typeof value === 'string' && value) {
                    return (
                      <div key={key} className="flex flex-col gap-1 p-2 bg-white/5 rounded border border-white/5">
                        <span className="text-xs text-gray-500 capitalize">{key}</span>
                        <span className="text-sm text-gray-200">{value}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Visual References */}
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Visual References</label>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {((itemType === 'character' ? (item as any).appearance.visualReferences : (item as any).visualReferences) || []).map((ref: string, i: number) => (
                  <div key={i} className="aspect-square rounded bg-black/50 overflow-hidden border border-white/10">
                    <img src={ref} alt="Ref" className="w-full h-full object-cover" />
                  </div>
                ))}
                <label className="aspect-square rounded bg-white/5 hover:bg-white/10 border border-white/10 border-dashed flex items-center justify-center cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleReferenceUpload(e, 'general')} />
                </label>
              </div>

              {/* Turnaround Views (Character Only) */}
              {itemType === 'character' && (
                <>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Turnaround Views</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['front', 'sideLeft', 'sideRight', 'back'].map((view) => {
                      const turnaround = visualBible.characterTurnarounds[itemId];
                      const viewData = turnaround?.views?.[view as keyof typeof turnaround.views];
                      const hasImage = viewData?.base64;

                      return (
                        <div key={view} className="aspect-3/4 rounded bg-black/50 overflow-hidden border border-white/10 relative group">
                          {hasImage ? (
                            <img src={viewData.base64} alt={view} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                              <span className="text-[10px] uppercase">{view.replace('side', 'side ')}</span>
                            </div>
                          )}
                          <label className={`absolute inset-0 bg-black/50 ${hasImage ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 hover:opacity-100'} flex items-center justify-center cursor-pointer transition-opacity`}>
                            <Upload className="w-4 h-4 text-white" />
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
          <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30">
                <Sparkles className="w-3 h-3" />
                Gemini 3 Pro
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium border border-blue-500/30">
                <ImageIcon className="w-3 h-3" />
                Nano Banana (Vision)
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {chatHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                <MessageSquare className="w-12 h-12 opacity-20" />
                <p className="text-sm">Discuss this {itemType} with the Director to refine details or generate visuals.</p>
              </div>
            )}
            {chatHistory.map((msg) => {
              const isImageMsg = msg.content?.startsWith('[IMAGE_GENERATED::');
              const imageBase64 = isImageMsg ? msg.content?.split('::')[1].replace(']', '') : null;

              if (isImageMsg && imageBase64) {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[80%] p-2 rounded-2xl bg-white/10 rounded-tl-sm overflow-hidden">
                      <img src={`data:image/png;base64,${imageBase64}`} alt="Generated" className="w-full h-auto rounded-lg" />
                      <div className="mt-2 flex justify-end">
                        <button
                          className="text-xs bg-blue-600 px-2 py-1 rounded text-white hover:bg-blue-500"
                          onClick={() => {
                            // Logic to save this as the official reference
                            // For now just log
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
                  <div className={`max-w-[80%] p-4 rounded-2xl ${msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white/10 text-gray-200 rounded-tl-sm'
                    }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/10 bg-black/20">
            {uploadedImages.length > 0 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {uploadedImages.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20 group">
                    <img src={img} alt="Upload" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
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
                  className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                </label>
              </div>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend('text')}
                  placeholder={`Ask the Director to refine ${item.name}...`}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSend('text')}
                  disabled={isProcessing || (!input && uploadedImages.length === 0)}
                  className="h-12 px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>

                <button
                  onClick={() => handleSend('vision')}
                  disabled={isProcessing || (!input && uploadedImages.length === 0)}
                  className="h-12 px-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Generate</span>
                </button>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-center">
              "Send" updates the text description. "Generate" creates visual references using Nano Banana.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodexItemEditor;
