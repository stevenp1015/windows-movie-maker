# ARCHITECTURAL REDESIGN: Keyframe-Based Narrative Pipeline

Based on comprehensive analysis of Veo 3.1 and Nano Banana Pro capabilities, this proposes a fundamentally different architecture that will yield dramatically better continuity and efficiency.

## The Fundamental Shift

**CURRENT (BROKEN) APPROACH:**  
`Narrative → Scenes → 1 Image Per Scene → 1 Video Per Image → Final Output`

**NEW (OPTIMAL) APPROACH:**  
`Narrative → Narrative Beats → Keyframe Images → Interpolated Videos → Extended Sequences → Final Output`

---

## Why This Changes Everything

### Critical Veo 3.1 Capabilities

1. **First + Last Frame Interpolation**

   - Takes 2 images (start & end frames)
   - Generates 8-second video interpolating between them
   - **MUST** be 8 seconds when using this feature
   - Character continuity maintained via reference images

2. **Up to 3 Reference Images**

   - Pass character turnarounds/props/settings as references
   - Model preserves subject appearance across video
   - Reference type: `"asset"` for objects/characters

3. **Video Extension**

   - Extend Veo-generated videos by 7 seconds
   - Can extend up to 20 times (141 seconds total)
   - Uses last 1 second as continuity anchor

4. **Single Image Animation**
   - Animate a single keyframe into 8-second video
   - Good for establishing shots or static moments

### Critical Nano Banana Pro Capabilities

1. **Up to 14 Reference Images**

   - 5 human/character references max
   - 6 object/prop references max
   - Maintains consistency across complex compositions

2. **Thinking Mode**

   - Model reasons through complex compositions
   - Generates interim "thought images" (not charged)
   - Refines before final output

3. **4K Resolution Support**

   - 1K, 2K, 4K image generation
   - Use 2K/4K for keyframes, 1K for validation

4. **Google Search Grounding**
   - Can verify facts and real-world details
   - Useful for period-accurate or location-specific content

---

## Proposed Architecture

### Phase 1: Enhanced Visual Bible Generation

**Instead of basic character/setting lists, we need:**

#### Character Profiles (Enhanced)

```typescript
{
  id: string;
  name: string;
  description: string;
  coreVisualIdentity: {
    // Ultra-specific physical traits
    facialStructure: string;  // "angular jawline, high cheekbones, asymmetrical scar on left temple"
    bodyLanguage: string;     // "confident stride, tends to cross arms when defensive"
    signature Elements: string[]; // ["worn leather jacket", "silver ring on right index finger"]
  };
  appearance: { /* existing fields */ };
  emotionalBeats: {
    // Character emotion at different narrative points
    [beatId: string]: {
      mood: string;
      facialExpression: string;
      posture: string;
    };
  };
  turnaroundImages: {
    front: { base64: string; thoughtSignature?: string };
    sideLeft: { base64: string; thoughtSignature?: string };
    sideRight: { base64: string; thoughtSignature?: string };
    back: { base64: string; thoughtSignature?: string };
  };
  // NEW: Emotional expression variants (for different beats)
  expressionLibrary: {
    neutral: { base64: string; thoughtSignature?: string };
    angry: { base64: string; thoughtSignature?: string };
    joyful: { base64: string; thoughtSignature?: string };
    fearful: { base64: string; thoughtSignature?: string };
    // ... other key emotions
  };
}
```

#### Setting Profiles (Enhanced)

```typescript
{
  id: string;
  name: string;
  masterDescription: string; // Comprehensive visual guide
  establishingShotImage: { base64: string; thoughtSignature?: string }; // Wide shot
  detailImages: { base64: string; thoughtSignature?: string }[]; // Close-ups of key elements
  lightingConditions: {
    timeOfDay: string;
    weatherCondition: string;
    artificialLighting: string;
  };
  soundscape: string; // For audio generation in videos
}
```

#### Cinematography Bible

```typescript
{
  lensChoices: {
    establishing: "35mm wide-angle";
    dialogue: "50mm prime, shallow depth of field";
    action: "24mm with stabilization";
  };
  colorGrading: {
    lutDescription: string; // "Warm amber and teal, desaturated shadows"
    moodDescription: string;
    hexPalette: string[];
  };
  cameraMovementRules: {
    tensionScenes: "handheld, slight shake";
    contemplativeScenes: "slow dolly, smooth";
    actionScenes: "dynamic tracking, whip pans";
  };
}
```

