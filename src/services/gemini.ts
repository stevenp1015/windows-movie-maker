import { type VisualBible, type SceneNode, type ChatMessage } from "../types";
import { type PreCreatedEntity } from "../types/preEntity";
import { logger } from "./logger";

// Re-export beat decomposition from separate module
export { decomposeIntoBeats } from "./beatDecomposition";

// Read from .env.local (Vite auto-loads as import.meta.env.VITE_*)
// But user has it as GEMINI_API_KEY, so we need a workaround
const API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY || (window as any).__GEMINI_API_KEY__;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Models (use 2.5 Pro as fallback if 3.0 isn't available yet)
// Models - ALL GEMINI 3 PRO PREVIEW (The "Monstrosity" Standard)
const MODEL_TEXT = "gemini-2.5-pro";
const MODEL_VISION = "gemini-3-pro-image-preview"; // Nano Banana
const MODEL_VIDEO = "veo-3.1-generate-preview";

// Configuration Constants
const THINKING_LEVEL = "high"; // "No Thoughts, Head Empty" is forbidden

// Helper to create fetch with timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = 120000
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
  styleNotes: string,
  preCreatedEntities?: PreCreatedEntity[]
): Promise<Partial<VisualBible>> => {
  if (!API_KEY)
    throw new Error("Missing GEMINI_API_KEY - check your .env.local file");

  const GOD_TIER_VISUAL_BIBLE_PROMPT = `You are the Master Cinematographer and Visual Bible Architect for a narrative-to-video AI pipeline.

YOUR MISSION: Extract and structure a comprehensive Visual Bible from the provided narrative that will serve as the CANONICAL REFERENCE for ALL subsequent image and video generation in this pipeline.

CRITICAL CONTEXT: 
This Visual Bible is the MAKE-OR-BREAK foundation of the entire system. Every character description, every setting detail, every cinematographic choice you define here will be used to generate hundreds of images and videos. Consistency failures here cascade catastrophically. BE EXHAUSTIVE. BE SPECIFIC. BE CONSISTENT.

INPUT:
- Full Narrative Text
- User's Style Notes (optional additional creative direction)

OUTPUT STRUCTURE (JSON):
{
  "narrativeThemes": [
    // 3-5 core themes (e.g., "isolation vs connection", "redemption through sacrifice")
  ],
  
  "keyMotifs": [
    {
      "description": "recurring visual symbol or element",
      "visualExamples": ["specific manifestations of this motif in the narrative"]
    }
  ],
  
  "characters": {
    "[characterId]": {
      "name": string,
      "description": "comprehensive 2-3 sentence character overview",
      "roleInNarrative": "protagonist | antagonist | supporting | tertiary",
      
      // ULTRA-SPECIFIC PHYSICAL DESCRIPTION
      // Think: if a forensic sketch artist needed to draw this person from your description alone
      "coreVisualIdentity": {
        "facialStructure": "DETAILED: face shape, bone structure, asymmetries, scars, distinguishing marks",
        "eyes": "DETAILED: exact color (not just 'blue' - 'steel blue with amber flecks'), shape, intensity",
        "hair": "DETAILED: texture, length, style, color (use specific terms like 'ash blonde' not 'blonde'), how it moves",
        "build": "DETAILED: height, build, posture, gait, how they occupy space",
        "signatureElements": [
          "Specific items ALWAYS associated with this character",
          "e.g., 'worn leather jacket with brass zipper, never fully zipped'",
          "e.g., 'silver ring on right index finger, thin band with microscopic engraving'"
        ],
        "bodyLanguage": "How they move, gesture, express emotion physically"
      },
      
      "appearance": {
        "attire": "DEFAULT outfit description (what they wear in most scenes)",
        "distinguishingMarks": "Tattoos, scars, birthmarks, anything permanent",
        "ageApparent": "How old they appear (may differ from actual age)"
      },
      
      "emotionalArc": "Brief description of their emotional journey through the narrative",
      
      // Extract key emotional states they experience
      "keyEmotionalBeats": [
        {
          "emotion": "specific emotion at a narrative point",
          "facialExpression": "how this manifests facially",
          "posture": "how this manifests in body language"
        }
      ]
    }
  },
  
  "settings": {
    "[settingId]": {
      "name": string,
      "locationType": "interior | exterior | mixed",
      
      // MASTER VISUAL DESCRIPTION
      // Imagine you're describing this to a production designer who needs to build the set
      "masterDescription": "Comprehensive 3-4 sentence description covering layout, materials, colors, textures, scale, mood",
      
      "locationDescription": "Geographic/contextual location info",
      "timePeriod": "When this setting exists (contemporary, 1920s, futuristic, etc.)",
      
      "atmosphere": "The FEELING of this place (oppressive, serene, chaotic, intimate, etc.)",
      
      "lightingConditions": {
        "primarySource": "natural sunlight | artificial | mixed",
        "timeOfDay": "dawn | morning | midday | afternoon | dusk | night",
        "weatherCondition": "clear | overcast | rainy | foggy | etc.",
        "artificialLighting": "description of any lamps, fixtures, ambient glow",
        "mood": "warm | cool | neutral | dramatic | soft"
      },
      
      "keyVisualElements": [
        "Specific, memorable details that make this setting unique",
        "e.g., 'Art deco chandelier with missing crystals, casts fragmented light'",
        "e.g., 'Exposed brick wall, northeastern corner, water-stained from old leak'"
      ],
      
      "propLibrary": {
        "[propId]": "description of recurring prop in this setting"
      },
      
      "soundscape": "Ambient sounds characteristic of this setting (for video audio generation)"
    }
  },
  
  "props": {
    "[propId]": {
      "name": string,
      "description": "Detailed visual description",
      "significance": "Why this prop matters narratively",
      "firstAppearance": "Where in narrative this prop is introduced",
      "associatedCharacters": ["character IDs who interact with this prop"]
    }
  },
  
  "cinematography": {
    "overallStyle": "e.g., 'gritty realism', 'dreamlike surrealism', 'classical Hollywood'",
    
    "lensChoices": {
      "establishing": "lens type for wide/establishing shots",
      "dialogue": "lens type for conversation scenes",
      "action": "lens type for action/movement scenes",
      "intimate": "lens type for close-ups/emotional beats"
    },
    
    "filmGrain": "none | subtle 35mm | pronounced 16mm | digital clean",
    "lightingStyle": "naturalistic | high-contrast noir | soft romantic | etc.",
    
    "cameraMovement": {
      "tensionScenes": "handheld, shaky, unstable",
      "contemplativeScenes": "slow dolly, smooth, deliberate",
      "actionScenes": "dynamic tracking, whip pans, kinetic",
      "dialogueScenes": "static, slow push-in, subtle reframing"
    },
    
    "cameraAngles": {
      "powerDynamics": "use of low/high angles to show dominance/submission",
      "defaultNeutral": "eye-level, straight-on",
      "emotionalIsolation": "dutch angle, off-center framing"
    },
    
    "colorGrading": {
      "lutDescription": "Overall color treatment (e.g., 'warm amber highlights with teal shadows, slightly desaturated')",
      "moodDescription": "Emotional color story (e.g., 'hopeful yet melancholic')",
      "specificColorRules": [
        "e.g., 'warm tones dominate happy memories, cool tones for present reality'",
        "e.g., 'gradual desaturation as protagonist loses hope'"
      ]
    }
  },
  
  "colorPalette": {
    "mood": "overall color mood for the story",
    "hexCodes": ["#hex", "#hex", "#hex"], // 5-8 dominant colors
    "description": "How these colors relate to themes/emotions"
  }
}

INSTRUCTIONS:

1. READ THE ENTIRE NARRATIVE CAREFULLY.

2. IDENTIFY ALL CHARACTERS:
   - Extract EVERY named character
   - Create character IDs: lowercase, underscore-separated (e.g., "steven_parkland", "dr_pfizer")
   - For each, write the most SPECIFIC physical description possible
   - Think forensic detail: what would make this person recognizable in a police lineup?
   - DO NOT use vague terms. "Blonde hair" → "honey blonde hair, shoulder-length, slight natural wave, tends to fall over right eye"

3. IDENTIFY ALL SETTINGS:
   - Extract every distinct location where narrative events occur
   - Create setting IDs: lowercase, underscore-separated (e.g., "conference_room_novavax_hq")
   - Describe comprehensively: architecture, furnishings, lighting, textures, spatial layout
   - Include sensory details: "smells faintly of old coffee and printer toner"

4. IDENTIFY ALL SIGNIFICANT PROPS:
   - Objects that recur or have narrative weight
   - Create prop IDs: lowercase, underscore-separated (e.g., "pfizers_research_folder")
   - Visual specificity: "manila folder, slightly warped from humidity, coffee ring on top right corner"

5. DEFINE CINEMATOGRAPHY:
   - Infer from narrative tone what cinematic style fits
   - Be specific about lens choices, not generic
   - Explain color grading in precise terms (LUT descriptions, specific color relationships)

6. EXTRACT THEMES & MOTIFS:
   - What visual symbols recur?
   - What thematic elements could translate visually?
   - How can color/lighting support these themes?

QUALITY CHECKS:
- Can someone generate a consistent image of each character across 100 frames using ONLY your description? If no, ADD MORE DETAIL.
- Can someone build a 3D model of each setting using ONLY your description? If no, ADD MORE DETAIL.
- Is every important narrative element visually represented? If no, ADD IT.

THINK STEP BY STEP. BE EXHAUSTIVE. THIS IS THE FOUNDATION OF EVERYTHING.

NOW: Generate the Visual Bible for the following narrative.

NARRATIVE:
${narrative}

${
  styleNotes
    ? `
USER STYLE NOTES:
${styleNotes}
`
    : ""
}

Respond with valid JSON ONLY.`;

  const startTime = Date.now();
  logger.generation("Starting Visual Bible generation", {
    narrativeLength: narrative.length,
    model: MODEL_TEXT,
    hasPreEntities: !!preCreatedEntities?.length,
  });

  console.log("[Gemini] Calling GOD-TIER Visual Bible generation");
  console.log("[Gemini] Narrative length:", narrative.length, "chars");
  console.log("[Gemini] Using model:", MODEL_TEXT);

  const requestBody: any = {
    contents: [{ parts: [{ text: GOD_TIER_VISUAL_BIBLE_PROMPT }] }],
  };

  // Note: generationConfig removed for 2.5 Pro compatibility
  // When you switch back to 3.0 Pro, add:
  // generationConfig: {
  //   response_mime_type: "application/json",
  //   thinking_config: { thinking_level: THINKING_LEVEL }
  // }

  console.log("[Gemini] Request config:", JSON.stringify(requestBody));

  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/${MODEL_TEXT}:generateContent`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error(
        "[Gemini] API Error Response:",
        JSON.stringify(err, null, 2)
      );
      throw new Error(err.error?.message || JSON.stringify(err));
    }

    const data = await response.json();
    console.log("[Gemini] Response candidates:", data.candidates?.length);
    console.log("[Gemini] Full response:", JSON.stringify(data, null, 2));

    // Check for safety/blocking
    if (data.candidates?.[0]?.finishReason === "SAFETY") {
      console.error(
        "[Gemini] Response blocked by safety filters:",
        data.candidates[0]
      );
      throw new Error("Response blocked by safety filters");
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("[Gemini] No text in response");
      throw new Error("No response from Gemini - check console for details");
    }

    console.log("[Gemini] Response length:", text.length, "chars");

    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonText = text;
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
        console.log("[Gemini] Extracted JSON from code block");
      }

      const parsed = JSON.parse(jsonText);

      // Initialize empty props if not present
      if (!parsed.props) {
        parsed.props = {};
      }

      const duration = Date.now() - startTime;
      logger.success("Visual Bible generated", {
        duration: `${duration}ms`,
        characters: Object.keys(parsed.characters || {}).length,
        settings: Object.keys(parsed.settings || {}).length,
        props: Object.keys(parsed.props || {}).length,
      });

      return parsed;
    } catch (e) {
      console.error(
        "Failed to parse Visual Bible JSON:",
        text.substring(0, 500)
      );
      logger.error("Failed to parse Visual Bible JSON", {
        error: e,
        responseText: text.substring(0, 500),
      });
      throw new Error("Invalid JSON response from Gemini - check console");
    }
  } catch (error: any) {
    logger.error("Visual Bible generation failed", error);
    console.error("[Gemini] Exception during API call:", error);
    console.error("[Gemini] Error message:", error.message);
    console.error("[Gemini] Error stack:", error.stack);
    throw error;
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
        //        thinking_config: { thinking_level: THINKING_LEVEL },
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
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
      ],
      generationConfig: {
        //        thinking_config: { thinking_level: THINKING_LEVEL },
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
  aspectRatio: "16:9" | "2K" | "4K" = "2K",
  inputImage?: string,
  thoughtSignature?: string
): Promise<{ base64: string; seed?: number; thoughtSignature?: string }> => {
  if (!API_KEY) throw new Error("Missing GEMINI_API_KEY");

  const startTime = Date.now();
  logger.generation(
    inputImage ? "Editing scene image" : "Generating scene image",
    {
      model: MODEL_VISION,
      aspectRatio,
      hasInput: !!inputImage,
      hasContext: !!contextStack.referenceImages,
    }
  );

  // Construct the System Prompt
  const systemPrompt = `
  You are an expert cinematographer and visual effects artist.
  
  TASK:
  ${
    inputImage
      ? "Edit the provided image based on the instructions below."
      : "Generate a high-fidelity movie scene based on the description below."
  }
  
  NARRATIVE CONTEXT:
  "${contextStack.narrative}"
  
  INSTRUCTIONS:
  ${prompt}
  
  REQUIREMENTS:
  - Photorealistic, cinematic lighting, 35mm film grain.
  - Consistent character identity with provided references.
  - Maintain continuity with the previous frame (if provided).
  ${
    inputImage
      ? "- PRESERVE the composition and details of the input image unless explicitly asked to change them."
      : ""
  }
  `;

  const parts: any[] = [{ text: systemPrompt }];

  // Helper to clean base64
  const cleanBase64 = (str: string) =>
    str.replace(/^data:image\/\w+;base64,/, "");

  // 0. Input Image (For Editing)
  if (inputImage) {
    parts.push({
      inline_data: { mime_type: "image/png", data: cleanBase64(inputImage) },
    });
  }

  // 1. Character Refs
  contextStack.referenceImages.character.forEach((ref) => {
    parts.push({
      inline_data: { mime_type: "image/png", data: cleanBase64(ref) },
    });
  });

  // 2. Setting Refs
  contextStack.referenceImages.setting.forEach((ref) => {
    parts.push({
      inline_data: { mime_type: "image/png", data: cleanBase64(ref) },
    });
  });

  // 3. Previous Frames (Continuity Anchors)
  if (contextStack.referenceImages.previousFrame) {
    if (Array.isArray(contextStack.referenceImages.previousFrame)) {
      contextStack.referenceImages.previousFrame.forEach((ref) => {
        parts.push({
          inline_data: { mime_type: "image/png", data: cleanBase64(ref) },
        });
      });
    } else {
      parts.push({
        inline_data: {
          mime_type: "image/png",
          data: cleanBase64(contextStack.referenceImages.previousFrame),
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
        imageConfig: {
          aspectRatio: aspectRatio === "2K" ? "16:9" : aspectRatio,
          imageSize: aspectRatio === "4K" ? "4K" : "2K",
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

  // Handle both camelCase (Gemini 3) and snake_case (Legacy/REST)
  const imagePart = candidate?.content?.parts?.find(
    (p: any) => p.inlineData || p.inline_data
  );

  if (!imagePart) {
    const textPart = candidate?.content?.parts?.find((p: any) => p.text);
    if (textPart) throw new Error(`Gemini returned text: "${textPart.text}"`);
    throw new Error("No image data received from Gemini");
  }

  const inlineData = imagePart.inlineData || imagePart.inline_data;

  if (!inlineData?.data) {
    throw new Error("Image part found but data is missing");
  }

  return {
    base64: inlineData.data,
    thoughtSignature: imagePart.thoughtSignature,
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
        image_config: { image_size: "2K" },
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

  const startTime = Date.now();
  logger.generation("Generating item reference image", {
    model: MODEL_VISION,
    referenceCount: referenceImages.length,
  });

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

  // Check for both camelCase and snake_case
  const imagePart = data.candidates?.[0]?.content?.parts?.find(
    (p: any) => p.inlineData || p.inline_data
  );

  if (!imagePart) {
    console.error(
      "[Vision] No image part. Response:",
      JSON.stringify(data).substring(0, 300)
    );
    throw new Error("No image generated in response");
  }

  // Support both naming conventions
  const imageData = imagePart.inlineData || imagePart.inline_data;

  const duration = Date.now() - startTime;
  logger.success("Item reference generated", { duration: `${duration}ms` });

  return {
    base64: imageData.data,
    thoughtSignature: imagePart.thoughtSignature || imageData.thoughtSignature,
  };
};
