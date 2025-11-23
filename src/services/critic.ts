import { type VisualBible, type SceneNode } from '../types';
// import { generateContent } from './gemini';

interface ValidationResult {
  pass: boolean;
  score: number;
  roast: string;
  fixInstructions?: string;
}

export const validateImage = async (
  _image: string, // Base64
  scene: SceneNode,
  referenceScene: SceneNode | null,
  visualBible: VisualBible,
  type: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM',
  _apiKey: string
): Promise<ValidationResult> => {
  
  console.log(`[Critic] Validating scene ${scene.index} against ${referenceScene?.index ?? 'None'} (${type})`);

  // Construct the prompt for the Critic
  const prompt = `
    You are THE CRITIC. A discerning, brutal, and highly visual AI art director.
    Your job is to validate a generated image against a reference image and a "Visual Bible" style guide.
    
    CONTEXT:
    - Project Name: ${visualBible.name}
    - Current Scene Narrative: "${scene.narrativeSegment}"
    - Validation Type: ${type}
    
    VISUAL BIBLE GUIDELINES:
    - Mood: ${visualBible.colorPalette.mood}
    - Lighting: ${visualBible.cinematography.lightingStyle}
    - Key Motifs: ${visualBible.keyMotifs.map(m => m.description).join(', ')}
    
    TASK:
    Compare the CURRENT IMAGE (attached first) with the REFERENCE IMAGE (attached second, if provided).
    
    CHECK FOR:
    1. Consistency: Do the characters look the same? Is the lighting consistent?
    2. Adherence: Does it match the narrative and Visual Bible?
    3. Quality: Are there artifacts, glitches, or weird hands?
    
    OUTPUT JSON ONLY:
    {
      "pass": boolean,
      "score": number (0-10),
      "roast": "A short, biting comment on the quality.",
      "fix_instructions": "If fail, detailed instructions for the prompt engineer to fix it."
    }
  `;
  
  console.log('Generated Validation Prompt:', prompt);

  // In a real implementation, we would attach the images as inlineData
  // const messages = [
  //   { role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: 'image/png', data: image } }] }
  // ];
  
  // Mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      const isPass = Math.random() > 0.3; // 70% pass rate for mock
      resolve({
        pass: isPass,
        score: isPass ? 8 : 4,
        roast: isPass ? "Acceptable. Barely." : "What is this garbage? The lighting is all wrong.",
        fixInstructions: isPass ? undefined : "Fix the lighting contrast and ensure the character's eyes are blue.",
      });
    }, 1500);
  });
};
