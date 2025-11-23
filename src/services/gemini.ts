import { type VisualBible, type SceneNode, type ChatMessage } from '../types';

// Read from .env.local (Vite auto-loads as import.meta.env.VITE_*)
// But user has it as GEMINI_API_KEY, so we need a workaround
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || (window as any).__GEMINI_API_KEY__;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Models (use 2.5 Pro as fallback if 3.0 isn't available yet)
const MODEL_CHAT = 'gemini-flash-latest'; // Falling back to flash for now
const MODEL_IMAGE_VISION = 'gemini-3-pro-image-preview'; // Nano Banana
const MODEL_IMAGE_GEN = 'imagen-4.0-ultra-generate-001';
const MODEL_VIDEO = 'veo-3.1-generate-preview';

// Helper to create fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 60000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response;
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs/1000}s`);
    }
    throw error;
  }
};

// Helper for headers
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-goog-api-key': API_KEY || '',
});

// --- Core Function: Analyze Narrative & Generate Visual Bible ---

export const analyzeNarrative = async (
  narrative: string,
  styleNotes: string
): Promise<Partial<VisualBible>> => {
  if (!API_KEY) throw new Error('Missing GEMINI_API_KEY - check your .env.local file');

  const systemPrompt = `You are an expert film director and visual storyteller. Analyze the following narrative and extract a comprehensive Visual Bible for video generation.

Extract and structure the following elements as JSON:

1. **narrativeThemes**: Array of strings (e.g., ["isolation", "redemption", "dystopia"])
2. **keyMotifs**: Array of objects with { description: string, visualExamples: string[] }
3. **characters**: Object mapping character IDs to detailed descriptions. EACH character MUST have:
   - name: string
   - description: string
   - keyFeatures: ARRAY of strings (e.g., ["scar on left cheek", "always wears red scarf"])
   - emotionalArc: string
   - appearance: {
       hair: string,
       eyes: string,
       build: string,
       attire: string,
       distinguishingMarks: string,
       visualReferences: string[] (optional)
     }
4. **settings**: Object mapping setting IDs to:
   - name: string
   - locationDescription: string
   - timePeriod: string
   - atmosphere: string
   - keyVisualElements: ARRAY of strings
   - propLibrary: object mapping prop names to descriptions
   - visualReferences: string[] (optional)
5. **cinematography**: Object with:
   - lensType: string
   - filmGrain: string
   - lightingStyle: string
   - cameraMovement: string
   - cameraAngles: string
6. **colorPalette**: Object with:
   - mood: string
   - hexCodes: ARRAY of hex color strings (e.g., ["#1a1a2e", "#16213e", "#0f3460"])
   - description: string

CRITICAL: Ensure all fields marked as ARRAY are actual JSON arrays, not strings or other types.

Example structure:
{
  "narrativeThemes": ["isolation", "survival"],
  "keyMotifs": [{ "description": "broken glass", "visualExamples": ["shattered windows", "cracked mirrors"] }],
  "characters": {
    "char_1": {
      "name": "John Doe",
      "description": "A weary detective",
      "keyFeatures": ["grey hair", "worn leather jacket", "perpetual stubble"],
      "emotionalArc": "redemption through truth",
      "appearance": {
        "hair": "salt and pepper, medium length",
        "eyes": "steel blue",
        "build": "athletic but weathered",
        "attire": "brown leather jacket, dark jeans",
        "distinguishingMarks": "scar above right eyebrow"
      }
    }
  },
  "settings": {
    "setting_1": {
      "name": "Downtown Precinct",
      "locationDescription": "gritty 1980s police station",
      "timePeriod": "1985",
      "atmosphere": "fluorescent lit, cigarette smoke haze",
      "keyVisualElements": ["metal filing cabinets", "cork boards with photos", "rotary phones"],
      "propLibrary": { "desk_lamp": "green banker's lamp", "typewriter": "IBM Selectric" }
    }
  },
  "cinematography": {
    "lensType": "35mm prime",
    "filmGrain": "heavy grain, 800 ISO look",
    "lightingStyle": "high contrast noir",
    "cameraMovement": "handheld, documentary feel",
    "cameraAngles": "dutch angles, low shots"
  },
  "colorPalette": {
    "mood": "neo-noir darkness",
    "hexCodes": ["#0a0a0a", "#1a1a2e", "#c4a747"],
    "description": "deep blacks with amber highlights"
  }
}

