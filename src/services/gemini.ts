import { type VisualBible, type SceneNode, type ChatMessage } from "../types";

// Read from .env.local (Vite auto-loads as import.meta.env.VITE_*)
// But user has it as GEMINI_API_KEY, so we need a workaround
const API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY || (window as any).__GEMINI_API_KEY__;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Models (use 2.5 Pro as fallback if 3.0 isn't available yet)
// Models - ALL GEMINI 3 PRO PREVIEW (The "Monstrosity" Standard)
const MODEL_TEXT = "gemini-3-pro-preview";
const MODEL_VISION = "gemini-3-pro-image-preview"; // Nano Banana
const MODEL_VIDEO = "veo-3.1-generate-preview";

// Configuration Constants
const THINKING_LEVEL = "high"; // "No Thoughts, Head Empty" is forbidden

// Helper to create fetch with timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = 60000
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  }
};

// Helper for headers
const getHeaders = () => ({
  "Content-Type": "application/json",
  "x-goog-api-key": API_KEY || "",
});

// --- Core Function: Analyze Narrative & Generate Visual Bible ---

export const analyzeNarrative = async (
  narrative: string,
  styleNotes: string
): Promise<Partial<VisualBible>> => {
  if (!API_KEY)
    throw new Error("Missing GEMINI_API_KEY - check your .env.local file");

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

  console.log("[Gemini] Calling analyzeNarrative with model:", MODEL_TEXT);
  console.log("[Gemini] Narrative length:", narrative.length, "chars");

  const response = await fetchWithTimeout(
    `${BASE_URL}/${MODEL_TEXT}:generateContent`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          response_mime_type: "application/json",
          thinking_config: { thinking_level: THINKING_LEVEL }, // FORCE REASONING
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    console.error("[Gemini] API Error:", err);
    throw new Error(err.error?.message || "Visual Bible generation failed");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error("No response from Gemini");

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Visual Bible JSON:", text);
    throw new Error("Invalid JSON response from Gemini");
  }
};

// --- Core Function: Decompose Narrative into Scenes ---

