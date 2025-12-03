import { type VisualBible } from "../types";

/**
 * Function definitions for Visual Bible construction via Gemini function calling
 * These are the tools Gemini can use to systematically build the Visual Bible
 */

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// All available functions that Gemini can call
export const VISUAL_BIBLE_FUNCTIONS: FunctionDeclaration[] = [
  {
    name: "addCharacter",
    description:
      "Add or update a character in the Visual Bible with detailed appearance and personality information",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description:
            'Unique ID for this character (e.g., "protagonist", "villain")',
        },
        name: { type: "string", description: "Character's name" },
        description: {
          type: "string",
          description: "General character description",
        },
        keyFeatures: {
          type: "array",
          items: { type: "string" },
          description: "Array of distinctive features for visual consistency",
        },
        emotionalArc: {
          type: "string",
          description: "Character's emotional journey",
        },
        hair: { type: "string", description: "Detailed hair description" },
        eyes: { type: "string", description: "Eye color and expression" },
        build: { type: "string", description: "Body type and build" },
        attire: { type: "string", description: "Typical clothing and style" },
        distinguishingMarks: {
          type: "string",
          description: "Scars, tattoos, unique marks",
        },
      },
      required: [
        "id",
        "name",
        "description",
        "keyFeatures",
        "hair",
        "eyes",
        "build",
        "attire",
      ],
    },
  },
  {
    name: "defineSetting",
    description:
      "Define a location or environment that appears in the narrative",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Unique ID for this setting" },
        name: { type: "string", description: "Setting name" },
        locationDescription: {
          type: "string",
          description: "Detailed description of the location",
        },
        timePeriod: {
          type: "string",
          description: "Historical or temporal context",
        },
        atmosphere: {
          type: "string",
          description: "Mood and atmosphere of the setting",
        },
        keyVisualElements: {
          type: "array",
          items: { type: "string" },
          description: "Important visual elements to include",
        },
        props: {
          type: "array",
          description: "List of important props/objects in this setting",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Name of the prop" },
              description: {
                type: "string",
                description: "Visual description of the prop",
              },
            },
            required: ["name", "description"],
          },
        },
      },
      required: [
        "id",
        "name",
        "locationDescription",
        "atmosphere",
        "keyVisualElements",
      ],
    },
  },
  {
    name: "setCinematography",
    description:
      "Set the overall cinematographic style for all generated images",
    parameters: {
      type: "object",
      properties: {
        lensType: {
          type: "string",
          description: 'Camera lens type (e.g., "35mm prime", "anamorphic")',
        },
        filmGrain: {
          type: "string",
          description:
            'Film grain style (e.g., "subtle 35mm emulation", "digital pristine")',
        },
        lightingStyle: {
          type: "string",
          description:
            'Lighting approach (e.g., "neo-noir high contrast", "soft natural light")',
        },
        cameraMovement: {
          type: "string",
          description:
            'Camera movement style (e.g., "handheld", "smooth dolly")',
        },
        cameraAngles: {
          type: "string",
          description:
            'Preferred camera angles (e.g., "low angles", "dutch tilts")',
        },
      },
      required: ["lensType", "lightingStyle"],
    },
  },
  {
    name: "defineColorPalette",
    description:
      "Define the color palette and visual mood for the entire project",
    parameters: {
      type: "object",
      properties: {
        mood: {
          type: "string",
          description:
            'Overall mood (e.g., "melancholic", "vibrant", "dystopian")',
        },
        hexCodes: {
          type: "array",
          items: { type: "string" },
          description: "Array of hex color codes",
        },
        description: {
          type: "string",
          description: "Description of how colors should be used",
        },
      },
      required: ["mood", "hexCodes", "description"],
    },
  },
  {
    name: "setNarrativeThemes",
    description: "Set the overarching themes of the narrative",
    parameters: {
      type: "object",
      properties: {
        themes: {
          type: "array",
          items: { type: "string" },
          description: "Array of thematic elements",
        },
      },
      required: ["themes"],
    },
  },
  {
    name: "addKeyMotif",
    description: "Add a recurring visual symbol or motif",
    parameters: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "What this motif represents",
        },
        visualExamples: {
          type: "array",
          items: { type: "string" },
          description: "Visual manifestations of this motif",
        },
      },
      required: ["description", "visualExamples"],
    },
  },
  {
    name: "setGranularity",
    description: "Set how frequently to generate images from the narrative",
    parameters: {
      type: "object",
      properties: {
        level: {
          type: "string",
          enum: ["Detailed Paragraph", "Sentence by Sentence", "Key Beats"],
          description: "Granularity level",
        },
      },
      required: ["level"],
    },
  },
  {
    name: "setValidationStrides",
    description: "Configure the multi-tier validation intervals",
    parameters: {
      type: "object",
      properties: {
        short: {
          type: "number",
          description: "Short-term validation stride (e.g., 4)",
        },
        medium: {
          type: "number",
          description: "Medium-term validation stride (e.g., 12)",
        },
        long: {
          type: "number",
          description: "Long-term validation stride (e.g., 24)",
        },
      },
      required: ["short", "medium", "long"],
    },
  },
  {
    name: "setProjectMetadata",
    description: "Set the project name and basic settings",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Project name" },
        aspectRatio: {
          type: "string",
          description: 'Target aspect ratio (e.g., "16:9", "2.35:1")',
        },
        maxRetries: {
          type: "number",
          description: "Max regeneration attempts before user intervention",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "regenerateScene",
    description:
      "Regenerate the image for a specific scene based on feedback or new instructions",
    parameters: {
      type: "object",
      properties: {
        sceneId: {
          type: "string",
          description: "The ID of the scene to regenerate",
        },
        newPrompt: {
          type: "string",
          description: "The updated, detailed image generation prompt",
        },
        reasoning: {
          type: "string",
          description: "Explanation of what was changed and why",
        },
      },
      required: ["sceneId", "newPrompt"],
    },
  },
];

