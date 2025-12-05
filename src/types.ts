export interface CharacterTurnaround {
  characterId: string;
  views: {
    front: { base64: string; thoughtSignature?: string };
    sideLeft: { base64: string; thoughtSignature?: string };
    sideRight: { base64: string; thoughtSignature?: string };
    back: { base64: string; thoughtSignature?: string };
  };
  metadata: {
    resolution: "4K" | "2K";
    createdAt: number;
  };
  status: "idle" | "generating" | "complete" | "error";
}

export interface ChatMessage {
  id: string;
  timestamp: number;
  sender: "user" | "gemini";
  content: string;
  images?: string[]; // Base64 strings
  functionCall?: { name: string; args: Record<string, any> };
  functionResponse?: { name: string; response: any };
}

export interface VisualBible {
  id: string;
  name: string;
  creationTimestamp: number;
  lastUpdatedTimestamp: number;

  narrativeThemes: string[];
  keyMotifs: Array<{ description: string; visualExamples: string[] }>;

  // ENHANCED CHARACTER STRUCTURE
  characters: Record<
    string,
    {
      name: string;
      description: string; // Comprehensive 2-3 sentence overview
      roleInNarrative: "protagonist" | "antagonist" | "supporting" | "tertiary";

      // ULTRA-SPECIFIC PHYSICAL DESCRIPTION
      coreVisualIdentity: {
        facialStructure: string; // "angular jawline, high cheekbones, asymmetrical scar on left temple"
        eyes: string; // "steel blue with amber flecks, almond-shaped, intense gaze"
        hair: string; // "ash blonde, shoulder-length, slight natural wave, tends to fall over right eye"
        build: string; // "5'10\", lean athletic build, confident posture, deliberate movements"
        signatureElements: string[]; // ["worn leather jacket with brass zipper", "silver ring on right index finger"]
        bodyLanguage: string; // "confident stride, tends to cross arms when defensive"
      };

      appearance: {
        attire: string; // DEFAULT outfit description
        distinguishingMarks: string;
        ageApparent: string; // How old they appear
        visualReferences?: string[]; // Pre-uploaded reference images
      };

      emotionalArc: string;
      keyEmotionalBeats: Array<{
        emotion: string;
        facialExpression: string;
        posture: string;
      }>;

      // Expression Library (generated or uploaded)
      expressionLibrary?: {
        neutral?: { base64: string; thoughtSignature?: string };
        angry?: { base64: string; thoughtSignature?: string };
        joyful?: { base64: string; thoughtSignature?: string };
        fearful?: { base64: string; thoughtSignature?: string };
        skeptical?: { base64: string; thoughtSignature?: string };
        defensive?: { base64: string; thoughtSignature?: string };
      };

      chatHistory?: ChatMessage[];
    }
  >;

  // ENHANCED SETTING STRUCTURE
  settings: Record<
    string,
    {
      name: string;
      locationType: "interior" | "exterior" | "mixed";
      masterDescription: string; // Comprehensive 3-4 sentence description
      locationDescription: string; // Geographic/contextual location
      timePeriod: string;
      atmosphere: string; // The FEELING of this place

      lightingConditions: {
        primarySource: "natural sunlight" | "artificial" | "mixed";
        timeOfDay:
          | "dawn"
          | "morning"
          | "midday"
          | "afternoon"
          | "dusk"
          | "night";
        weatherCondition: string; // "clear" | "overcast" | "rainy" | "foggy"
        artificialLighting: string; // Description of lamps, fixtures, ambient glow
        mood: "warm" | "cool" | "neutral" | "dramatic" | "soft";
      };

      keyVisualElements: string[]; // Specific memorable details
      propLibrary: Record<string, string>;
      soundscape: string; // Ambient sounds for video audio generation

      establishingShotImage?: { base64: string; thoughtSignature?: string };
      detailImages?: Array<{ base64: string; thoughtSignature?: string }>;
      visualReferences?: string[]; // Pre-uploaded references

      chatHistory?: ChatMessage[];
    }
  >;

  // PROPS LIBRARY
  props: Record<string, PropLibraryItem>;

  // ENHANCED CINEMATOGRAPHY BIBLE
  cinematography: {
    overallStyle: string; // "gritty realism", "dreamlike surrealism", "classical Hollywood"

    lensChoices: {
      establishing: string; // "35mm wide-angle"
      dialogue: string; // "50mm prime, shallow depth of field"
      action: string; // "24mm with stabilization"
      intimate: string; // "85mm portrait lens"
    };

    filmGrain: "none" | "subtle 35mm" | "pronounced 16mm" | "digital clean";
    lightingStyle: string; // "naturalistic" | "high-contrast noir" | "soft romantic"

    cameraMovement: {
      tensionScenes: string; // "handheld, shaky, unstable"
      contemplativeScenes: string; // "slow dolly, smooth, deliberate"
      actionScenes: string; // "dynamic tracking, whip pans, kinetic"
      dialogueScenes: string; // "static, slow push-in, subtle reframing"
    };

    cameraAngles: {
      powerDynamics: string; // "use of low/high angles to show dominance/submission"
      defaultNeutral: string; // "eye-level, straight-on"
      emotionalIsolation: string; // "dutch angle, off-center framing"
    };

    colorGrading: {
      lutDescription: string; // "warm amber highlights with teal shadows, slightly desaturated"
      moodDescription: string; // "hopeful yet melancholic"
      specificColorRules: string[]; // ["warm tones dominate happy memories"]
    };
  };