**Narrative:**
${narrative}

**Style Notes:**
${styleNotes}

Respond ONLY with valid JSON matching this structure. Ensure ALL array fields are proper JSON arrays.`;

  console.log('[Gemini] Calling analyzeNarrative with model:', MODEL_CHAT);
  console.log('[Gemini] Narrative length:', narrative.length, 'chars');

  const response = await fetchWithTimeout(`${BASE_URL}/${MODEL_CHAT}:generateContent`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        response_mime_type: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    console.error('[Gemini] API Error:', err);
    throw new Error(err.error?.message || 'Visual Bible generation failed');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) throw new Error('No response from Gemini');
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse Visual Bible JSON:', text);
    throw new Error('Invalid JSON response from Gemini');
  }
};

// --- Core Function: Decompose Narrative into Scenes ---

export const decomposeIntoScenes = async (
  narrative: string,
  visualBible: VisualBible
): Promise<Omit<SceneNode, 'id'>[]> => {
  if (!API_KEY) throw new Error('Missing GEMINI_API_KEY');

  const granularityInstructions = {
    'Detailed Paragraph': 'Break the narrative at each significant paragraph or 2-3 sentence cluster. Each scene should be a distinct moment.',
    'Sentence by Sentence': 'Create a scene for almost every sentence. Maximum granularity.',
    'Key Beats': 'Only break at major plot beats, emotional shifts, or scene changes. Fewer, more comprehensive scenes.'
  };

  const systemPrompt = `You are a film director breaking down a narrative into individual shots for image generation.

**Granularity Level**: ${visualBible.granularityLevel}
${granularityInstructions[visualBible.granularityLevel]}

For each scene, provide:
1. **narrativeSegment**: The exact text from the original narrative for this scene
2. **basePrompt**: A detailed image generation prompt incorporating:
   - The narrative action/moment
   - Relevant character details from Visual Bible
   - Setting details and atmosphere
   - Cinematography style (${visualBible.cinematography.lensType}, ${visualBible.cinematography.lightingStyle})
   - Color palette mood (${visualBible.colorPalette.mood})
   - Camera angle and framing

**Visual Bible Context:**
Characters: ${JSON.stringify(visualBible.characters, null, 2)}
Settings: ${JSON.stringify(visualBible.settings, null, 2)}
Cinematography: ${JSON.stringify(visualBible.cinematography, null, 2)}
Color Palette: ${JSON.stringify(visualBible.colorPalette, null, 2)}

**Narrative:**
${narrative}

Respond with a JSON array of scene objects. Each object must have:
- narrativeSegment: string
- basePrompt: string

Be exhaustive and precise in the prompts.`;

  const response = await fetch(`${BASE_URL}/${MODEL_CHAT}:generateContent`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        response_mime_type: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Scene decomposition failed');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) throw new Error('No response from Gemini');
  
  try {
    const scenes = JSON.parse(text);
    return scenes.map((scene: any, index: number) => ({
      index,
      narrativeSegment: scene.narrativeSegment,
      basePrompt: scene.basePrompt,
      currentImagePrompt: scene.basePrompt,
      validationLog: [],
      overallStatus: 'pending' as const
    }));
  } catch (e) {
    console.error('Failed to parse scenes JSON:', text);
    throw new Error('Invalid JSON response from Gemini');
  }
};

// --- Chat with Director (for conversational refinement with function calling) ---

export interface ChatResponse {
  text?: string;
  functionCalls?: Array<{
    name: string;
    args: Record<string, any>;
  }>;
}

export const chatWithDirector = async (
  history: ChatMessage[], 
  userMessage: string, 
  visualBible?: VisualBible,
  enableFunctionCalling: boolean = true
): Promise<ChatResponse> => {
  if (!API_KEY) throw new Error('Missing GEMINI_API_KEY');

  const systemPrompt = `You are an expert film director and creative consultant helping build a comprehensive Visual Bible for a narrative video project.