### Phase 2: Narrative Beat Decomposition

**NOT "scenes" - NARRATIVE BEATS.**

A beat is:

- A significant plot point
- An emotional shift
- A change in location/time
- A visual transition point

#### Beat Structure

```typescript
{
  id: string;
  index: number;
  beatType: "plot_advance" | "emotional_shift" | "location_change" | "character_introduction" | "climactic_moment";

  narrativeSegment: string; // Exact quote from source narrative

  // Entity References (EXPLICIT LINKING)
  characters: {
    inFrame: string[]; // Character IDs visible in this beat
    offFrame: string[]; // Present but not visible (for context)
    emotional States: { [charId: string]: string }; // "Steven: skeptical", "Pfizer: defensive"
  };

  setting: {
    settingId: string;
    specificLocation: string; // "conference room table, north-facing windows visible"
  };

  props: {
    foreground: string[]; // Prop IDs in focus
    background: string[]; // Contextual props
  };

  // NEW: Keyframe Requirements
  keyframeStrategy: "single_static" | "interpolation_pair" | "action_sequence";

  keyframes: {
    // If single_static: only startFrame
    // If interpolation_pair: startFrame and endFrame
    // If action_sequence: multiple keyframes for extension chain

    startFrame: {
      promptSpecifics: string; // Detailed visual description
      cameraAngle: string;      // "eye-level, slightly right of Steven"
      composition: string;       // "two-shot, shallow focus on Steven"
      action: string;           // "Steven gestures at document, Pfizer leans back"
    };

    endFrame?: {
      // Same structure, describes end state after 8 seconds
      promptSpecifics: string;
      cameraAngle: string;
      composition: string;
      action: string;
    };
  };

  audioDirection: {
    dialogue: string[]; // ["STEVEN: 'This data doesn't add up.'", "PFIZER: 'Are you questioning my analysis?'"]
    soundEffects: string[]; // ["paper rustling", "chair creaking"]
    ambience: string; // "quiet conference room, distant HVAC hum"
  };

  // Cinematography for this specific beat
  cinematography: {
    lens: string;
    movement: string;
    lighting: string;
  };
}
```

### Phase 3: Keyframe Image Generation

**Use Nano Banana Pro with FULL CONTEXT.**

For each beat's keyframe(s):

```typescript
async function generateBeatKeyframe(
  beat: NarrativeBeat,
  visualBible: VisualBible,
  frameType: "start" | "end"
): Promise<{ base64: string; thoughtSignature: string }> {
  // Assemble ALL relevant reference images
  const referenceImages: string[] = [];

  // 1. Character turnarounds (up to 5 characters)
  for (const charId of beat.characters.inFrame.slice(0, 5)) {
    const char = visualBible.characters[charId];
    const emotionalState = beat.characters.emotionalStates[charId];

    // Use appropriate emotional expression variant if available
    if (char.expressionLibrary[emotionalState]) {
      referenceImages.push(char.expressionLibrary[emotionalState].base64);
    } else {
      // Fallback to turnaround views
      referenceImages.push(char.turnaroundImages.front.base64);
      referenceImages.push(char.turnaroundImages.sideLeft.base64);
    }
  }

  // 2. Setting establishing shot
  const setting = visualBible.settings[beat.setting.settingId];
  referenceImages.push(setting.establishingShotImage.base64);

  // 3. Props (up to 6 total between characters and props)
  for (const propId of beat.props.foreground.slice(0, 3)) {
    const prop = visualBible.props[propId];
    if (prop.visualReferences?.[0]) {
      referenceImages.push(prop.visualReferences[0]);
    }
  }

  // 4. Previous beat's end frame (for continuity)
  if (beat.index > 0) {
    const previousBeat = beats[beat.index - 1];
    if (previousBeat.generatedKeyframes?.endFrame?.base64) {
      referenceImages.push(previousBeat.generatedKeyframes.endFrame.base64);
    }
  }

  // CONSTRUCT THE GOD-TIER PROMPT
  const keyframeDesc =
    beat.keyframes[frameType === "start" ? "startFrame" : "endFrame"];

  const prompt = `
TASK: Generate a cinematic ${
    frameType === "start" ? "starting" : "ending"
  } keyframe for narrative beat ${beat.index + 1}.

NARRATIVE CONTEXT:
"${beat.narrativeSegment}"