  colorPalette: {
    mood: string;
    hexCodes: string[]; // 5-8 dominant colors
    description: string;
  };

  // Character Reference Sheets
  characterTurnarounds: Record<string, CharacterTurnaround>;

  granularityLevel: "Detailed Paragraph" | "Sentence by Sentence" | "Key Beats";
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
    thoughtSignature?: string;
    attempts: number;
    status:
      | "idle"
      | "pending"
      | "generating"
      | "done"
      | "error"
      | "retrying"
      | "user_intervention_needed";
  };

  videoData?: {
    uri: string; // Or ID referencing IndexedDB asset
    status: "idle" | "pending" | "generating" | "done" | "error" | "retrying";
    attempts: number;
  };

  validationLog: Array<{
    timestamp: number;
    type: "IMMEDIATE" | "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM";
    referenceSceneIndex: number;
    score: number;
    critique: string;
    passed: boolean;
    fixInstructions?: string;
    attempt: number;
  }>;

  overallStatus:
    | "pending"
    | "planning_failed"
    | "image_generating"
    | "image_failed"
    | "image_validated"
    | "image_failed_retries"
    | "video_generating"
    | "video_failed"
    | "complete";
}

export interface PropLibraryItem {
  id: string;
  name: string;
  description: string;
  significance: string;
  firstAppearance: string;
  associatedCharacters: string[];
  visualReferences?: string[];
}

export interface NarrativeBeat {
  id: string;
  index: number;
  beatType:
    | "plot_advance"
    | "emotional_shift"
    | "location_change"
    | "character_introduction"
    | "climactic_moment";

  narrativeSegment: string; // Exact quote from source narrative

  // Entity References (EXPLICIT LINKING)
  characters: {
    inFrame: string[]; // Character IDs visible in this beat
    offFrame: string[]; // Present but not visible (for context)
    emotionalStates: Record<string, string>; // e.g., "steven": "skeptical"
  };

  setting: {
    settingId: string;
    specificLocation: string; // e.g., "conference room table, north-facing windows visible"
  };

  props: {
    foreground: string[]; // Prop IDs in focus
    background: string[]; // Contextual props
  };

  // Keyframe Requirements
  keyframeStrategy: "single_static" | "interpolation_pair" | "action_sequence";

  keyframes: {
    startFrame: {
      promptSpecifics: string; // Detailed visual description
      cameraAngle: string; // "eye-level, slightly right of Steven"
      composition: string; // "two-shot, shallow focus on Steven"
      action: string; // "Steven gestures at document, Pfizer leans back"
    };
    endFrame?: {
      // Only for interpolation_pair
      promptSpecifics: string;
      cameraAngle: string;
      composition: string;
      action: string;
    };
  };

  audioDirection: {
    dialogue: string[]; // ["STEVEN: 'This data doesn't add up.'"]
    soundEffects: string[]; // ["paper rustling", "chair creaking"]
    ambience: string; // "quiet conference room, distant HVAC hum"
  };

  cinematography: {
    lens: string;
    movement: string;
    lighting: string;
  };

  estimatedDuration: number; // Estimated seconds this beat should occupy

  // Generated keyframe images
  generatedKeyframes?: {
    startFrame?: {
      base64: string;
      thoughtSignature?: string;
      attempts: number;
      status: "idle" | "pending" | "generating" | "done" | "error" | "retrying";
    };
    endFrame?: {
      base64: string;
      thoughtSignature?: string;
      attempts: number;
      status: "idle" | "pending" | "generating" | "done" | "error" | "retrying";
    };
  };

  // Video generation
  videoData?: {
    uri: string;
    status: "idle" | "pending" | "generating" | "done" | "error" | "retrying";
    attempts: number;
  };

  validationLog: Array<{
    timestamp: number;
    type: "CHARACTER" | "SPATIAL" | "TEMPORAL" | "EMOTIONAL";
    score: number;
    critique: string;
    passed: boolean;
    fixInstructions?: string;
  }>;

  overallStatus:
    | "pending"
    | "keyframe_generating"
    | "keyframe_failed"
    | "keyframe_validated"
    | "video_generating"
    | "video_failed"
    | "complete";
}

export interface Conversation {
  id: string;
  name: string;
  messages: ChatMessage[];
  relatedVisualBibleId?: string;
}