${visualBible ? `Current Visual Bible:
- Title: ${visualBible.name}
- Mood: ${visualBible.colorPalette.mood}
- Themes: ${visualBible.narrativeThemes.join(', ')}
- Characters: ${Object.keys(visualBible.characters).length} defined
- Settings: ${Object.keys(visualBible.settings).length} defined

Your role is to help the user refine this vision with thoughtful questions and creative suggestions. Use function calls to systematically update the Visual Bible as the conversation progresses.
` : `Your role is to help the user develop their narrative vision from scratch. Ask clarifying questions about:
- Characters and their visual appearance
- Settings and locations
- Overall mood and color palette
- Cinematographic style
- Narrative themes and motifs

Use the available functions to capture this information systematically.`}

Be conversational, insightful, and proactive in suggesting function calls to build out the Visual Bible.`;

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    ...history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })),
    { role: 'user', parts: [{ text: userMessage }] }
  ];

  // Import function declarations dynamically
  const { VISUAL_BIBLE_FUNCTIONS } = await import('./visualBibleFunctions');

  const body: any = { contents };
  
  if (enableFunctionCalling) {
    body.tools = [{
      function_declarations: VISUAL_BIBLE_FUNCTIONS
    }];
  }

  const response = await fetch(`${BASE_URL}/${MODEL_CHAT}:generateContent`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Chat failed');
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  
  if (!candidate) {
    return { text: '...' };
  }

  const parts = candidate.content?.parts || [];
  
  // Check if there are function calls
  const functionCalls = parts
    .filter((part: any) => part.functionCall)
    .map((part: any) => ({
      name: part.functionCall.name,
      args: part.functionCall.args
    }));

  // Get text response if available
  const textParts = parts.filter((part: any) => part.text);
  const text = textParts.map((part: any) => part.text).join('\n\n');

  return {
    text: text || undefined,
    functionCalls: functionCalls.length > 0 ? functionCalls : undefined
  };
};

// --- Image Generation (Imagen 4) ---

export const generateSceneImage = async (prompt: string, aspectRatio: string = '16:9'): Promise<{ base64: string; seed?: number }> => {
  if (!API_KEY) throw new Error('Missing GEMINI_API_KEY');

  const response = await fetch(`${BASE_URL}/${MODEL_IMAGE_GEN}:predict`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      instances: [
        {
          prompt: prompt
        }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Image generation failed');
  }

  const data = await response.json();
  
  // Response structure: { predictions: [{ bytesBase64Encoded: "..." }] }
  const imageBytes = data.predictions?.[0]?.bytesBase64Encoded;
  
  if (!imageBytes) {
    throw new Error('No image data received from Imagen');
  }

  return {
    base64: imageBytes,
    seed: data.predictions?.[0]?.seed
  };
};

// --- Image Editing (Nano Banana / gemini-3-pro-image-preview) ---

export const editSceneImage = async (
  existingImageBase64: string,
  editInstructions: string
): Promise<{ base64: string }> => {
  if (!API_KEY) throw new Error('Missing GEMINI_API_KEY');

  // Using Gemini 3 Pro Image Preview (Nano Banana) for native image editing
  // This is more efficient than full regeneration for small adjustments
  const response = await fetch(`${BASE_URL}/${MODEL_IMAGE_VISION}:generateContent`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: editInstructions },
          {
            inline_data: {
              mime_type: 'image/png',
              data: existingImageBase64
            }
          }
        ]
      }]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Image editing failed');
  }

  const data = await response.json();
  
  // Extract the edited image from the response
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part: any) => part.inline_data);
  
  if (!imagePart?.inline_data?.data) {
    throw new Error('No edited image data received from Gemini');
  }

  return {
    base64: imagePart.inline_data.data
  };
};

// --- Video Generation (Veo) ---

export const generateSceneVideo = async (
  imageBase64: string,
  prompt: string, 
  duration: number = 5
): Promise<{ uri?: string; operationId?: string }> => {
  if (!API_KEY) throw new Error('Missing GEMINI_API_KEY');

  const response = await fetch(`${BASE_URL}/${MODEL_VIDEO}:generateVideo`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      prompt: { text: prompt },
      image: { image64: imageBase64 },
      duration_seconds: duration,
      fps: 24,
      aspect_ratio: '16:9'
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Video generation failed');
  }

  const data = await response.json();
  
  // Check if it's an async operation
  if (data.name && !data.videoUri) {
    return { operationId: data.name };
  }

  return { uri: data.videoUri };
};

// --- Validation (Gemini 3 Vision / Critic) ---

export const validateImage = async (
  imageBase64: string,
  scene: SceneNode,
  referenceImageBase64: string | null,
  visualBible: VisualBible,
  validationType: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM'
): Promise<{ passed: boolean; score: number; critique: string; fixInstructions?: string }> => {
  if (!API_KEY) throw new Error('Missing GEMINI_API_KEY');

  const validationFocus = {
    'IMMEDIATE': 'Focus on technical quality, composition, and whether this image matches the intended narrative moment.',
    'SHORT_TERM': 'Focus on immediate visual continuity: lighting consistency, character pose/position flow, and motion coherence from the reference image.',
    'MEDIUM_TERM': 'Focus on pacing, character appearance consistency (clothing, hair, features), and evolving mood across this sequence.',
    'LONG_TERM': 'Focus on protagonist consistency from the very first frame, overall genre adherence, color palette consistency, and core Visual Bible principles.'
  };

  const prompt = `You are a brutal film critic analyzing this generated image for a narrative video project.

