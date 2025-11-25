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
  // mode state removed as it was unused
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]); // Base64s
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const item = itemType === 'character' 
    ? visualBible.characters[itemId] 
    : visualBible.settings[itemId];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      // Strip prefix if needed, but usually we keep it for display and strip for API
      setUploadedImages(prev => [...prev, base64]);
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

    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      if (targetMode === 'text') {
        // Text Mode: Update JSON Data via Function Calling
        // We inject the current item JSON as context
        const contextPrompt = `
          Current Item ID: "${itemId}"
          Current Item Type: "${itemType}"
          Current Item Data: ${JSON.stringify(item, null, 2)}
          User Request: ${input}
          
          Update this item using the available functions. 
          IMPORTANT: When calling 'addCharacter' or 'defineSetting', you MUST use the ID "${itemId}" to ensure you update the existing record instead of creating a new one.
        `;
        
        const response = await chatWithDirector(
          chatHistory, // Pass full history
          contextPrompt,
          visualBible,
          true, // Enable function calling
          uploadedImages // Pass current images
        );

        if (response.text) {
          setChatHistory(prev => [...prev, {
            id: Date.now().toString(),
            timestamp: Date.now(),
            sender: 'gemini',
            content: response.text || '' // Ensure string
          }]);
        }

        // If functions were called, the visualBible is updated in the background
        // But we need to reflect that here. 
        // Note: chatWithDirector currently returns the text/calls, but doesn't execute them locally 
        // unless we hook it up. 
        // WAIT. The current chatWithDirector implementation in gemini.ts DOES NOT execute functions.
        // It returns them. We need to execute them here or pass a callback.
        // For this MVP, let's assume we handle the execution logic here or in a wrapper.
        // Actually, let's look at how DirectorSanctum handles it. 
        // It calls 'executeFunctionCall'. We should do the same.
        
        if (response.functionCalls) {
           // Import dynamically to avoid circular deps if needed, or just import at top
           const { executeFunctionCall } = await import('../../services/visualBibleFunctions');
           
           let currentBible = { ...visualBible };
           for (const call of response.functionCalls) {
             currentBible = executeFunctionCall(currentBible, call.name, call.args);
           }
           onUpdate(currentBible);
           
           setChatHistory(prev => [...prev, {
             id: Date.now().toString(),
             timestamp: Date.now(),
             sender: 'gemini',
             content: `Updated ${itemType} details.`
           }]);
        }

      } else {
        // Vision Mode: Generate/Edit Reference Image
        // We use the uploaded images as context + the chat history
        // This uses gemini-3-pro-image-preview
        
        // Construct a prompt that includes the item description
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

        // Call the actual Vision API
        // Dynamically import to avoid circular dependency issues if any, though direct import is fine here
        const { generateItemReference } = await import('../../services/gemini');
        
        const result = await generateItemReference(visionPrompt, uploadedImages);
        
        // We should save this image to the item's visualReferences?
        // For now, just show it in the chat.
        // Ideally, we'd have a way to "accept" it into the Bible.
        
        setChatHistory(prev => [...prev, {
            id: Date.now().toString(),
            timestamp: Date.now(),
            sender: 'gemini',
            content: "Here is a generated reference based on your request.",
            // We need to extend ChatMessage to support images or just embed it in content?
            // The ChatMessage type currently only has 'content' string.
            // We'll embed it as a markdown image for now or handle it in the UI renderer.
            // Let's assume the UI can render markdown images or we add a specific field.
            // Hack: Append the base64 as a markdown image
            // content: `Here is a generated reference:\n\n![Generated Reference](data:image/png;base64,${result.base64})`
        } as ChatMessage]);
        
        // Also add a system message with the raw image for the UI to render nicely if it supports it
        // Or better, update the chat renderer to look for image attachments.
        // For this MVP, let's just append a special marker.
        setChatHistory(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            timestamp: Date.now(),
            sender: 'gemini',
            content: `[IMAGE_GENERATED::${result.base64}]` 
        } as ChatMessage]);
      }
    } catch (error) {
      console.error('Chat failed:', error);
      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: Date.now(),
        sender: 'gemini',
        content: `Error: ${error}`
      } as ChatMessage]);
    } finally {
      setIsProcessing(false);
      setUploadedImages([]); // Clear uploads after send
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] w-full max-w-6xl h-[85vh] rounded-2xl border border-white/10 flex overflow-hidden shadow-2xl">
        
        {/* Left: Item Details (Live JSON View) */}
        <div className="w-1/3 border-r border-white/10 p-6 overflow-y-auto bg-black/20">
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
              <div className="space-y-2">
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.sender === 'user' 
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
