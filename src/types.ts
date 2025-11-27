export interface CharacterTurnaround {
  characterId: string;
  views: {
    front: { base64: string; thoughtSignature?: string };
    sideLeft: { base64: string; thoughtSignature?: string };
    sideRight: { base64: string; thoughtSignature?: string };
    back: { base64: string; thoughtSignature?: string };
  };
  metadata: {
    resolution: '4K' | '2K';
    createdAt: number;
  };
  status: 'idle' | 'generating' | 'complete' | 'error';
}

export interface VisualBible {
  id: string;
  name: string;
  creationTimestamp: number;
  lastUpdatedTimestamp: number;
  
  narrativeThemes: string[];
  keyMotifs: Array<{ description: string, visualExamples: string[] }>;
  characters: Record<string, {
    name: string;
    description: string;
    keyFeatures: string[];
    emotionalArc: string;
    appearance: {
      hair: string;
      eyes: string;
      build: string;
      attire: string;
      distinguishingMarks: string;
      visualReferences?: string[];
    };
  }>;
  settings: Record<string, {
    name: string;
    locationDescription: string;
    timePeriod: string;
    atmosphere: string;
    keyVisualElements: string[];
    propLibrary: Record<string, string>;
    visualReferences?: string[];
  }>;
  cinematography: {
    lensType: string;
    filmGrain: string;
    lightingStyle: string;
    cameraMovement: string;
    cameraAngles: string;
  };
  colorPalette: {
    mood: string;
    hexCodes: string[];
    description: string;
  };
  
  // Character Reference Sheets
  characterTurnarounds: Record<string, CharacterTurnaround>;
  
  granularityLevel: 'Detailed Paragraph' | 'Sentence by Sentence' | 'Key Beats';
  validationStrides: {
    short: number;
    medium: number;
    long: number;
  };
  maxImageRetries: number;
  videoGenerationDelaySeconds: number;
  targetOutputAspectRatio: string;
  globalModelParameters?: Record<string, any>;
}

export interface SceneNode {
  id: string;
  index: number;
  narrativeSegment: string;
  
  basePrompt: string;
  currentImagePrompt: string;
  
  imageData?: {
    base64: string; // Or ID referencing IndexedDB asset
    seed?: number;
    attempts: number;
    status: 'idle' | 'pending' | 'generating' | 'done' | 'error' | 'retrying' | 'user_intervention_needed';
  };
  
  videoData?: {
    uri: string; // Or ID referencing IndexedDB asset
    status: 'idle' | 'pending' | 'generating' | 'done' | 'error' | 'retrying';
    attempts: number;
  };

  validationLog: Array<{
    timestamp: number;
    type: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
    referenceSceneIndex: number;
    score: number;
    critique: string;
    passed: boolean;
    fixInstructions?: string;
    attempt: number;
  }>;
  
  overallStatus: 'pending' | 'planning_failed' | 'image_generating' | 'image_failed' | 'image_validated' | 'image_failed_retries' | 'video_generating' | 'video_failed' | 'complete';
}

export interface ChatMessage {
    id: string;
    timestamp: number;
    sender: 'user' | 'gemini';
    content: string;
    images?: string[]; // Base64 strings
    functionCall?: { name: string, args: Record<string, any> };
    functionResponse?: { name: string, response: any };
}

export interface Conversation {
    id: string;
    name: string;
    messages: ChatMessage[];
    relatedVisualBibleId?: string;
}
export interface CharacterTurnaround {
  characterId: string;
  views: {
    front: { base64: string; thoughtSignature?: string };
    sideLeft: { base64: string; thoughtSignature?: string };
    sideRight: { base64: string; thoughtSignature?: string };
    back: { base64: string; thoughtSignature?: string };
  };
  metadata: {
    resolution: '4K' | '2K';
    createdAt: number;
  };
  status: 'idle' | 'generating' | 'complete' | 'error';
}

export interface VisualBible {
  id: string;
  name: string;
  creationTimestamp: number;
  lastUpdatedTimestamp: number;
  
  narrativeThemes: string[];
  keyMotifs: Array<{ description: string, visualExamples: string[] }>;
  characters: Record<string, {
    name: string;
    description: string;
    keyFeatures: string[];
    emotionalArc: string;
    appearance: {
      hair: string;
      eyes: string;
      build: string;
      attire: string;
      distinguishingMarks: string;
      visualReferences?: string[];
    };
  }>;
  settings: Record<string, {
    name: string;
    locationDescription: string;
    timePeriod: string;
    atmosphere: string;
    keyVisualElements: string[];
    propLibrary: Record<string, string>;
    visualReferences?: string[];
  }>;
  cinematography: {
    lensType: string;
    filmGrain: string;
    lightingStyle: string;
    cameraMovement: string;
    cameraAngles: string;
  };
  colorPalette: {
    mood: string;
    hexCodes: string[];
    description: string;
  };
  
  // Character Reference Sheets
  characterTurnarounds: Record<string, CharacterTurnaround>;
  
  granularityLevel: 'Detailed Paragraph' | 'Sentence by Sentence' | 'Key Beats';
  validationStrides: {
    short: number;
    medium: number;
    long: number;
  };
  maxImageRetries: number;
  videoGenerationDelaySeconds: number;
  targetOutputAspectRatio: string;
  globalModelParameters?: Record<string, any>;
}

export interface SceneNode {
  id: string;
  index: number;
  narrativeSegment: string;
  
  basePrompt: string;
  currentImagePrompt: string;
  
  imageData?: {
    base64: string; // Or ID referencing IndexedDB asset
    seed?: number;
    attempts: number;
    status: 'idle' | 'pending' | 'generating' | 'done' | 'error' | 'retrying' | 'user_intervention_needed';
  };
  
  videoData?: {
    uri: string; // Or ID referencing IndexedDB asset
    status: 'idle' | 'pending' | 'generating' | 'done' | 'error' | 'retrying';
    attempts: number;
  };

  validationLog: Array<{
    timestamp: number;
    type: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
    referenceSceneIndex: number;
    score: number;
    critique: string;
    passed: boolean;
    fixInstructions?: string;
    attempt: number;
  }>;
  
  overallStatus: 'pending' | 'planning_failed' | 'image_generating' | 'image_failed' | 'image_validated' | 'image_failed_retries' | 'video_generating' | 'video_failed' | 'complete';
}

export interface ChatMessage {
    id: string;
    timestamp: number;
    sender: 'user' | 'gemini';
    content: string;
    images?: string[]; // Base64 strings
    functionCall?: { name: string, args: Record<string, any> };
    functionResponse?: { name: string, response: any };
}

export interface Conversation {
    id: string;
    name: string;
    messages: ChatMessage[];
    relatedVisualBibleId?: string;
}