export const decomposeIntoScenes = async (
  narrative: string,
  visualBible: VisualBible
): Promise<Omit<SceneNode, "id">[]> => {
  if (!API_KEY) throw new Error("Missing GEMINI_API_KEY");

  const granularityInstructions = {
    "Detailed Paragraph":
      "Break the narrative at each significant paragraph or 2-3 sentence cluster. Each scene should be a distinct moment.",
    "Sentence by Sentence":
      "Create a scene for almost every sentence. Maximum granularity.",
    "Key Beats":
      "Only break at major plot beats, emotional shifts, or scene changes. Fewer, more comprehensive scenes.",
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
   - Cinematography style (${visualBible.cinematography.lensType}, ${
    visualBible.cinematography.lightingStyle
  })
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

  const response = await fetch(`${BASE_URL}/${MODEL_TEXT}:generateContent`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        response_mime_type: "application/json",
        thinking_config: { thinking_level: THINKING_LEVEL },
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Scene decomposition failed");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error("No response from Gemini");

  try {
    const scenes = JSON.parse(text);
    return scenes.map((scene: any, index: number) => ({
      index,
      narrativeSegment: scene.narrativeSegment,
      basePrompt: scene.basePrompt,
      currentImagePrompt: scene.basePrompt,
      validationLog: [],
      overallStatus: "pending" as const,
    }));
  } catch (e) {
    console.error("Failed to parse scenes JSON:", text);
    throw new Error("Invalid JSON response from Gemini");
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
  enableFunctionCalling: boolean = true,
  images: string[] = []
): Promise<ChatResponse> => {
  if (!API_KEY) throw new Error("Missing GEMINI_API_KEY");

  const systemPrompt = `You are an expert film director and creative consultant helping build a comprehensive Visual Bible.
  
  ${
    visualBible
      ? `Current Visual Bible:
  - Title: ${visualBible.name}
  - Mood: ${visualBible.colorPalette.mood}
  - Themes: ${visualBible.narrativeThemes.join(", ")}
  `
      : ""
  }

  Your goal is to help the user refine this vision.
  
  RULES:
  1. If the user asks a question, ANSWER IT directly.
  2. ONLY call tools if the user EXPLICITLY asks to update data (e.g., "change hair to blue", "add a scar", "save this").
  3. DO NOT call tools for greetings (e.g., "hey", "hi") or general discussion.
  4. If the user provides an image without instructions, analyze it and ask how they want to use it.
  `;

  const contents: any[] = [
    { role: "user", parts: [{ text: systemPrompt }] },
    ...history.map((msg) => {
      // OPTIMIZATION: Do NOT send base64 images for past history. It burns tokens.
      // Replace with a placeholder so the model knows an image was there.
      const parts: any[] = [{ text: msg.content }];
      if (msg.images && msg.images.length > 0) {
        parts.push({ text: `[User sent ${msg.images.length} image(s) here]` });
      }
      return {
        role: msg.sender === "user" ? "user" : "model",
        parts,
      };
    }),
  ];

  // Construct current message parts - ONLY send images for the CURRENT turn
  const currentParts: any[] = [{ text: userMessage }];
  if (images && images.length > 0) {
    images.forEach((img) => {
      const cleanRef = img.replace(/^data:image\/\w+;base64,/, "");
      currentParts.push({
        inline_data: { mime_type: "image/png", data: cleanRef },
      });
    });
  }

  contents.push({ role: "user", parts: currentParts });

  // Import function declarations dynamically
  const { VISUAL_BIBLE_FUNCTIONS } = await import("./visualBibleFunctions");

  const body: any = { contents };

  if (enableFunctionCalling) {
    body.tools = [
      {
        function_declarations: VISUAL_BIBLE_FUNCTIONS,
      },
    ];
  }

  const response = await fetch(`${BASE_URL}/${MODEL_TEXT}:generateContent`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      ...body,
      generationConfig: {
        thinking_config: { thinking_level: THINKING_LEVEL },
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Chat failed");
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];

  if (!candidate) {
    return { text: "..." };
  }

  const parts = candidate.content?.parts || [];

  // Check if there are function calls
  const functionCalls = parts
    .filter((part: any) => part.functionCall)
    .map((part: any) => ({
      name: part.functionCall.name,
      args: part.functionCall.args,
    }));

  // Get text response if available
  const textParts = parts.filter((part: any) => part.text);
  const text = textParts.map((part: any) => part.text).join("\n\n");

  return {
    text: text || undefined,
    functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
  };
};

// --- Image Generation (Imagen 4) ---

// --- Image Generation (Gemini 3 Vision - The "Context Stack" Approach) ---

export interface ContextStack {
  narrative: string;
  visualBible: VisualBible;
  worldState?: any;
  referenceImages: {
    character: string[]; // Base64s
    setting: string[]; // Base64s
    previousFrame: string | string[] | null; // Base64 or array of Base64s
  };
  validationHistory?: any[];
}

export const generateSceneImage = async (
  prompt: string,
  contextStack: ContextStack,
  aspectRatio: string = "16:9"
): Promise<{ base64: string; seed?: number; thoughtSignature?: string }> => {
  if (!API_KEY) throw new Error("Missing GEMINI_API_KEY");

  // Construct the "Oversaturated" Prompt
  const systemPrompt = `Generate a high-fidelity, 4K cinematic image based on the following scene.
  
  SCENE PROMPT: "${prompt}"

  CRITICAL VISUAL CONTEXT (YOU MUST ADHERE TO THIS):
  - Cinematography: ${contextStack.visualBible.cinematography.lightingStyle}, ${contextStack.visualBible.cinematography.lensType}
  - Color Palette: ${contextStack.visualBible.colorPalette.mood}
  
  REFERENCE ADHERENCE:
  - The character in the generated image MUST visually match the provided Character Reference images EXACTLY.
  - The setting MUST match the Setting Reference images.
  - The lighting and color grading MUST be consistent with the Previous Frame (if provided).
  
  Output the image in ${aspectRatio} aspect ratio.`;

  const parts: any[] = [{ text: systemPrompt }];

  // Inject Reference Images (The "Stack")
  // 1. Character Refs
  contextStack.referenceImages.character.forEach((ref) => {
    parts.push({ inline_data: { mime_type: "image/png", data: ref } });
  });

  // 2. Setting Refs
  contextStack.referenceImages.setting.forEach((ref) => {
    parts.push({ inline_data: { mime_type: "image/png", data: ref } });
  });

  // 3. Previous Frames (Continuity Anchors)
  if (contextStack.referenceImages.previousFrame) {
    if (Array.isArray(contextStack.referenceImages.previousFrame)) {
      contextStack.referenceImages.previousFrame.forEach((ref) => {
        parts.push({ inline_data: { mime_type: "image/png", data: ref } });
      });
    } else {
      parts.push({
        inline_data: {
          mime_type: "image/png",
          data: contextStack.referenceImages.previousFrame,
        },
      });
    }
  }

  const response = await fetch(`${BASE_URL}/${MODEL_VISION}:generateContent`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        response_modalities: ["IMAGE"],
        // thinking_config REMOVED for Vision model compatibility
        image_config: {
          aspect_ratio: aspectRatio === "2K" ? "16:9" : aspectRatio, // Map '2K' to a ratio, size is handled below
          image_size: aspectRatio === "2K" ? "2K" : "4K", // Support 2K request
        },
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Image generation failed");
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find((p: any) => p.inline_data);

  if (!imagePart?.inline_data?.data) {
    throw new Error("No image data received from Gemini");
  }

  return {
    base64: imagePart.inline_data.data,
    thoughtSignature: imagePart.thoughtSignature, // Capture the "Memory"
  };
};

// --- Image Editing (Nano Banana / gemini-3-pro-image-preview) ---

export const editSceneImage = async (
  existingImageBase64: string,
  editInstructions: string,
  thoughtSignature?: string // The "Memory" of the previous generation
): Promise<{ base64: string; thoughtSignature?: string }> => {
  if (!API_KEY) throw new Error("Missing GEMINI_API_KEY");

  const parts: any[] = [
    { text: editInstructions },
    {
      inline_data: {
        mime_type: "image/png",
        data: existingImageBase64,
      },
    },
  ];

  // If we have a thought signature, we MUST send it back to maintain reasoning context
  if (thoughtSignature) {
    parts[0].thoughtSignature = thoughtSignature;
  }

  const response = await fetch(`${BASE_URL}/${MODEL_VISION}:generateContent`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        response_modalities: ["IMAGE"],
        // thinking_config REMOVED for Vision model compatibility
        image_config: { image_size: "4K" },
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Image editing failed");
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find((p: any) => p.inline_data);

  if (!imagePart?.inline_data?.data) {
    throw new Error("No edited image data received from Gemini");
  }

  return {
    base64: imagePart.inline_data.data,
    thoughtSignature: imagePart.thoughtSignature,
  };
};

// --- Video Generation (Veo) ---

export const generateSceneVideo = async (
  imageBase64: string,
  prompt: string,
  referenceImages: string[] = [], // NEW: Veo 3.1 Reference Images
  duration: number = 5
): Promise<{ uri?: string; operationId?: string }> => {
  if (!API_KEY) throw new Error("Missing GEMINI_API_KEY");

  // Construct Reference Image Objects for Veo
  const references = referenceImages.map((ref) => ({
    image: { image64: ref },
    reference_type: "asset", // As per docs
  }));

  const response = await fetch(`${BASE_URL}/${MODEL_VIDEO}:generateVideo`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      prompt: { text: prompt },
      image: { image64: imageBase64 }, // Start frame
      duration_seconds: duration,
      fps: 24,
      aspect_ratio: "16:9",
      reference_images: references.length > 0 ? references : undefined, // Inject the references
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Video generation failed");
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
  validationType: "IMMEDIATE" | "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM"
): Promise<{
  passed: boolean;
  score: number;
  critique: string;
  fixInstructions?: string;
}> => {
  if (!API_KEY) throw new Error("Missing GEMINI_API_KEY");

  const validationFocus = {
    IMMEDIATE:
      "Focus on technical quality, composition, and whether this image matches the intended narrative moment.",
    SHORT_TERM:
      "Focus on immediate visual continuity: lighting consistency, character pose/position flow, and motion coherence from the reference image.",
    MEDIUM_TERM:
      "Focus on pacing, character appearance consistency (clothing, hair, features), and evolving mood across this sequence.",
    LONG_TERM:
      "Focus on protagonist consistency from the very first frame, overall genre adherence, color palette consistency, and core Visual Bible principles.",
  };

  const prompt = `You are a brutal film critic analyzing this generated image for a narrative video project.

**Validation Type**: ${validationType}
**Focus**: ${validationFocus[validationType]}

**Scene Context**:
Narrative: "${scene.narrativeSegment}"
Intended Prompt: "${scene.currentImagePrompt}"

**Visual Bible Requirements**:
- Color Palette: ${
    visualBible.colorPalette.mood
  } (${visualBible.colorPalette.hexCodes.join(", ")})
- Cinematography: ${visualBible.cinematography.lightingStyle}, ${
    visualBible.cinematography.lensType
  }
- Key Characters: ${Object.entries(visualBible.characters)
    .map(
      ([id, c]) =>
        `${c.name}: ${
          Array.isArray(c.keyFeatures)
            ? c.keyFeatures.join(", ")
            : c.keyFeatures || "N/A"
        }`
    )
    .join(" | ")}

${
  referenceImageBase64
    ? "Compare this image against the reference image for continuity."
    : "This is a standalone validation."
}

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
        mime_type: "image/png",
        data: referenceImageBase64,
      },
    });
  }

  parts.push({
    inline_data: {
      mime_type: "image/png",
      data: imageBase64,
    },
  });

  const response = await fetch(`${BASE_URL}/${MODEL_VISION}:generateContent`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        response_mime_type: "application/json",
        // thinking_config REMOVED for Vision model compatibility
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Validation failed");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  try {
    const result = JSON.parse(text);
    return {
      passed: result.score >= 7,
      score: result.score,
      critique: result.critique,
      fixInstructions: result.score < 7 ? result.fixInstructions : undefined,
    };
  } catch (e) {
    console.error("Failed to parse validation JSON:", text);
    return { passed: false, score: 0, critique: "Validation parsing failed" };
  }
};

export const generateItemReference = async (
  prompt: string,
  referenceImages: string[] = []
): Promise<{ base64: string; thoughtSignature?: string }> => {
  if (!API_KEY) throw new Error("Missing GEMINI_API_KEY");

  const parts: any[] = [{ text: prompt }];

  // Attach reference images if provided
  referenceImages.forEach((ref) => {
    // Strip prefix if present
    const cleanRef = ref.replace(/^data:image\/\w+;base64,/, "");
    parts.push({ inline_data: { mime_type: "image/png", data: cleanRef } });
  });

  const response = await fetch(`${BASE_URL}/${MODEL_VISION}:generateContent`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        response_modalities: ["IMAGE"],
        // thinking_config REMOVED for Vision model compatibility
        image_config: {
          aspect_ratio: "1:1", // Square for reference cards
          image_size: "2K",
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini Vision API Error: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  const imagePart = data.candidates?.[0]?.content?.parts?.find(
    (p: any) => p.inline_data
  );

  if (!imagePart) {
    throw new Error("No image generated in response");
  }

  return {
    base64: imagePart.inline_data.data,
    thoughtSignature: imagePart.thoughtSignature,
  };
};