CHARACTERS IN FRAME:
${beat.characters.inFrame
  .map((charId) => {
    const char = visualBible.characters[charId];
    const mood = beat.characters.emotionalStates[charId];
    return `
**${char.name}** (${mood}):
- Physical: ${char.coreVisualIdentity.facialStructure}
- Body Language: ${char.coreVisualIdentity.bodyLanguage}
- Signature Elements: ${char.coreVisualIdentity.signatureElements.join(", ")}
- Current Expression: ${keyframeDesc.action
      .split(",")
      .find((a) => a.includes(char.name))}
- Attire: ${char.appearance.attire}
`;
  })
  .join("\n")}

${
  beat.characters.offFrame.length > 0
    ? `
CHARACTERS OFF-FRAME (present in scene, not visible):
${beat.characters.offFrame
  .map((charId) => visualBible.characters[charId].name)
  .join(", ")}
(Use this for contextual understanding but do NOT show them in frame)
`
    : ""
}

SETTING:
**${setting.name}** - ${beat.setting.specificLocation}
- Master Description: ${setting.masterDescription}
- Lighting: ${setting.lightingConditions.timeOfDay}, ${
    setting.lightingConditions.weatherCondition
  }
- Atmosphere: ${setting.atmosphere}
- Key Visual Elements: ${setting.keyVisualElements.join(", ")}

PROPS IN FOCUS:
${beat.props.foreground
  .map((propId) => {
    const prop = visualBible.props[propId];
    return `- ${prop.name}: ${prop.description}`;
  })
  .join("\n")}

CINEMATOGRAPHY:
- Lens: ${beat.cinematography.lens}
- Camera Angle: ${keyframeDesc.cameraAngle}
- Composition: ${keyframeDesc.composition}
- Movement: ${beat.cinematography.movement}
- Lighting Style: ${beat.cinematography.lighting}

COLOR PALETTE:
- Mood: ${visualBible.colorPalette.mood}
- LUT: ${visualBible.cinematography.colorGrading.lutDescription}
- Key Colors: ${visualBible.colorPalette.hexCodes.join(", ")}

SPECIFIC VISUAL INSTRUCTIONS:
${keyframeDesc.promptSpecifics}

ACTION IN THIS FRAME:
${keyframeDesc.action}

CONTINUITY NOTES:
${
  beat.index > 0
    ? `- Maintain visual consistency with previous beat's ending frame (provided as reference)`
    : ""
}
- Ensure character appearance exactly matches reference images provided
- Preserve setting details from establishing shot reference

REQUIREMENTS:
- Photorealistic, cinematic quality
- ${beat.cinematography.lens} lens characteristics
- Film grain: ${visualBible.cinematography.filmGrain}
- Depth of field based on composition requirements
- EXACT character identity preservation from references
- Spatial relationship: ${keyframeDesc.composition}

OUTPUT:
Generate a single, high-fidelity 2K keyframe image.
`;

  return await client.models.generate_content({
    model: "gemini-3-pro-image-preview",
    contents: [
      prompt,
      ...referenceImages.map((img) => ({
        inline_data: { mime_type: "image/png", data: img },
      })),
    ],
    config: {
      response_modalities: ["IMAGE"],
      image_config: {
        aspect_ratio: visualBible.targetOutputAspectRatio,
        image_size: "2K",
      },
      tools: beat.requiresFactChecking ? [{ google_search: {} }] : [],
    },
  });
}
```

### Phase 4: Video Generation Strategy

**Three approaches based on beat type:**

#### Approach A: Keyframe Interpolation (Most Beats)

```typescript
// Generate video between start and end keyframes
await client.models.generate_videos({
  model: "veo-3.1-generate-preview",
  prompt: constructVideoPrompt(beat), // Detailed action description
  image: beat.generatedKeyframes.startFrame.base64,
  config: {
    last_frame: beat.generatedKeyframes.endFrame.base64,
    reference_images: [
      // Character references for consistency
      ...getCharacterReferences(beat.characters.inFrame),
    ],
    duration_seconds: "8", // MUST be 8 for interpolation
    aspect_ratio: visualBible.targetOutputAspectRatio,
    resolution: "1080p",
  },
});
```

#### Approach B: Single Keyframe Animation (Static Beats)

```typescript
// Animate a single frame (e.g., establishing shot, reaction shot)
await client.models.generate_videos({
  model: "veo-3.1-generate-preview",
  prompt: `${beat.audioDirection.ambience}. Subtle camera movement: ${beat.cinematography.movement}.`,
  image: beat.generatedKeyframes.startFrame.base64,
  config: {
    reference_images: getCharacterReferences(beat.characters.inFrame),
    duration_seconds: "6",
    aspect_ratio: visualBible.targetOutputAspectRatio,
  },
});
```

