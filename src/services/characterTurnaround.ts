import { type VisualBible, type CharacterTurnaround } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || (window as any).__GEMINI_API_KEY__;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL_IMAGE = 'gemini-3-pro-image-preview'; // Nano Banana Pro

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-goog-api-key': API_KEY || '',
});

interface GenerationStep {
  viewName: 'front' | 'sideLeft' | 'sideRight' | 'back';
  prompt: string;
  previousImages: Array<{ base64: string; thoughtSignature?: string }>;
}

/**
 * Generate a complete character turnaround (front, side-left, side-right, back)
 * using iterative Nano Banana generation with thought signatures for perfect consistency
 */
export const generateCharacterTurnaround = async (
  characterId: string,
  character: {
    name: string;
    description: string;
    appearance: {
      hair: string;
      eyes: string;
      build: string;
      attire: string;
      distinguishingMarks: string;
    };
  },
  visualBible: VisualBible,
  onProgress?: (step: number, total: number, viewName: string) => void
): Promise<CharacterTurnaround> => {
  if (!API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  // Base prompt for the character (used in all generations)
  const basePrompt = `A high-resolution 4K character reference sheet image.

CHARACTER: ${character.name}
${character.description}

APPEARANCE DETAILS:
- Hair: ${character.appearance.hair}
- Eyes: ${character.appearance.eyes}
- Build: ${character.appearance.build}
- Clothing: ${character.appearance.attire}
- Distinguishing marks: ${character.appearance.distinguishingMarks}

VISUAL STYLE:
- Cinematography: ${visualBible.cinematography.lightingStyle}
- Color Palette: ${visualBible.colorPalette.description}
- Lighting: Professional studio lighting for character reference, even and consistent

CRITICAL REQUIREMENTS:
- This is a CHARACTER REFERENCE image for a multi-million dollar production
- Crystal-clear facial features with photorealistic detail
- Accurate proportions and anatomically correct
- Consistent details that will be used across hundreds of frames
- High-fidelity, publication-quality rendering`;

  const turnaround: CharacterTurnaround = {
    characterId,
    views: {
      front: { base64: '', thoughtSignature: undefined },
      sideLeft: { base64: '', thoughtSignature: undefined },
      sideRight: { base64: '', thoughtSignature: undefined },
      back: { base64: '', thoughtSignature: undefined }
    },
    metadata: {
      resolution: '4K',
      createdAt: Date.now()
    },
    status: 'generating'
  };

  // Define the generation sequence
  const steps: GenerationStep[] = [
    {
      viewName: 'front',
      prompt: `${basePrompt}\n\nVIEW: Front-facing, looking directly at camera with neutral expression. Full body visible from head to toe. Standing straight, arms at sides.`,
      previousImages: []
    },
    {
      viewName: 'sideLeft',
      prompt: `Perfect. Now generate the EXACT same character from a 90-degree left side profile view. The character should be facing left, showing their left side profile. Maintain IDENTICAL appearance, clothing, and proportions.`,
      previousImages: [] // Will be populated with front view
    },
    {
      viewName: 'sideRight',
      prompt: `Excellent. Now generate the EXACT same character from a 90-degree RIGHT side profile view. The character should be facing right, showing their right side profile. Maintain IDENTICAL appearance to the previous images.`,
      previousImages: [] // Will be populated with front + sideLeft
    },
    {
      viewName: 'back',
      prompt: `Perfect consistency. Now generate the EXACT same character from directly behind, showing their back view. Full body, same lighting, same clothing, IDENTICAL person.`,
      previousImages: [] // Will be populated with all previous views
    }
  ];

  // Helper to make API call with conversation history
  const generateView = async (
    prompt: string,
    conversationHistory: Array<{ role: 'user' | 'model'; parts: any[] }>
  ): Promise<{ base64: string; thoughtSignature?: string }> => {
    const response = await fetch(
      `${BASE_URL}/${MODEL_IMAGE}:generateContent`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          contents: [
            ...conversationHistory,
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseModalities: ['IMAGE'],
            imageConfig: {
              aspectRatio: '2:3', // Portrait orientation for character sheets
              imageSize: '4K'
            }
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Image generation failed: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    
    if (!candidate) {
      throw new Error('No image generated');
    }

    // Extract image and thought signature from response
    const imagePart = candidate.content.parts.find((p: any) => p.inlineData);
    const thoughtSignature = imagePart?.thoughtSignature;

    return {
      base64: imagePart.inlineData.data,
      thoughtSignature
    };
  };

  // Maintain conversation history for thought signatures
  const conversationHistory: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

  // Execute each generation step sequentially
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    onProgress?.(i + 1, steps.length, step.viewName);

    try {
      const result = await generateView(step.prompt, conversationHistory);

      // Store the result
      turnaround.views[step.viewName] = result;

      // Add to conversation history for context
      conversationHistory.push({
        role: 'user',
        parts: [{ text: step.prompt }]
      });

      conversationHistory.push({
        role: 'model',
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: result.base64
            },
            ...(result.thoughtSignature ? { thoughtSignature: result.thoughtSignature } : {})
          }
        ]
      });

    } catch (error) {
      console.error(`Failed to generate ${step.viewName} view:`, error);
      turnaround.status = 'error';
      throw error;
    }
  }

  turnaround.status = 'complete';
  return turnaround;
};

/**
 * Regenerate a single view of the turnaround while maintaining consistency
 */
export const regenerateTurnaroundView = async (
  existingTurnaround: CharacterTurnaround,
  viewToRegenerate: 'front' | 'sideLeft' | 'sideRight' | 'back',
  character: any,
  visualBible: VisualBible,
  customInstructions?: string
): Promise<{ base64: string; thoughtSignature?: string }> => {
  // Build conversation history from existing views (except the one being regenerated)
  const conversationHistory: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

  const viewOrder: Array<'front' | 'sideLeft' | 'sideRight' | 'back'> = 
    ['front', 'sideLeft', 'sideRight', 'back'];

  // Add all previous views to history
  for (const view of viewOrder) {
    if (view === viewToRegenerate) break;
    
    const viewData = existingTurnaround.views[view];
    if (viewData && viewData.base64) {
      conversationHistory.push({
        role: 'model',
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: viewData.base64
            },
            ...(viewData.thoughtSignature ? { thoughtSignature: viewData.thoughtSignature } : {})
          }
        ]
      });
    }
  }

  // Generate prompt for the specific view
  const viewPrompts = {
    front: 'Front-facing view, looking directly at camera',
    sideLeft: '90-degree left side profile view',
    sideRight: '90-degree right side profile view',
    back: 'Back view, showing the character from behind'
  };

  const prompt = `Regenerate the ${viewPrompts[viewToRegenerate]} of ${character.name}.
${customInstructions ? `\nADDITIONAL INSTRUCTIONS: ${customInstructions}` : ''}

Maintain IDENTICAL appearance to the reference images shown.`;

  const response = await fetch(
    `${BASE_URL}/${MODEL_IMAGE}:generateContent`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        contents: [
          ...conversationHistory,
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            aspectRatio: '2:3',
            imageSize: '4K'
          }
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Regeneration failed: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const imagePart = candidate?.content.parts.find((p: any) => p.inlineData);

  return {
    base64: imagePart.inlineData.data,
    thoughtSignature: imagePart?.thoughtSignature
  };
};
