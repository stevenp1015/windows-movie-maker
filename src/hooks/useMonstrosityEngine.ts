import { useState, useEffect, useCallback, useRef } from "react";
import {
  type VisualBible,
  type SceneNode,
  type Conversation,
  type ChatMessage,
} from "../types";
import * as db from "../services/db";
import { v4 as uuidv4 } from "uuid";
import {
  analyzeNarrative,
  decomposeIntoScenes,
  generateSceneImage,
  chatWithDirector,
} from "../services/gemini";
import {
  ProductionPipeline,
  type PipelineStatus,
  type PipelineProgress,
} from "../services/productionPipeline";

const DEFAULT_BIBLE: VisualBible = {
  id: "default",
  name: "New Project",
  creationTimestamp: Date.now(),
  lastUpdatedTimestamp: Date.now(),
  narrativeThemes: [],
  keyMotifs: [],
  characters: {},
  settings: {},
  cinematography: {
    lensType: "Standard",
    filmGrain: "None",
    lightingStyle: "Natural",
    cameraMovement: "Static",
    cameraAngles: "Eye Level",
  },
  colorPalette: {
    mood: "Neutral",
    hexCodes: [],
    description: "",
  },
  characterTurnarounds: {},
  granularityLevel: "Detailed Paragraph",
  validationStrides: { short: 4, medium: 12, long: 24 },
  maxImageRetries: 3,
  videoGenerationDelaySeconds: 5,
  targetOutputAspectRatio: "16:9",
};

export type AppPhase = "planning" | "decomposition" | "production" | "review";

