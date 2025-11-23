import { type SceneNode, type VisualBible } from '../types';
import { generateSceneImage, validateImage, generateSceneVideo } from './gemini';
import * as db from './db';

export type PipelineStatus = 'idle' | 'running' | 'paused' | 'complete' | 'error';

export interface PipelineProgress {
  currentSceneIndex: number;
  totalScenes: number;
  phase: 'image_generation' | 'image_validation' | 'video_generation' | 'complete';
}

type ProgressCallback = (progress: PipelineProgress) => void;
type SceneUpdateCallback = (sceneIndex: number, updates: Partial<SceneNode>) => void;
type LogCallback = (message: string, type: 'info' | 'error' | 'success' | 'warning') => void;

export class ProductionPipeline {
  private status: PipelineStatus = 'idle';
  private shouldStop = false;
  
  constructor(
    private scenes: SceneNode[],
    private visualBible: VisualBible,
    private onProgress: ProgressCallback,
    private onSceneUpdate: SceneUpdateCallback,
    private onLog: LogCallback
  ) {}

  async start() {
    if (this.status === 'running') {
      this.onLog('Pipeline already running', 'warning');
      return;
    }

    this.status = 'running';
    this.shouldStop = false;
    this.onLog('Starting production pipeline...', 'info');

    try {
      for (let i = 0; i < this.scenes.length; i++) {
        if (this.shouldStop) {
          this.onLog('Pipeline paused by user', 'warning');
          this.status = 'paused';
          return;
        }

        await this.processScene(i);
      }

      this.status = 'complete';
      this.onLog('Pipeline complete!', 'success');
    } catch (error) {
      this.status = 'error';
      this.onLog(`Pipeline error: ${error}`, 'error');
      throw error;
    }
  }

  pause() {
    this.shouldStop = true;
    this.onLog('Pausing pipeline...', 'info');
  }

  private async processScene(index: number) {
    const scene = this.scenes[index];
    this.onLog(`Processing scene ${index + 1}/${this.scenes.length}: "${scene.narrativeSegment.substring(0, 50)}..."`, 'info');

    // Update scene status
    this.onSceneUpdate(index, { overallStatus: 'image_generating' });

    // Phase 1: Generate Image
    const imageResult = await this.generateImageWithRetry(scene, index);
    
    if (!imageResult) {
      this.onSceneUpdate(index, { overallStatus: 'image_failed_retries' });
      this.onLog(`Scene ${index + 1} requires user intervention`, 'warning');
      this.shouldStop = true;
      return;
    }

    // Update scene with generated image
    this.onSceneUpdate(index, {
      imageData: imageResult,
      overallStatus: 'image_validated'
    });

    this.onLog(`Scene ${index + 1} image validated`, 'success');

    // Phase 2: Generate Video
    this.onSceneUpdate(index, { overallStatus: 'video_generating' });
    this.onProgress({
      currentSceneIndex: index,
      totalScenes: this.scenes.length,
      phase: 'video_generation'
    });

    try {
      const videoResult = await generateSceneVideo(
        imageResult.base64,
        scene.currentImagePrompt,
        5 // duration in seconds
      );

      this.onSceneUpdate(index, {
        videoData: {
          uri: videoResult.uri || 'pending',
          status: videoResult.operationId ? 'pending' : 'done',
          attempts: 1
        },
        overallStatus: 'complete'
      });

      this.onLog(`Scene ${index + 1} video generated`, 'success');

      // Delay between video generations to respect rate limits
      if (index < this.scenes.length - 1) {
        await this.delay(this.visualBible.videoGenerationDelaySeconds * 1000);
      }
    } catch (error) {
      this.onLog(`Video generation failed for scene ${index + 1}: ${error}`, 'error');
      this.onSceneUpdate(index, {
        videoData: {
          uri: '',
          status: 'error',
          attempts: 1
        }
      });
    }
  }