#### Approach C: Extended Sequence (Long Action Beats)

```typescript
// For beats requiring > 8 seconds
// 1. Generate initial 8-second segment
const initialVideo = await generateVeoVideo(/* ... */);

// 2. Extend iteratively
let currentVideo = initialVideo;
for (let i = 0; i < beat.requiredExtensions; i++) {
  currentVideo = await client.models.generate_videos({
    model: "veo-3.1-generate-preview",
    video: currentVideo, // Previous output
    prompt: beat.extensionPrompts[i], // Continuation action
    config: {
      duration_seconds: "7", // Extension adds 7 seconds
      resolution: "720p", // Extensions must be 720p
    },
  });
}
```

### Phase 5: Validation & Continuity Checks

Instead of comparing arbitrary scenes, validate:

1. **Character Consistency Across Beats**

   - Compare character appearance in beat N vs beat N-1
   - Ensure costume/hair/props remain consistent

2. **Spatial Continuity**

   - If in same location, ensure setting details match

3. **Temporal Continuity**

   - End frame of beat N should align with start frame of beat N+1

4. **Emotional Arc Validation**
   - Character expressions progress logically

---

## GOD-TIER Prompts for Foundation

### Prompt 1: Visual Bible Generation

```typescript
const VISUAL_BIBLE_GENERATION_PROMPT = `
You are the Master Cinematographer and Visual Bible Architect for a narrative-to-video AI pipeline.

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
`;
```

### Prompt 2: Narrative Beat Decomposition

```typescript
const BEAT_DECOMPOSITION_PROMPT = `
You are the Master Scene Architect for a narrative-to-video AI pipeline.

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

VISUAL BIBLE CONTEXT:
You have access to the complete Visual Bible containing all characters, settings, props, and cinematography rules.

${JSON.stringify(visualBible, null, 2)}

GRANULARITY LEVEL: ${visualBible.granularityLevel}

${
  {
    "Detailed Paragraph":
      "Break at each significant paragraph or 2-3 sentence cluster. Each beat should be a distinct visual moment, roughly 6-8 seconds of screen time.",
    "Sentence by Sentence":
      "Create a beat for almost every sentence. Maximum granularity - every micro-moment becomes a discrete visual beat.",
    "Key Beats":
      "Only break at major plot beats, emotional shifts, or scene changes. Longer beats (8-15 seconds of screen time), fewer total beats.",
  }[visualBible.granularityLevel]
}

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
      "lens": "50mm prime" // Choose from Visual Bible lens options based on beat type,
      "movement": "static" | "slow push-in" | "dolly left" | "handheld" // Choose from Visual Bible movement rules,
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

NOW: Generate the beat breakdown for the following narrative.

NARRATIVE:
${narrative}
`;
```

---

## Implementation Roadmap

### Phase 1: Type System (Week 1)

- Update all interfaces in `types.ts`
- Add `NarrativeBeat`, enhanced `VisualBible`, etc.

### Phase 2: GOD-TIER Prompts (Week 1)

- Implement `analyzeNarrativeEnhanced` with new Visual Bible prompt
- Implement `decomposeIntoBeatsEnhanced` with new beat decomposition prompt
- Extensive testing with sample narratives

### Phase 3: Keyframe Generation (Week 2)

- Implement `generateBeatKeyframe` with full context assembly
- Character expression library generation
- Setting establishing shot generation

### Phase 4: Video Generation (Week 2-3)

- Implement interpolation-based video generation
- Implement single-frame animation
- Implement extension chain for long beats

### Phase 5: UI/UX (Week 3)

- Beat timeline view (replace scene card view)
- Keyframe preview with start/end frames
- Entity assignment UI for manual override
- Video preview with interpolation visualization

### Phase 6: Validation & Refinement (Week 4)

- Character consistency validation
- Spatial continuity checks
- Regeneration with full context
- End-to-end pipeline testing

---

## Answers to Your Questions

### Q1: Scene vs Shot Granularity

**ANSWER: Narrative Beats (not scenes, not shots).**

A "beat" is more granular than a traditional scene but less granular than a film "shot". It represents **a discrete visual moment with clear boundaries** that will become:

- 1-2 keyframe images
- 1 video segment (6-8 seconds)

**Benefits:**