/**
 * Execute a function call and return the updated Visual Bible
 */
export const executeFunctionCall = (
  currentBible: VisualBible,
  functionName: string,
  args: Record<string, any>
): VisualBible => {
  const updated = { ...currentBible };

  switch (functionName) {
    case "addCharacter":
      updated.characters = {
        ...updated.characters,
        [args.id]: {
          name: args.name,
          description: args.description,
          keyFeatures: args.keyFeatures || [],
          emotionalArc: args.emotionalArc || "",
          appearance: {
            hair: args.hair || "",
            eyes: args.eyes || "",
            build: args.build || "",
            attire: args.attire || "",
            distinguishingMarks: args.distinguishingMarks || "",
            visualReferences: args.visualReferences,
          },
        },
      };
      break;

    case "defineSetting":
      updated.settings = {
        ...updated.settings,
        [args.id]: {
          name: args.name,
          locationDescription: args.locationDescription || "",
          timePeriod: args.timePeriod || "",
          atmosphere: args.atmosphere || "",
          keyVisualElements: args.keyVisualElements || [],
          propLibrary: (args.props || []).reduce(
            (
              acc: Record<string, string>,
              prop: { name: string; description: string }
            ) => {
              acc[prop.name] = prop.description;
              return acc;
            },
            {}
          ),
          visualReferences: args.visualReferences,
        },
      };
      break;

    case "setCinematography":
      updated.cinematography = {
        lensType: args.lensType || updated.cinematography.lensType,
        filmGrain: args.filmGrain || updated.cinematography.filmGrain,
        lightingStyle:
          args.lightingStyle || updated.cinematography.lightingStyle,
        cameraMovement:
          args.cameraMovement || updated.cinematography.cameraMovement,
        cameraAngles: args.cameraAngles || updated.cinematography.cameraAngles,
      };
      break;

    case "defineColorPalette":
      updated.colorPalette = {
        mood: args.mood,
        hexCodes: args.hexCodes || [],
        description: args.description || "",
      };
      break;

    case "setNarrativeThemes":
      updated.narrativeThemes = args.themes || [];
      break;

    case "addKeyMotif":
      updated.keyMotifs = [
        ...updated.keyMotifs,
        {
          description: args.description,
          visualExamples: args.visualExamples || [],
        },
      ];
      break;

    case "setGranularity":
      updated.granularityLevel = args.level;
      break;

    case "setValidationStrides":
      updated.validationStrides = {
        short: args.short || updated.validationStrides.short,
        medium: args.medium || updated.validationStrides.medium,
        long: args.long || updated.validationStrides.long,
      };
      break;

    case "setProjectMetadata":
      if (args.name) updated.name = args.name;
      if (args.aspectRatio) updated.targetOutputAspectRatio = args.aspectRatio;
      if (args.maxRetries) updated.maxImageRetries = args.maxRetries;
      updated.lastUpdatedTimestamp = Date.now();
      break;

    default:
      console.warn(`Unknown function: ${functionName}`);
  }

  updated.lastUpdatedTimestamp = Date.now();
  return updated;
};

/**
 * Format function response for Gemini
 */
export const formatFunctionResponse = (functionName: string, result: any) => ({
  name: functionName,
  response: {
    success: true,
    message: `Successfully executed ${functionName}`,
    result,
  },
});
