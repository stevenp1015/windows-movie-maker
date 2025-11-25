# THE MONSTROSITY: FULL PIPELINE SIMULATION (CHAPTER ONE: THE BUS THAT SHOULDN'T EXIST)

**Objective:** Simulate the **entire** API call chain for the provided narrative chapter, demonstrating the "Context Saturation" strategy using `gemini-3-pro-preview` (Text) and `gemini-3-pro-image-preview` (Vision).

**Narrative Source:** "Chapter One: The Bus That Shouldn’t Exist" (A chaotic, high-school drama set in Florida, featuring characters Pfizer, Moderna, Johnson & Johnson, and the Narrator).

---

## **PHASE 1: THE BRAIN (Visual Bible Creation)**

### **API CALL 1.1: Narrative Analysis & Bible Generation**
*   **Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent`
*   **Configuration:**
    *   `thinking_config`: `{ thinking_level: "high" }`
    *   `response_mime_type`: `application/json`
*   **System Prompt:**
    > You are a visionary, avant-garde director. You hate clichés. You love high-contrast, visceral storytelling. Your goal is to extract a `VisualBible` that will serve as the immutable source of truth for a video generation pipeline. You must define the visual language so precisely that a blind artist could paint it. Analyze the narrative for *implicit* visual cues. If the text says 'He felt cold', define the visual translation: 'Visible breath, frost on windows, blue-tinted color grading'.
*   **User Prompt (The "Context Nuke"):**
    > **Narrative:** [FULL TEXT OF CHAPTER ONE INSERTED HERE - ~1500 tokens]
    >
    > **Style Notes:** "Cyberpunk High School Drama. Florida humidity. Neon lights in daylight. Sweat, glitter, and anxiety. Hyper-realism mixed with 'Degrassi' aesthetics."
    >
    > **Output Schema:** [Strict JSON Schema for VisualBible]
*   **Simulated Output (The "Bible"):**
    ```json
    {
      "narrativeThemes": ["Social Hierarchy", "Surrealism", "Teenage Anxiety", "Florida Chaos"],
      "characters": {
        "Narrator": {
          "name": "Narrator (The Observer)",
          "description": "Anxious, observant, blends into background. 16 years old.",
          "appearance": {
            "attire": "Fall Out Boy hoodie (sweat stains), skinny jeans, Converse (double-knotted), Panic! At the Disco shirt underneath.",
            "build": "Slender, hunched posture.",
            "keyFeatures": ["Messy hair", "Nervous expression", "Sweat on forehead"]
          }
        },
        "Pfizer": {
          "name": "Pfizer",
          "description": "The Queen Bee. Radiates chaotic energy. Dominant.",
          "appearance": {
            "attire": "Hollister zip-up (half-zipped), multiple jelly bracelets.",
            "hair": "Perfect bangs, no cowlicks.",
            "makeup": "Aggressive lip gloss.",
            "keyFeatures": ["Clipboard", "Pen", "Intense gaze"]
          }
        },
        "Moderna": {
          "name": "Moderna",
          "description": "The Emo Lieutenant. Mysterious, spiritual but messy.",
          "appearance": {
            "attire": "Black hoodie with thumb holes, canvas messenger bag with 'I SUPPORT SMALL BANDS' button.",
            "vibe": "Summoned by an emo deity."
          }
        },
        "Johnson_Johnson": {
          "name": "Johnson & Johnson",
          "description": "The Judgmental Enforcer. Wealthy but chaotic.",
          "appearance": {
            "attire": "Trendy early 2000s fashion.",
            "keyFeatures": ["Starbucks cup", "Gum", "Judgmental lean"]
          }
        }
      },
      "settings": {
        "Bus_Loop": {
          "name": "Edison High Bus Loop",
          "atmosphere": "Thick humidity, 7:28 AM morning haze, surreal.",
          "keyVisualElements": ["Asphalt", "School buses", "The Party Bus (Mirrored, LED lights)", "Pfizer's Mom with Fishbowl"]
        }
      },
      "cinematography": {
        "lightingStyle": "High-contrast morning sun cutting through humidity haze.",
        "lensType": "Anamorphic with slight distortion (dreamlike)",
        "colorPalette": {
          "mood": "Sweaty Neon",
          "hexCodes": ["#FF00FF", "#00FFFF", "#FFFF00", "#1A1A1A"]
        }
      }
    }
    ```

### **API CALL 1.2: Character Turnaround Generation (Pfizer)**
*   **Endpoint:** `POST .../gemini-3-pro-image-preview:generateContent`
*   **Configuration:** `thinking_level: "high"`, `image_size: "4K"`, `aspect_ratio: "2:3"`
*   **Prompt (Front View):**
    > Generate a 4K Character Reference Sheet. **Subject:** Pfizer.
    > **Appearance:** Hollister zip-up (half-zipped), multiple jelly bracelets. Perfect bangs. Aggressive lip gloss. Intense gaze.
    > **Style:** Hyper-realistic, cinematic lighting. High contrast.
    > **View:** Front-facing, neutral expression, arms at sides. White background.
*   **Output:** `Image_Pfizer_Front` (Base64), `ThoughtSignature_Pfizer_1`.

### **API CALL 1.3: Character Turnaround Generation (Pfizer - Side)**
*   **Endpoint:** `POST .../gemini-3-pro-image-preview:generateContent`
*   **Context Payload:**
    *   `Image_Pfizer_Front` (Inline Data)
    *   `ThoughtSignature_Pfizer_1`
*   **Prompt:**
    > Rotate the character 90 degrees left. Side Profile. Maintain EXACT facial structure, bangs, and clothing details (Hollister logo visibility).
*   **Output:** `Image_Pfizer_Side` (Base64), `ThoughtSignature_Pfizer_2`.

*(Repeat for Moderna, Johnson & Johnson, and Narrator - Total 8 more API calls)*

---

## **PHASE 2: THE BLUEPRINT (Scene Decomposition)**

### **API CALL 2.1: Scene Breakdown**
*   **Endpoint:** `POST .../gemini-3-pro-preview:generateContent`
*   **Configuration:** `thinking_level: "high"`
*   **Context Payload:**
    *   `Narrative Text` (Full Chapter)
    *   `VisualBible` (JSON)
*   **System Prompt:**
    > Decompose this narrative into individual scenes. For EACH scene, generate:
    > 1. `narrativeSegment`: The text.
    > 2. `worldState`: { time, weather, characterStatus }. **TRACK STATE PERSISTENCE.**
    > 3. `basePrompt`: Dense, 4K-ready image prompt.
    > 4. `continuityNotes`: Specific visual anchors.
*   **Simulated Output (Excerpt):**
    *   **Scene 1:** Narrator outside Edison High. 7:28 AM. Sweating.
    *   **Scene 2:** The Party Bus rolls up. Mirrored ceilings visible.
    *   **Scene 3:** Pfizer steps off. Music video vibe.
    *   **Scene 4:** Moderna steps off behind her.
    *   **Scene 5:** Joey Sebastian leans on bus.
    *   **Scene 6:** Pfizer's Mom with the Fishbowl.
    *   **Scene 7:** Narrator ties shoe (hiding).
    *   **Scene 8:** Johnson & Johnson appears ("Hey").
    *   **Scene 9:** J&J sipping Starbucks. Judgment.
    *   **Scene 10:** The Bus vanishes.
    *   **Scene 11:** The Bell rings. Chaos.

---

## **PHASE 3: THE PRODUCTION (Scene-by-Scene Execution)**

### **SCENE 1: The Sweat & The Hoodie**
*   **Narrative:** "It was 7:28 a.m... pretending I wasn’t sweating through the armpits of my Fall Out Boy hoodie."

#### **API CALL 3.1.1: Image Generation**
*   **Endpoint:** `POST .../gemini-3-pro-image-preview:generateContent`
*   **Context Stack:**
    *   `Ref_Narrator_Front` (Base64)
    *   `Ref_Narrator_Side` (Base64)
    *   `VisualBible.cinematography`
*   **Prompt:**
    > **Scene:** Exterior, Edison High School. Morning haze. 7:28 AM.
    > **Action:** The Narrator stands awkwardly. Visible sweat on forehead. Wearing Fall Out Boy hoodie.
    > **Camera:** Medium shot. Slight anamorphic distortion.
    > **Continuity:** MATCH NARRATOR REFERENCE EXACTLY.
*   **Output:** `Img_Scene_1` (Base64), `Sig_Scene_1`.

#### **API CALL 3.1.2: Validation (The Critic)**
*   **Endpoint:** `POST .../gemini-3-pro-image-preview:generateContent`
*   **Context:** `Img_Scene_1`, `Ref_Narrator_Front`.
*   **Prompt:**
    > Does the character look like the Reference? Is there visible sweat? Is the hoodie correct?
*   **Output:** `PASS`.

---

### **SCENE 2: The Party Bus Arrives**
*   **Narrative:** "That’s when Pfizer’s party bus rolled up... mirrored ceilings, under-seat LED lights."

#### **API CALL 3.2.1: Image Generation**
*   **Endpoint:** `POST .../gemini-3-pro-image-preview:generateContent`
*   **Context Stack:**
    *   `Img_Scene_1` (Previous Frame - for lighting/haze continuity)
*   **Prompt:**
    > **Scene:** Same location. A massive, black charter bus rolls into frame.
    > **Details:** Windows are tinted but reveal mirrored ceilings and purple LED lights inside. Champagne bucket visible through windshield.
    > **Atmosphere:** Surreal, imposing.
    > **Continuity:** Maintain the morning haze and lighting from Scene 1.
*   **Output:** `Img_Scene_2`, `Sig_Scene_2`.

---

### **SCENE 3: Pfizer's Entrance**
*   **Narrative:** "She stepped off the bus like a music video... Hollister zip-up, half-zipped."

#### **API CALL 3.3.1: Image Generation**
*   **Endpoint:** `POST .../gemini-3-pro-image-preview:generateContent`
*   **Context Stack:**
    *   `Ref_Pfizer_Front`
    *   `Ref_Pfizer_Side`
    *   `Img_Scene_2` (Bus context)
*   **Prompt:**
    > **Scene:** Pfizer stepping down the bus stairs.
    > **Action:** Radiating confidence. Wind blowing hair (music video effect).
    > **Attire:** Hollister zip-up, jelly bracelets.
    > **Continuity:** MATCH PFIZER REFERENCE EXACTLY. Bus details from Scene 2 must match.
*   **Output:** `Img_Scene_3` (FAIL - "Hair not blowing enough").

#### **API CALL 3.3.2: Image Editing (The Fix)**
*   **Endpoint:** `POST .../gemini-3-pro-image-preview:generateContent`
*   **Context:** `Img_Scene_3` (Draft), `Sig_Scene_3`.
*   **Prompt:**
    > Edit this image. Make the hair blow more dramatically as if in a wind tunnel. Maintain face and clothing.
*   **Output:** `Img_Scene_3_v2` (PASS).

---

### **SCENE 6: The Fishbowl**
*   **Narrative:** "Pfizer’s mom was standing at the top of the bus stairs with a metal fishbowl, collecting car keys."

#### **API CALL 3.6.1: Image Generation**
*   **Endpoint:** `POST .../gemini-3-pro-image-preview:generateContent`
*   **Context Stack:**
    *   `Img_Scene_3_v2` (Bus stairs context)
*   **Prompt:**
    > **Scene:** Top of the bus stairs.
    > **Subject:** An older woman (Pfizer's Mom), dressed like she came from a casino (sequins/glitter).
    > **Action:** Holding a metal fishbowl filled with car keys.
    > **Continuity:** Stairs and bus interior lighting must match previous scenes.
*   **Output:** `Img_Scene_6`.

---

### **SCENE 7: The Shoe Tie (Narrator Hiding)**
*   **Narrative:** "I pretended to be tying my shoe... Converse were already tied. Double-knotted."

#### **API CALL 3.7.1: Image Generation**
*   **Endpoint:** `POST .../gemini-3-pro-image-preview:generateContent`
*   **Context Stack:**
    *   `Ref_Narrator_Front`
    *   `Img_Scene_1` (Location context)
*   **Prompt:**
    > **Scene:** Narrator crouching on the asphalt.
    > **Action:** Faking tying a shoe. Hands shaking.
    > **Detail:** Close up on Converse sneakers. They are ALREADY double-knotted.
    > **Attire:** Skinny jeans, tight.
    > **Continuity:** Match Narrator Reference.
*   **Output:** `Img_Scene_7`.

---

### **SCENE 8: "Hey" (Johnson & Johnson)**
*   **Narrative:** "There she was, standing three feet away, sucking on a Starbucks straw like it owed her money."

#### **API CALL 3.8.1: Image Generation**
*   **Endpoint:** `POST .../gemini-3-pro-image-preview:generateContent`
*   **Context Stack:**
    *   `Ref_Johnson_Front`
    *   `Img_Scene_7` (Narrator's POV context)
*   **Prompt:**
    > **Scene:** Low angle POV (from crouching Narrator).
    > **Subject:** Johnson & Johnson looming over.
    > **Action:** Sucking on a Starbucks straw judgmentally. Leaning on one hip.
    > **Attire:** Trendy 2000s fashion.
    > **Continuity:** MATCH JOHNSON REFERENCE EXACTLY.
*   **Output:** `Img_Scene_8`.

---

### **SCENE 10: The Vanishing Bus**
*   **Narrative:** "The bus, meanwhile, had mysteriously disappeared. Just gone."

#### **API CALL 3.10.1: Image Generation**
*   **Endpoint:** `POST .../gemini-3-pro-image-preview:generateContent`
*   **Context Stack:**
    *   `Img_Scene_2` (The Bus location)
    *   `Img_Scene_9` (Previous frame)
*   **Prompt:**
    > **Scene:** The exact spot where the bus was.
    > **Action:** EMPTY. Just asphalt and morning haze.
    > **Atmosphere:** Eerie, confusing.
    > **Continuity:** Match the background of Scene 2 EXACTLY, but remove the bus.
*   **Output:** `Img_Scene_10`.

---

## **PHASE 4: THE MOTION (Video Generation)**

### **API CALL 4.1: Scene 3 Video (Pfizer Entrance)**
*   **Endpoint:** `POST .../veo-3.1-generate-preview:generateVideo`
*   **Input:**
    *   `image`: `Img_Scene_3_v2` (Start Frame).
    *   `prompt`: "Pfizer steps down the stairs with confidence. Wind blows her hair. Camera tracks backwards."
    *   **Reference Images:**
        *   `Ref_Pfizer_Front` (Face Lock)
        *   `Ref_Pfizer_Side` (Geometry Lock)
        *   `Img_Scene_2` (Bus Context)
*   **Output:** `Video_Scene_3.mp4`.

### **API CALL 4.2: Scene 10 Video (The Vanishing)**
*   **Endpoint:** `POST .../veo-3.1-generate-preview:generateVideo`
*   **Input:**
    *   `image`: `Img_Scene_9` (J&J talking).
    *   `prompt`: "Camera pans quickly to the left to reveal the bus is GONE. Empty space."
    *   **Reference Images:**
        *   `Img_Scene_2` (The Bus - so Veo knows what *was* there to emphasize its absence).
*   **Output:** `Video_Scene_10.mp4`.

---

**TOTAL API CALLS ESTIMATE:**
*   **Brain:** 1 (Bible) + 12 (Turnarounds) = 13
*   **Blueprint:** 1 (Decomposition)
*   **Production:** 23 Scenes * (1 Gen + 1 Validation + 0.5 Retry) = ~46 Calls
*   **Motion:** 23 Videos
*   **GRAND TOTAL:** ~83 API Calls for Chapter One.

**CONTEXT SATURATION STATUS:**
*   Every image generation has **at least 3 reference images**.
*   Every prompt has **World State** injected.
*   Every edit has **Thought Signatures**.
*   Every video has **Character References**.
