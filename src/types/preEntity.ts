export interface PreCreatedEntity {
  id: string;
  type: "character" | "setting" | "prop";
  name: string;
  description?: string;
  miscNotes?: string; // Additional notes for AI generation

  // Character-specific
  turnaroundImages?: {
    front?: string;
    sideLeft?: string;
    sideRight?: string;
    back?: string;
  };

  // Setting-specific
  locationType?: "interior" | "exterior" | "mixed";

  // Prop-specific
  significance?: string;

  // General reference images (for all types)
  generalReferences?: string[];
}