  private async generateImageWithRetry(scene: SceneNode, sceneIndex: number): Promise<{ base64: string; seed?: number; attempts: number; status: string } | null> {
    let currentPrompt = scene.currentImagePrompt;
    const maxRetries = this.visualBible.maxImageRetries;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.onLog(`Generating image for scene ${sceneIndex + 1}, attempt ${attempt}/${maxRetries}`, 'info');

      try {
        // Generate image
        const imageResult = await generateSceneImage(currentPrompt, this.visualBible.targetOutputAspectRatio);
        
        // Run validations
        const validationsPassed = await this.runValidations(sceneIndex, imageResult.base64, attempt);

        if (validationsPassed) {
          return {
            base64: imageResult.base64,
            seed: imageResult.seed,
            attempts: attempt,
            status: 'done'
          };
        }

        // If validation failed, get the latest fix instructions
        const lastValidation = this.scenes[sceneIndex].validationLog[this.scenes[sceneIndex].validationLog.length - 1];
        
        if (lastValidation?.fixInstructions) {
          currentPrompt = this.rewritePrompt(currentPrompt, lastValidation.fixInstructions);
          this.onSceneUpdate(sceneIndex, { currentImagePrompt: currentPrompt });
          this.onLog(`Rewriting prompt based on critique: "${lastValidation.fixInstructions.substring(0, 100)}..."`, 'info');
        }

      } catch (error) {
        this.onLog(`Image generation error (attempt ${attempt}): ${error}`, 'error');
      }
    }

    return null; // All retries exhausted
  }

  private async runValidations(sceneIndex: number, imageBase64: string, attempt: number): Promise<boolean> {
    const scene = this.scenes[sceneIndex];
    const strides = this.visualBible.validationStrides;

    // Determine which validations to run based on scene index
    const validationsToRun: Array<{
      type: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
      referenceIndex: number;
    }> = [];

    // Always run immediate validation
    validationsToRun.push({ type: 'IMMEDIATE', referenceIndex: sceneIndex });

    // SHORT_TERM: Every 'short' images
    if ((sceneIndex + 1) % strides.short === 0 && sceneIndex >= strides.short) {
      validationsToRun.push({ type: 'SHORT_TERM', referenceIndex: sceneIndex - strides.short });
    }

    // MEDIUM_TERM: Every 'medium' images
    if ((sceneIndex + 1) % strides.medium === 0 && sceneIndex >= strides.medium) {
      validationsToRun.push({ type: 'MEDIUM_TERM', referenceIndex: sceneIndex - strides.medium });
    }

    // LONG_TERM: Every 'long' images (compare against first frame)
    if ((sceneIndex + 1) % strides.long === 0 && sceneIndex >= strides.long) {
      validationsToRun.push({ type: 'LONG_TERM', referenceIndex: 0 });
    }

    let allPassed = true;

    for (const validation of validationsToRun) {
      const referenceScene = this.scenes[validation.referenceIndex];
      const referenceImage = referenceScene?.imageData?.base64 || null;

      this.onLog(`Running ${validation.type} validation for scene ${sceneIndex + 1}`, 'info');

      try {
        const result = await validateImage(
          imageBase64,
          scene,
          referenceImage,
          this.visualBible,
          validation.type
        );

        // Add to validation log
        const logEntry = {
          timestamp: Date.now(),
          type: validation.type,
          referenceSceneIndex: validation.referenceIndex,
          score: result.score,
          critique: result.critique,
          passed: result.passed,
          fixInstructions: result.fixInstructions,
          attempt
        };

        // Update scene validation log
        this.onSceneUpdate(sceneIndex, {
          validationLog: [...scene.validationLog, logEntry]
        });

        if (!result.passed) {
          allPassed = false;
          this.onLog(`${validation.type} validation FAILED (score: ${result.score}/10): ${result.critique}`, 'warning');
        } else {
          this.onLog(`${validation.type} validation PASSED (score: ${result.score}/10)`, 'success');
        }

      } catch (error) {
        this.onLog(`Validation error: ${error}`, 'error');
        allPassed = false;
      }
    }

    return allPassed;
  }

  private rewritePrompt(originalPrompt: string, fixInstructions: string): string {
    // Simple implementation: append fix instructions
    // In a more sophisticated version, we'd use Gemini to intelligently rewrite
    return `${originalPrompt}\n\nIMPORTANT CORRECTIONS: ${fixInstructions}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus(): PipelineStatus {
    return this.status;
  }
}