export const useMonstrosityEngine = () => {
  const [visualBible, setVisualBible] = useState<VisualBible>(DEFAULT_BIBLE);
  const [scenes, setScenes] = useState<SceneNode[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  // New pipeline state
  const [currentPhase, setCurrentPhase] = useState<AppPhase>("planning");
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("idle");
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress>({
    currentSceneIndex: 0,
    totalScenes: 0,
    phase: "image_generation",
  });
  const [systemLogs, setSystemLogs] = useState<
    Array<{ message: string; type: string; timestamp: number }>
  >([]);

  const pipelineRef = useRef<ProductionPipeline | null>(null);

  // Load initial state
  useEffect(() => {
    const loadState = async () => {
      try {
        const projects = await db.getAllProjects();
        if (projects && projects.length > 0) {
          const latest = projects.sort(
            (a: any, b: any) => b.lastUpdated - a.lastUpdated
          )[0];
          setVisualBible(latest.visualBible);
          setScenes(latest.scenes);
          setConversations(latest.conversations || []);

          if (latest.conversations && latest.conversations.length > 0) {
            setActiveConversationId(latest.conversations[0].id);
          } else {
            const defaultConv: Conversation = {
              id: uuidv4(),
              name: "Director Chat",
              messages: [],
              relatedVisualBibleId: latest.visualBible.id,
            };
            setConversations([defaultConv]);
            setActiveConversationId(defaultConv.id);
          }

          // Determine phase based on state
          if (latest.scenes && latest.scenes.length > 0) {
            setCurrentPhase("production");
          }
        } else {
          // Initialize new project
          const projectId = uuidv4();
          const bibleId = uuidv4();
          const defaultConv: Conversation = {
            id: uuidv4(),
            name: "Director Chat",
            messages: [],
            relatedVisualBibleId: bibleId,
          };

          const newProject = {
            id: projectId,
            name: "Untitled Project",
            visualBible: { ...DEFAULT_BIBLE, id: bibleId },
            scenes: [],
            conversations: [defaultConv],
            lastUpdated: Date.now(),
          };
          await db.saveProject(newProject);
          setVisualBible(newProject.visualBible);
          setScenes(newProject.scenes);
          setConversations(newProject.conversations);
          setActiveConversationId(defaultConv.id);
        }
      } catch (error) {
        console.error("Failed to load state:", error);
        addLog("Failed to load project state", "error");
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  // Persist state on changes
  useEffect(() => {
    if (!isLoading && visualBible.id) {
      const saveState = async () => {
        await db.saveProject({
          id: visualBible.id,
          name: visualBible.name,
          visualBible,
          scenes,
          conversations,
          lastUpdated: Date.now(),
        });
      };
      saveState();
    }
  }, [visualBible, scenes, conversations, isLoading]);

  // Helper: Add system log
  const addLog = useCallback(
    (
      message: string,
      type: "info" | "error" | "success" | "warning" = "info"
    ) => {
      setSystemLogs((prev) => [
        ...prev,
        { message, type, timestamp: Date.now() },
      ]);
    },
    []
  );

  // Update Visual Bible
  const updateVisualBible = useCallback((updates: Partial<VisualBible>) => {
    setVisualBible((prev) => ({
      ...prev,
      ...updates,
      lastUpdatedTimestamp: Date.now(),
    }));
  }, []);

  // Generate Visual Bible from narrative
  const generateVisualBible = useCallback(
    async (narrative: string, styleNotes: string) => {
      try {
        addLog("Analyzing narrative and generating Visual Bible...", "info");
        setIsLoading(true);

        const bibleData = await analyzeNarrative(narrative, styleNotes);

        const newBible: VisualBible = {
          ...DEFAULT_BIBLE,
          ...bibleData,
          id: visualBible.id || uuidv4(),
          name: bibleData.name || visualBible.name,
          creationTimestamp: visualBible.creationTimestamp || Date.now(),
          lastUpdatedTimestamp: Date.now(),
        };

        setVisualBible(newBible);
        addLog("Visual Bible generated successfully", "success");
        setCurrentPhase("decomposition");

        return newBible;
      } catch (error) {
        addLog(`Visual Bible generation failed: ${error}`, "error");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [visualBible.id, visualBible.creationTimestamp, visualBible.name, addLog]
  );

  // Generate scenes from narrative
  const generateScenes = useCallback(
    async (narrative: string) => {
      try {
        addLog("Breaking narrative into scenes...", "info");
        setIsLoading(true);

        const sceneData = await decomposeIntoScenes(narrative, visualBible);

        const newScenes: SceneNode[] = sceneData.map((scene, index) => ({
          ...scene,
          id: uuidv4(),
          index,
        }));

        setScenes(newScenes);
        addLog(`Generated ${newScenes.length} scenes`, "success");
        setCurrentPhase("production");

        return newScenes;
      } catch (error) {
        addLog(`Scene generation failed: ${error}`, "error");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [visualBible, addLog]
  );

  // Start production pipeline
  const startPipeline = useCallback(async () => {
    if (!scenes.length) {
      addLog("No scenes to process", "error");
      return;
    }

    if (pipelineRef.current) {
      addLog("Pipeline already running", "warning");
      return;
    }

    addLog("Starting production pipeline...", "info");

    const pipeline = new ProductionPipeline(
      scenes,
      visualBible,
      (progress) => setPipelineProgress(progress),
      (sceneIndex, updates) => updateScene(scenes[sceneIndex].id, updates),
      addLog
    );

    pipelineRef.current = pipeline;
    setPipelineStatus("running");

    try {
      await pipeline.start();
      setPipelineStatus(pipeline.getStatus());
      addLog("Pipeline completed", "success");
    } catch (error) {
      addLog(`Pipeline error: ${error}`, "error");
      setPipelineStatus("error");
    } finally {
      pipelineRef.current = null;
    }
  }, [scenes, visualBible, addLog]);

  // Pause pipeline
  const pausePipeline = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.pause();
      setPipelineStatus("paused");
    }
  }, []);

  // Scene management
  const addScene = useCallback((scene: SceneNode) => {
    setScenes((prev) => [...prev, scene]);
  }, []);

  const updateScene = useCallback((id: string, updates: Partial<SceneNode>) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const regenerateScene = useCallback(
    async (sceneId: string, customPrompt?: string) => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (!scene) {
        addLog(`Scene ${sceneId} not found`, "error");
        return;
      }

      addLog(
        `Regenerating scene ${scene.index + 1}${
          customPrompt ? " with custom prompt" : ""
        }...`,
        "info"
      );

      // If custom prompt provided, update the scene's current prompt
      if (customPrompt) {
        updateScene(sceneId, {
          currentImagePrompt: customPrompt,
          overallStatus: "image_generating",
        });
      } else {
        // Reset to base prompt for clean regeneration
        updateScene(sceneId, {
          currentImagePrompt: scene.basePrompt,
          overallStatus: "image_generating",
        });
      }

      // Trigger actual image generation
      try {
        // Construct Context Stack
        const contextStack = {
          narrative: scene.narrativeSegment,
          visualBible,
          referenceImages: {
            character: Object.values(visualBible.characters)
              .filter(
                (char) =>
                  scene.narrativeSegment.includes(char.name) ||
                  (char.name.split(" ")[0] &&
                    scene.narrativeSegment.includes(char.name.split(" ")[0]))
              )
              .flatMap((char) => char.appearance.visualReferences || [])
              .slice(0, 3),
            setting: [], // TODO: Populate with relevant setting refs
            previousFrame: null, // TODO: Pass previous frame for continuity
          },
        };

        // Pass current image for editing if it exists
        const inputImage = scene.imageData?.base64;
        const thoughtSignature = scene.imageData?.thoughtSignature;

        // If we have BOTH an input image AND custom prompt, it's an EDIT
        // Combine scene context + current state + edit instruction to preserve continuity
        const effectivePrompt =
          inputImage && customPrompt
            ? `Scene Context (IMMUTABLE TRUTH): ${
                scene.narrativeSegment
              }\n\nCurrent Visual State: ${
                scene.currentImagePrompt || scene.basePrompt
              }\n\nEdit Instruction: ${customPrompt}`
            : customPrompt || scene.currentImagePrompt || scene.basePrompt;

        const result = await generateSceneImage(
          effectivePrompt,
          contextStack,
          "2K",
          inputImage,
          thoughtSignature
        );

        updateScene(sceneId, {
          imageData: {
            base64: result.base64,
            thoughtSignature: result.thoughtSignature,
            attempts: (scene.imageData?.attempts || 0) + 1,
            status: "done", // Added missing status field
          },
          overallStatus: "image_validated", // Auto-validate for now, or set to 'image_generated'
        });

        addLog(`Scene ${scene.index + 1} regenerated successfully`, "success");
      } catch (error) {
        console.error("Regeneration failed:", error);
        addLog(
          `Scene ${scene.index + 1} regeneration failed: ${error}`,
          "error"
        );
        updateScene(sceneId, { overallStatus: "image_failed" });
      }
    },
    [scenes, visualBible, updateScene, addLog]
  );

  const forceApproveScene = useCallback(
    (sceneId: string) => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (!scene) {
        addLog(`Scene ${sceneId} not found`, "error");
        return;
      }

      updateScene(sceneId, { overallStatus: "image_validated" });
      addLog(`Scene ${scene.index + 1} force-approved by user`, "warning");
    },
    [scenes, updateScene, addLog]
  );

  const injectSceneFeedback = useCallback(
    async (sceneId: string, feedback: string) => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (!scene) {
        addLog(`Scene ${sceneId} not found`, "error");
        return;
      }

      addLog(
        `Processing feedback for scene ${
          scene.index + 1
        }: "${feedback.substring(0, 50)}..."`,
        "info"
      );

      try {
        // Directly trigger regeneration with the feedback as the prompt instructions
        // The generateSceneImage function will handle it as an edit because we pass the inputImage
        await regenerateScene(sceneId, feedback);
      } catch (error) {
        console.error("Feedback injection failed:", error);
        addLog(`Feedback failed: ${error}`, "error");
      }
    },
    [scenes, regenerateScene, addLog, visualBible]
  );

  const viewSceneImage = useCallback(
    (base64: string) => {
      // Open image in new window/tab for full-size viewing
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;

      const win = window.open("");
      if (win) {
        win.document.write(image.outerHTML);
        win.document.title = "Scene Image - Full Size";
      } else {
        addLog("Failed to open image viewer (popup blocked)", "warning");
      }
    },
    [addLog]
  );

  // Conversation management
  const addMessage = useCallback(
    (conversationId: string, message: ChatMessage) => {
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conversationId);
        if (exists) {
          return prev.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, message] }
              : c
          );
        } else {
          return [
            ...prev,
            {
              id: conversationId,
              name: "New Conversation",
              messages: [message],
              relatedVisualBibleId: visualBible.id,
            },
          ];
        }
      });
    },
    [visualBible.id]
  );

  return {
    // State
    visualBible,
    scenes,
    conversations,
    activeConversationId,
    isLoading,
    currentPhase,
    pipelineStatus,
    pipelineProgress,
    systemLogs,

    // Visual Bible actions
    updateVisualBible,
    generateVisualBible,

    // Scene actions
    generateScenes,
    addScene,
    updateScene,
    regenerateScene,
    forceApproveScene,
    injectSceneFeedback,
    viewSceneImage,

    // Pipeline actions
    startPipeline,
    pausePipeline,

    // Conversation actions
    addMessage,
    setActiveConversationId,

    // Phase management
    setCurrentPhase,
  };
};