**Validation Type**: ${validationType}
**Focus**: ${validationFocus[validationType]}

**Scene Context**:
Narrative: "${scene.narrativeSegment}"
Intended Prompt: "${scene.currentImagePrompt}"

**Visual Bible Requirements**:
- Color Palette: ${visualBible.colorPalette.mood} (${visualBible.colorPalette.hexCodes.join(', ')})
- Cinematography: ${visualBible.cinematography.lightingStyle}, ${visualBible.cinematography.lensType}
- Key Characters: ${Object.entries(visualBible.characters).map(([id, c]) => `${c.name}: ${Array.isArray(c.keyFeatures) ? c.keyFeatures.join(', ') : c.keyFeatures || 'N/A'}`).join(' | ')}

${referenceImageBase64 ? 'Compare this image against the reference image for continuity.' : 'This is a standalone validation.'}

Provide your response as JSON:
{
  "passed": boolean,
  "score": number (0-10),
  "critique": "detailed analysis",
  "fixInstructions": "specific prompt modifications to fix issues (only if failed)"
}

Be harsh but constructive. Score 7+ passes, below 7 fails.`;

  const parts: any[] = [{ text: prompt }];
  
  if (referenceImageBase64) {
    parts.push({
      inline_data: {
        mime_type: 'image/png',
        data: referenceImageBase64
      }
    });
  }
  
  parts.push({
    inline_data: {
      mime_type: 'image/png',
      data: imageBase64
    }
  });

  const response = await fetch(`${BASE_URL}/${MODEL_IMAGE_VISION}:generateContent`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        response_mime_type: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Validation failed');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  try {
    const result = JSON.parse(text);
    return {
      passed: result.score >= 7,
      score: result.score,
      critique: result.critique,
      fixInstructions: result.score < 7 ? result.fixInstructions : undefined
    };
  } catch (e) {
    console.error('Failed to parse validation JSON:', text);
    return { passed: false, score: 0, critique: 'Validation parsing failed' };
  }
};
