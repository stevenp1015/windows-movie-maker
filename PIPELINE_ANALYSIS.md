# THE MONSTROSITY: PIPELINE ANALYSIS & PROMPT CHAIN (23 SCENE SIMULATION)

**Objective:** Map the exact prompt context and API chain for a 23-scene short story adaptation, utilizing **Gemini 3 Pro Preview** exclusively (with `thinking_level: "high"`) for all text, image generation, and editing tasks.

**Core Mandate:** "Oversaturation" of context. Zero ambiguity. Continuity is God.

---

## **PHASE 1: THE BRAIN (Visual Bible Creation)**

### **Step 1.1: The "Context Nuke" (Narrative Analysis)**
*   **Model:** `gemini-3-pro-preview`
*   **Thinking Level:** `HIGH`
*   **Input:**
    *   **Raw Narrative:** (The full 23-scene short story text).
    *   **Style Notes:** (User's specific vision, e.g., "Cyberpunk Noir, heavy rain, neon pinks").
*   **System Prompt Context (The "Director" Persona):**
    *   "You are a visionary, avant-garde director. You hate clichés. You love high-contrast, visceral storytelling."
    *   "Your goal is to extract a `VisualBible` that will serve as the immutable source of truth for a 23-scene video generation pipeline."
    *   "You must define the visual language so precisely that a blind artist could paint it."
*   **The "Oversaturated" Prompt Payload:**
    *   `Narrative Text`
    *   `Style Notes`
    *   **Constraint:** "Analyze the narrative for *implicit* visual cues. If the text says 'He felt cold', define the visual translation: 'Visible breath, frost on windows, blue-tinted color grading'."
    *   **Schema:** (Strict JSON schema for `VisualBible` including `characters`, `settings`, `cinematography`, `colorPalette`, `keyMotifs`).

### **Step 1.2: The "Character Forge" (Turnaround Generation)**
*   **Model:** `gemini-3-pro-image-preview` (Nano Banana)
*   **Thinking Level:** `HIGH`
*   **Input:**
    *   `VisualBible.characters["Protagonist"]` (Detailed description).
    *   `VisualBible.cinematography` (Lighting/Lens).
    *   `VisualBible.colorPalette` (Mood).
*   **Prompt Chain (Iterative with Thought Signatures):**
    1.  **Front View:**
        *   **Prompt:** "Generate a 4K Character Reference Sheet. Front View. [Character Description]. [Cinematography]. [Color Palette]. Neutral expression. Arms at sides. White background."
        *   **Output:** `Image_Front`, `ThoughtSignature_1`.
    2.  **Side View (Left):**
        *   **Context:** `Image_Front` (Inline Data), `ThoughtSignature_1`.
        *   **Prompt:** "Rotate the character 90 degrees left. Side Profile. Maintain EXACT facial structure, clothing details, and lighting. [Character Description]."
        *   **Output:** `Image_Side`, `ThoughtSignature_2`.
    3.  **Back View:**
        *   **Context:** `Image_Front`, `Image_Side`, `ThoughtSignature_2`.
        *   **Prompt:** "Rotate character to show Back View. Maintain EXACT clothing details (jacket logo, hair style). [Character Description]."
        *   **Output:** `Image_Back`, `ThoughtSignature_3`.
*   **Result:** A validated, multi-view reference asset for the Protagonist.

---

## **PHASE 2: THE BLUEPRINT (Scene Decomposition)**

### **Step 2.1: The "Shot List" Architect**
*   **Model:** `gemini-3-pro-preview`
*   **Thinking Level:** `HIGH`
*   **Input:**
    *   `Narrative Text`
    *   `VisualBible` (Full JSON).
*   **The "State Tracking" Injection:**
    *   "You must track the **World State** for *every single scene*. If a character gets a scar in Scene 3, Scene 4 MUST explicitly mention 'fresh scar on cheek' in the prompt."
    *   "Track: Time of Day, Weather, Character Health/Attire, Prop Location."
*   **Prompt Payload:**
    *   "Decompose this narrative into exactly 23 scenes."
    *   "For EACH scene, generate:"
        1.  `narrativeSegment`: The text chunk.
        2.  `worldState`: { time: "...", weather: "...", characterStatus: {...} }.
        3.  `basePrompt`: A dense, 4K-ready image prompt.
        4.  `cinematography`: Specific camera move/angle for *this* shot (e.g., "Low angle, dolly in").
        5.  `continuityNotes`: Specific reminders (e.g., "Ensure the glass shattered in Scene 5 is still on the floor").

---

## **PHASE 3: THE PRODUCTION (The 23-Step Gauntlet)**

**Simulation: Scene 12 (The Turning Point)**
*   **Context:** The Protagonist has just been in a fight (Scene 11). It is raining. Night time.

### **Step 3.1: Image Generation (The "Context Stack")**
*   **Model:** `gemini-3-pro-image-preview` (Nano Banana)
*   **Thinking Level:** `HIGH`
*   **Input Context (The "Oversaturation"):**
    1.  **Reference Images:**
        *   `CharacterTurnaround.front` (Base64) -> "This is the character's face."
        *   `CharacterTurnaround.side` (Base64) -> "This is their profile."
        *   `Scene_11_Image` (Base64) -> "This was the previous frame. Match this lighting and color grading EXACTLY."
        *   `Setting_Alleyway_Ref` (Base64) -> "This is the location."
    2.  **Text Context:**
        *   `VisualBible.cinematography` -> "Neo-Noir, High Contrast."
        *   `Scene_12.basePrompt` -> "Protagonist leaning against brick wall, wiping blood from lip. Heavy rain."
        *   `Scene_12.worldState` -> "Status: Injured (Split Lip). Weather: Heavy Rain. Time: Night."
        *   `Scene_12.continuityNotes` -> "Jacket is torn on left shoulder from Scene 11."
*   **The Prompt:**
    *   "Generate a 4K cinematic image for Scene 12. [BasePrompt]. **CRITICAL CONTINUITY:** The character MUST look exactly like the Reference Images. The lighting MUST match Scene 11. The jacket MUST be torn on the left shoulder as shown in the continuity notes. The split lip MUST be fresh."

### **Step 3.2: The Critic (Validation)**
*   **Model:** `gemini-3-pro-image-preview`
*   **Thinking Level:** `HIGH`
*   **Input:**
    *   `Generated_Image_Scene_12`
    *   `Scene_11_Image` (Reference)
    *   `CharacterTurnaround.front` (Reference)
    *   `Scene_12.basePrompt`
*   **Prompt:**
    *   "You are a continuity supervisor. Compare the Generated Image to Scene 11 and the Character Reference. Does the character look like the same person? Is the lighting consistent? Is the jacket torn? Is the lip bleeding? If NO, provide specific `fix_instructions`."

### **Step 3.3: The Fixer (If Validation Fails)**
*   **Model:** `gemini-3-pro-image-preview` (Editing Mode)
*   **Thinking Level:** `HIGH`
*   **Input:**
    *   `Generated_Image_Scene_12` (The "Draft")
    *   `Critic.fix_instructions` (e.g., "The jacket is not torn. Fix it.")
    *   `ThoughtSignature` (From the generation step).
*   **Prompt:**
    *   "Edit this image. Apply the following fix: [Fix Instructions]. Maintain all other details. Ensure 4K quality."

---

## **PHASE 4: THE MOTION (Video Generation)**

### **Step 4.1: Veo 3.1 Generation**
*   **Model:** `veo-3.1-generate-preview`
*   **Input:**
    *   `image`: `Generated_Image_Scene_12` (The Start Frame).
    *   `prompt`: `Scene_12.basePrompt` + "Cinematic motion. The character slowly wipes their lip. Rain falls heavily. Camera dollies in slowly."
    *   **Reference Images (The "Anchor"):**
        *   `CharacterTurnaround.front` (To lock facial identity during motion).
        *   `CharacterTurnaround.side` (To lock 3D geometry).
        *   `Setting_Alleyway_Ref` (To lock background stability).
*   **Result:** A 5-second video clip that actually looks like the character, in the correct setting, moving naturally.

---

## **PHASE 5: THE LOOP (Scene 13)**

*   **The Cycle Continues:**
    *   Scene 13's generation will now ingest `Scene_12_Image` (the one we just made) as its "Previous Frame" reference.
    *   The `worldState` will update (e.g., "Lip is now scabbing" or "Rain has stopped").
    *   The "Context Stack" grows, ensuring Scene 23 still looks like it belongs in the same movie as Scene 1.

---

**This is the chain.** Every link is reinforced with:
1.  **Visual References** (Turnarounds, Previous Frames).
2.  **State Tracking** (World State, Character Health).
3.  **High-Thinking Reasoning** (No "autopilot").
4.  **Thought Signatures** (Memory of the creative process).
