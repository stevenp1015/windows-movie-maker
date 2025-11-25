# **PHASE 1: THE SETUP (The "Context Nuke")**
The Scenario: Steven pastes his 50-page novella into the DirectorSanctum and hits "Analyze".

## CRITICAL FAILURE 1: The Token Explosion.
- The Issue: Your `analyzeNarrative` function sends the entire raw text + the system prompt in a single shot.
- The Result: For a novel-length input, this will either (a) hit the token limit immediately, or (b) confuse the model with too much noise, causing it to hallucinate or miss key details.
- The Fix: You need an **OPTIONAL** "Chunking & Summarization" pre-processing step. This would break the narrative into chapters/acts, summarize each, and then feed into the Visual Bible analysis.
CHANGE TO:
- The Fix: 
    - [ ] Add an optional "Chunking & Summarization" pre-processing step. This would break the narrative into chapters/acts, summarize each, and then feed into the Visual Bible analysis.

## UX GAP 1: The "Trust Me" Bible.
- The Issue: The VisualBible is generated as a JSON object. The User sees a list of characters.
- The Gap: Steven has specific mental images for "John". The current UI lets him edit text descriptions (`addCharacter`), but it doesn't let him upload a reference image or generate a sketch right there in the planning phase.
- The Result: He spends 20 minutes describing "John" in text, only to find out in Phase 3 that the AI interprets "rugged" differently than he does.

- The Fix: 
    - [ ] The VisualBible must be restructured to support Reference Image Uploads and context-aware conversation with `gemini-3-image-preview` to generate character images.
    - [ ] Each item in the VisualBible should have an option to create a context-aware conversation with `gemini-3-pro-preview`. IN THIS CHAT UX, THERE SHOULD BE A STANDARD "SEND" BUTTON TO SEND THE MESSAGE TO GEMINI-3-PRO, AND NEXT TO IT, A "GENERATE IMAGE" BUTTON TO SEND THE MESSAGE TO `gemini-3-image-preview`. IT'S IMPORTANT TO ENSURE THAT THE ENTIRE CONVERSATION IS SENT WHEN THE USER CLICKS THE "GENERATE IMAGE" BUTTON AS WELL. THE CONVERSATION MUST BE STORED IN THE VISUALBIBLE CARDS THEMSELVES
    - [ ] The conversation must include function calling to allow gemini to make the changes to the VisualBible


# **PHASE 2: DECOMPOSITION (The "Granularity Trap")**
The Scenario: Steven selects "Detailed Paragraph" granularity and hits "Decompose".

## UX GAP 2: The 500-Scene Scroll of Death.
- The Issue: The decomposition creates 500 scenes.
- The Gap: There is no way to Group, Merge, or Batch these scenes.
- The Result: Steven has to scroll through 500 cards to check prompts. He will give up.
- The Fix: Implement "Sequences" or "Chapters" in the data structure. SceneNode should belong to a Sequence.
CHANGE TO:
- The Fix: 
    - [ ] Implement *OPTIONAL* "Sequences" or "Chapters" in the data structure. SceneNode should belong to a Sequence.
    - [ ] Implement *OPTIONAL* "Group", "Merge", and "Batch" operations on Sequences.

## LOGIC GAP 1: The "Hallucinating" Prompt Writer.
- The Issue: `decomposeIntoScenes` generates basePrompt for Scene 50 based on the narrative segment and the Visual Bible.
- The Gap: It lacks Temporal Context. It doesn't know what happened in Scene 49 visually.
- The Result: Scene 49: "John is holding a bloody knife." Scene 50: "John is shaking hands." (Where did the knife go? Is he still bloody?). The prompts will lack continuity.
- The Fix: The decomposition agent needs a "Running State" or "Previous Context" summary injected into the prompt generation for sequential consistency.

# **PHASE 3: PRODUCTION (The "Blind Artist" & "Amnesiac Video")**
The Scenario: The pipeline starts. Scene 1 generates.

## CRITICAL FAILURE 2: The "Blind" Imagen 4.
- The Issue: You are using imagen-4.0-ultra-generate-001 for scene generation.
- The Gap: As currently implemented, `generateSceneImage` takes ONLY TEXT. It ignores the VisualBible's visualReferences or the characterTurnaround images you generated.
- The Result: "John" will look slightly different in every single frame. The "Critic" will reject them, the loop will retry, and it will fail because the generator is blind to the reference.
- The Fix: You MUST use Nano Banana (Gemini 3 Image Preview) for the initial generation if you want to pass reference images, OR use Nano Banana to "Style Transfer" the Imagen 4 output to match the character sheet.
CHANGE TO:
- The Fix: 
    - [ ] Use `gemini-3-image-preview` for image generation and editing
    - [ ] Pass reference images through each step of the pipeline


## CRITICAL FAILURE 3: The "Lazy Fixer".
- The Issue: When the Critic fails an image, your code does this: `return ${originalPrompt}\n\nIMPORTANT CORRECTIONS: ${fixInstructions}`.
- The Result: This creates "Prompt Salad". Conflicting instructions ("Daytime" + "Correction: Make it Night") confuse the model.
- The Fix: The prompt must be Rewritten from Scratch by Gemini 3, incorporating the critique into a clean, new prompt.
CHANGE TO:
- The Fix: 
    - [ ] NEEDS A TON OF FUCKING CONTEXT !!!! 

## CRITICAL FAILURE 4: The "Amnesiac" Video.
- The Issue: `generateSceneVideo` (Veo 3.1) takes imageBase64 (the start frame) and prompt.
- The Gap: Veo 3.1 explicitly supports `reference_images` (plural). You are NOT passing the Character Turnarounds or the Setting Reference images to Veo.
- The Result: The video starts with the correct image, but as soon as the character moves, they might morph into a generic person because Veo doesn't know what they look like from the side/back (which you HAVE in the turnaround!).
- The Fix: Inject the characterTurnaround views into the `reference_images` array of the Veo call.

## UX GAP 3: The "Jump Cut" Nightmare.
- The Issue: Scene 1 video ends. Scene 2 video starts.
- The Gap: You aren't using Veo's Interpolation or last_frame constraint.
- The Result: The video will be a series of jarring jump cuts.
- The Fix: Scene 2's video generation should optionally take Scene 1's Last Frame as a constraint (if the narrative implies continuous time).

# **PHASE 4: SYSTEM (The "Time Bomb")**

## CRITICAL FAILURE 5: The Storage Crash.
- The Issue: You are storing base64 strings in the VisualBible and SceneNode objects, which are likely being saved to localStorage or a simple JSON file via db.ts
- The Result: After about 10-20 generated images (4K resolution), the browser's storage quota will be hit, or the JSON parse/stringify will crash the main thread.
- The Fix: You MUST use IndexedDB to store the binary Blob data, and only keep IDs/Keys in the state object.
CHANGE TO:
- The Fix: 
    - [ ] Use IndexedDB to store the binary Blob data
    - [ ] Only keep IDs/Keys in the state object

## CRITICAL FAILURE 6: The "Silent" Rate Limit.
- The Issue: You have a delay(5000) between calls.
- The Result: Gemini 3 and Veo 3.1 are computationally heavy. You will hit 429s. A simple delay isn't enough.
- The Fix: You need a "Token Bucket" or "Exponential Backoff" queue wrapper for all API calls.