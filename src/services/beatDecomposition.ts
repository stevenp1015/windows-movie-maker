import { type VisualBible, type NarrativeBeat } from "../types";
import { type PreCreatedEntity } from "../types/preEntity";
import { logger } from "./logger";

// Implementation of the GOD-TIER beat decomposition prompt from implementation_plan.md (lines 696-863)
export const decomposeIntoBeats = async (
  narrative: string,
  visualBible: VisualBible
): Promise<NarrativeBeat[]> => {
  const API_KEY =
    import.meta.env.VITE_GEMINI_API_KEY || (window as any).__GEMINI_API_KEY__;
  const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

  // Models (use 2.5 Pro as fallback if 3.0 isn't available yet)
  // Models - ALL GEMINI 3 PRO PREVIEW (The "Monstrosity" Standard)
  const MODEL_TEXT = "gemini-2.5-pro";

  if (!API_KEY) throw new Error("Missing GEMINI_API_KEY");

  const startTime = Date.now();
  logger.generation("Starting narrative beat decomposition", {
    narrativeLength: narrative.length,
    granularity: visualBible.granularityLevel,
    model: MODEL_TEXT,
  });

  const granularityInstructions = {
    "Detailed Paragraph":
      "Break at each significant paragraph or 2-3 sentence cluster. Each beat should be a distinct visual moment, roughly 6-8 seconds of screen time.",
    "Sentence by Sentence":
      "Create a beat for almost every sentence. Maximum granularity - every micro-moment becomes a discrete visual beat.",
    "Key Beats":
      "Only break at major plot beats, emotional shifts, or scene changes. Longer beats (8-15 seconds of screen time), fewer total beats.",
  };

  // Construct lightweight Visual Bible reference (IDs and names only, NO base64 images)
  const characterSummary = Object.entries(visualBible.characters || {})
    .map(([id, char]) => `- ${id}: "${char.name}"`)
    .join("\n");

  const settingSummary = Object.entries(visualBible.settings || {})
    .map(([id, setting]) => `- ${id}: "${setting.name}"`)
    .join("\n");

  const propSummary = Object.entries(visualBible.props || {})
    .map(([id, prop]) => `- ${id}: "${prop.name}"`)
    .join("\n");

  const BEAT_DECOMPOSITION_PROMPT = `You are the Master Scene Architect for a narrative-to-video AI pipeline.

YOUR MISSION: Decompose the provided narrative into NARRATIVE BEATS - precise, visually distinct moments that will become keyframe images and video segments.

CRITICAL CONTEXT:
This is NOT traditional scene breakdown. You are creating the EXACT sequence of visual moments that will be generated as images and then videos. Each beat you define will result in:
- 1-2 keyframe images (2K resolution)
- 1 video segment (6-8 seconds)

The beats you define MUST:
1. Cover EVERY moment in the narrative (nothing skipped)
2. Be visually distinct (clear start/end)
3. Have explicit entity references (which characters, setting, props)
4. Include cinematographic direction
5. Specify whether single keyframe or interpolation pair is needed

VISUAL BIBLE ENTITY REFERENCE:

AVAILABLE CHARACTERS:
${characterSummary || "None defined"}

AVAILABLE SETTINGS:
${settingSummary || "None defined"}

AVAILABLE PROPS:
${propSummary || "None defined"}

CINEMATOGRAPHY RULES:
- Overall Style: ${visualBible.cinematography?.overallStyle || "Naturalistic"}
- Lens Choices: ${JSON.stringify(visualBible.cinematography?.lensChoices || {})}
- Camera Movement: ${JSON.stringify(
    visualBible.cinematography?.cameraMovement || {}
  )}
- Lighting: ${visualBible.cinematography?.lightingStyle || "Natural"}

GRANULARITY LEVEL: ${visualBible.granularityLevel}
${granularityInstructions[visualBible.granularityLevel]}

OUTPUT STRUCTURE (JSON Array):
[
  {
    "index": number,
    "beatType": "plot_advance" | "emotional_shift" | "location_change" | "character_introduction" | "climactic_moment",
    
    "narrativeSegment": "EXACT quote from source narrative",
    
    "characters": {
      "inFrame": ["character_id_1", "character_id_2"], // Characters visible in this beat
      "offFrame": ["character_id_3"], // Present in scene but not in shot
      "emotionalStates": {
        "character_id_1": "skeptical, defensive",
        "character_id_2": "confident, slightly condescending"
      }
    },
    
    "setting": {
      "settingId": "setting_id_from_bible",
      "specificLocation": "Precise location within setting (e.g., 'north side of conference table, near windows')"
    },
    
    "props": {
      "foreground": ["prop_id_1"], // Props in focus/being interacted with
      "background": ["prop_id_2", "prop_id_3"] // Visible but not focus
    },
    
    "keyframeStrategy": "single_static" | "interpolation_pair" | "action_sequence",
    // single_static: One image, subtle 6s animation (e.g., establishing shot, reaction shot)
    // interpolation_pair: Two images, 8s interpolated video between them (e.g., character walks across room)
    // action_sequence: Multiple beats linked for extension (e.g., long fight scene)
    
    "keyframes": {
      "startFrame": {
        "promptSpecifics": "Detailed visual description of THIS specific moment",
        "cameraAngle": "e.g., 'eye-level, slightly over Steven's right shoulder'",
        "composition": "e.g., 'two-shot, shallow focus on Steven in foreground, Pfizer slightly out of focus background'",
        "action": "What's happening: 'Steven gestures at document on table, Pfizer leans back in chair with crossed arms'"
      },
      
      // ONLY include endFrame if keyframeStrategy is "interpolation_pair"
      "endFrame": {
        "promptSpecifics": "Visual state after 8 seconds of action",
        "cameraAngle": "Camera position at end",
        "composition": "Framing at end",
        "action": "Final state: 'Steven has stood up, Pfizer looks away toward window'"
      }
    },
    
    "audioDirection": {
      "dialogue": [
        "CHARACTER_NAME: 'quoted speech'",
        "CHARACTER_NAME: 'response'"
      ],
      "soundEffects": ["paper rustling", "chair creaking"],
      "ambience": "quiet conference room, distant HVAC hum, muted city sounds through windows"
    },
    
    "cinematography": {
      "lens": "50mm prime", // Choose from Visual Bible lens options based on beat type
      "movement": "static" | "slow push-in" | "dolly left" | "handheld", // Choose from Visual Bible movement rules
      "lighting": "soft natural light from windows, overhead fluorescents create slight color cast"
    },
    
    "estimatedDuration": number // Estimated seconds this beat should occupy
  }
]

INSTRUCTIONS:

1. READ THE NARRATIVE IN FULL.

2. IDENTIFY ALL NARRATIVE BEATS:
   - Start at the beginning
   - Mark each distinct visual moment based on granularity level
   - A beat should represent ONE clear shot/angle
   - Beats can be as short as 1 sentence or as long as a paragraph (depending on granularity)

3. FOR EACH BEAT:
   
   a) ENTITY ASSIGNMENT:
      - WHO is in frame? (reference character IDs from Visual Bible)
      - WHO is present but off-frame? (e.g., Moderna at the table but not in shot)
      - WHAT is the setting? (reference setting ID from Visual Bible)
      - WHAT props are involved? (reference prop IDs from Visual Bible)
      - WHAT is each character FEELING/DOING in this moment?
   
   b) KEYFRAME STRATEGY:
      - Does this beat need movement? → interpolation_pair
      - Is this a static moment? → single_static
      - Is this part of a long action? → action_sequence
   
   c) VISUAL SPECIFICATION:
      - Describe EXACTLY what the camera sees at start (and end if interpolation)
      - Be specific about spatial relationships: "Steven on left, Pfizer on right, 6 feet apart"
      - Describe action: "Steven's hand moves from table to gesture upward"
      - Choose camera angle from Visual Bible cinematography rules
   
   d) AUDIO SPECIFICATION:
      - Extract any dialogue from this narrative segment
      - Describe relevant sound effects
      - Describe ambient sound appropriate to setting

4. ENSURE CONTINUITY:
   - Beat N's ending should logically flow into Beat N+1's beginning
   - If character exits frame in Beat 5, they shouldn't suddenly be in frame in Beat 6 unless re-entering
   - Setting changes should be explicit
   - Costume/appearance should remain consistent unless narrative indicates change

5. CINEMATOGRAPHY CONSISTENCY:
   - Apply Visual Bible's cinematography rules to each beat
   - Tension scenes → use handheld, closer angles
   - Contemplative scenes → static or slow dolly
   - Dialogue scenes → appropriate shot/reverse shot angles

QUALITY CHECKS:
- Does your breakdown cover the ENTIRE narrative with no gaps? If no, ADD BEATS.
- Can each beat be turned into a clear visual image? If no, ADD SPECIFICITY.
- Are entity references explicit and correct? If no, FIX THEM.
- Does the cinematography match Visual Bible rules? If no, CORRECT IT.
- Will these beats flow smoothly when turned into videos? If no, ADJUST TRANSITIONS.

THINK STEP BY STEP. BE EXHAUSTIVE. EVERY SENTENCE OF THE NARRATIVE MUST BE REPRESENTED.

Respond with valid JSON ONLY.

NOW: Generate the beat breakdown for the following narrative.

NARRATIVE:
${narrative}`;

  console.log("[Gemini] Calling beat decomposition");
  console.log("[Gemini] Narrative length:", narrative.length, "chars");

  const requestBody: any = {
    contents: [{ parts: [{ text: BEAT_DECOMPOSITION_PROMPT }] }],
  };

  try {
    const response = await fetch(`${BASE_URL}/${MODEL_TEXT}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error(
        "[Gemini] API Error Response:",
        JSON.stringify(err, null, 2)
      );
      logger.error("Beat decomposition API error", err);
      throw new Error(err.error?.message || JSON.stringify(err));
    }

    const data = await response.json();
    console.log("[Gemini] Response candidates:", data.candidates?.length);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("[Gemini] No text in response");
      logger.error("Beat decomposition returned no text", data);
      throw new Error("No response from Gemini - check console for details");
    }

    console.log("[Gemini] Response length:", text.length, "chars");

    // Try to extract JSON from markdown code blocks if present
    let jsonText = text;
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
      console.log("[Gemini] Extracted JSON from code block");
    }

    const parsed: NarrativeBeat[] = JSON.parse(jsonText);

    const duration = Date.now() - startTime;
    logger.success("Beat decomposition complete", {
      duration: `${duration}ms`,
      beatCount: parsed.length,
      avgBeatDuration:
        parsed.reduce((sum, b) => sum + (b.estimatedDuration || 0), 0) /
        parsed.length,
    });

    return parsed;
  } catch (error: any) {
    logger.error("Beat decomposition failed", error);
    console.error("[Gemini] Exception during API call:", error);
    console.error("[Gemini] Error message:", error.message);
    throw error;
  }
};