- Flexible: Can be a single sentence or a paragraph depending on granularity setting
- Visual: Each beat = one clear camera angle/composition
- Manageable: Prevents the "100 shots for a 2-minute scene" explosion

**Handles your Pfizer/Moderna problem:**

```
Beat 23: "Steven and Pfizer discuss the proposal at the conference table"
- inFrame: ["steven", "pfizer"]
- offFrame: ["moderna"] // She's AT the table but not in THIS shot
```

Later:

```
Beat 24: "Camera pulls back to reveal Moderna listening intently"
- inFrame: ["steven", "pfizer", "moderna"] // Now all three visible
```

### Q2: Keyframe vs Every-Beat Approach

**ANSWER: Keyframe-Based. 100%.**

Veo's first+last frame interpolation is TOO GOOD to ignore. Benefits:

1. **Better Continuity**: Model interpolates smoothly between two AI-generated images that you've validated for consistency

2. **Efficiency**: Generate 2 high-quality keyframes → get 8 seconds of video
   vs. Generate 1 image → hope the 8-second animation looks good

3. **Control**: You define exact start and end states; model fills the motion

4. **Flexibility**: Can still do single-frame animation for static beats

**Recommended Distribution:**

- 70% of beats: Interpolation pair (action, movement, transitions)
- 20% of beats: Single frame animation (establishing, reactions, static moments)
- 10% of beats: Extension chains (long action sequences)

### Q3: Entity Detection - AI vs Manual

** ANSWER: AI-DRIVEN with MANUAL OVERRIDE capability.**

**Primary Path (95% of use):**

- Beat decomposition prompt explicitly extracts entity references
- Model assigns character IDs, setting IDs, prop IDs to each beat
- You review in UI, can edit if wrong

**Manual Override (5% - for testing/edge cases):**

```tsx
<BeatCard beat={beat}>
  <EntityAssignment
    currentCharacters={beat.characters.inFrame}
    onAdd={(charId) => addCharacterToBeat(beat.id, charId)}
    onRemove={(charId) => removeCharacterFromBeat(beat.id, charId)}
  />
</BeatCard>
```

**Why both:**

- AI is faster and gets it right 90%+ of the time (with good prompts)
- Manual is essential for testing specific scenarios
- Manual override lets you fix AI errors without regenerating the entire breakdown

### Q4: Off-Frame Entity Handling

**ANSWER: EXPLICIT off-frame tracking for contextual understanding.**

In beat entity references:

```typescript
{
  characters: {
    inFrame: ["steven", "pfizer"],     // These MUST be visible
    offFrame: ["moderna"],              // Present in scene, NOT visible in shot
    emotionalStates: {
      steven: "skeptical",
      pfizer: "defensive",
      moderna: "observing_silently"    // Still tracked even off-frame
    }
  }
}
```

In prompt:

```
CHARACTERS OFF-FRAME (present in scene, not visible):
Moderna (observing silently)
(Use this for contextual understanding but do NOT show them in frame)
```

**Why:**

- Model understands scene context (3 people at table, not 2)
- Prevents confusing spatial relationships
- Maintains narrative continuity (Moderna doesn't vanish and reappear)
- If beat N+5 shows Moderna, model knows she's been there all along

---

## Next Steps

**My Recommendation:**

1. **START WITH PROMPTS (This Week)**

   - Implement GOD-TIER Visual Bible generation prompt
   - Implement GOD-TIER beat decomposition prompt
   - Test with your narrative examples
   - Iterate until output is consistently solid

2. **THEN TYPE SYSTEM (Next Week)**

   - Update `types.ts` with new structures
   - No point updating types until we know prompts work

3. **THEN KEYFRAME GENERATION (Week After)**

   - Once we have validated beats with entity references
   - Implement keyframe generation with full context

4. **FINALLY VIDEO & UI (Last)**
   - Once keyframes are generating with good continuity
   - Hook up Veo interpolation
   - Build beat timeline UI

**Why this order:**

- Prompts are the FOUNDATION (your original insight was 100% correct)
- Bad prompts → garbage entity extraction → broken context assembly → shit images
- Good prompts → solid entity extraction → rich context → beautiful images

**Want me to:**

- A) Create a NEW working branch of the implementation plan with this architecture?
- B) Start implementing the GOD-TIER prompts immediately in `gemini.ts`?
- C) Build sample Visual Bible + Beat breakdown for your test narrative to validate approach?
- D) Something else?

The floor is yours, stud.
