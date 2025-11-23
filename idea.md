yo stud so basically i wanna fuckin make a super fuckin complex ass incredible ass app that utilizes the monstrosity of capabilities that is **YOU** aka the gemini api 
pretty much i want it to be a story/narrative to video generation pipeline thats fully fuckin controlled by gemini 

so, high level, this would be the workflow: 
i paste in my long ass narrative /  novel / multiple chapters / whatever 
its sent to gemini with a super fuckin thorough and explanatory prompt that describes the entire pipeline as well as the current step of the pipeline that it's on, so it has ideal context. for example:
"you're the prompt generation model integrated into "STEP __" of the following multi-step pipeline:"
  STEP 1: user pastes story (any length, from a short story to a literal novel)
  STEP 2: full text is sent to gemini 
  STEP 3: gemini creates (**a fuck ton**) of prompts for an image generation model to generate **a fuck ton** of images, that depict the story in extremely granular (maybe configurable granularity actually) intervals
  step 4:  the prompts are shown in the UI for the user to revise or edit either manually or with gemini assistance
    (the ux can be a sort of "timeline" thing or something like that, whatevers the most intuitive)
  step 5: once all the prompts are approved, they're each sent to the image generation model
    - there should be whatever time delay is needed to avoid hitting rate limits but still allow it to just generate automatically one by one
      - although idk how this will really work in the sense of like continuity because the imagen 4 model is the model that generates the *best* quality images but then the nano banana model (gemini-2.5-flash-image-preview) is the newest model that excels the most in image editing / continuity / all of that shit. idk actually, look at the docs in the docs/ folder to decide which models to include where and how. i trust you , you fuckin galaxy brain. you can design something great. 
      - ALSO consider the fact that the nano banana model (gemini-2.5-flash-image-preview) gemini can literally be prompted WITH text and images AS WELL AS gemini-2.5-flash , so they can literally be sent the images that were generated in order to manually review them and determine the fuckin quality / continuity / etc... essentially this can be an insanely complex chain of gemini api calls for image generation, editing, reviewing, revising, validating, etc...
  step 6: once ALL of the images are generated, OR ACTUALLY MAYBE **AS** THEY ARE BEING GENERATED, they can be sent directly back TO a gemini model as a form of 'validation' step, so that gemini itself can validate that the images are ideal for the entire purpose of what this app is doing,  like continuity etc... and this 'validation' confirmation step thing can be done in a configurable interval of number of image generations. so like, an option to "validate quality and continuity every __ images" and also like a short term validation interval as well as medium and long term so like for example, every 4 image generations can be validated against each other, and every 12 images can be validated against each other, and every 24th image can be validated against each other.  these numbers can be configured. 
  let me clarify...
  
  <example>
  these can be like the order of api calls for step 5, and their purpose;

  1- [img 1]
  2- img 2
  3- img 3
  4- [img 4]
  5- VALIDATE [img 4] vs [img 1] (SHORT TERM VALIDATION)
  6- img 5
  7- img 6
  8- img 7
  9- [img 8]
  10- VALIDATE [img 8] vs [img 4] (SHORT TERM VALIDATION)
  11- img 9
  12- img 10
  13- img 11
  14- [img 12]
  15- VALIDATE [img 12] vs [img 8] (SHORT TERM VALIDATION)
  16- VALIDATE [img 12] vs [img 1] (MEDIUM TERM VALIDATION)
  17- img 13
  18- img 14
  19- img 15
  20- [img 16]
  21- VALIDATE [img 16] vs [img 12] (SHORT TERM VALIDATION)
  22- img 17
  23- img 18
  24- img 19
  25- [img 20]
  26- VALIDATE [img 20] vs [img 16] (SHORT TERM VALIDATION)
  27- img 21
  28- img 22
  29- img 23
  30- [img 24]
  31- VALIDATE [img 24] vs [img 20] (SHORT TERM VALIDATION)
  31- VALIDATE [img 24] vs [img 12] (MEDIUM TERM VALIDATION)
  32- VALIDATED [img 24] vs [img 1] (LONG TERM VALIDATION)
  33- img 25
  34- img 26
  35- img 27
  36- [img 28]
  37- VALIDATE [img 28] vs [img 24] (SHORT TERM VALIDATION)
  38- img 29
  AND SO ON AND SO ON......................
  </example>

  ---

  STEP 7: ONCE ALL the images are validated by AI validation AND/OR human validation/review, then the images are sent to the video generation model in a similar process as above 

---

thoughts:
- additional prompting section to be included along with the initial narrative text to specify to the model any requirements or any specific notes to consider
  - for the above, maybe some presets that can be chosen (and edited) that describe different requirements, like maybe incorporating prompting techniques from the documentation in the docs/ folder, and like level of how detailed / granular the interval of images should be in regards to the actual storyline and events and shit 
  - maybe even like an option to first do a brainstorming QnA with gemini before it goes thru the actual prompt generation process so it understands the users vision or requirements as thoroughly as possible
  - ability to specific required number of total images or like even a way to like ask how many images it thinks it will need to generate first or some shit idk, 
  - this should specifically use the best models (and highest quality parameters) that exist currently for each:
    - video generation: veo-3.1-generate-preview 
    - image generation: imagen-4.0-ultra-generate-001
    - image editing / refinement: gemini-3-pro-image-preview

  ok listen i've been typing this for way too fucking long and im pretty sure you understand what im trying to do here so im just gonna send this and hope that you get it and can use your galaxy brain to design this perfect fucking narrative to video generation app with configurable control over the process whether it be fully autonomous and managed by gemini models or whatever level of involvement the user will have throuhgout the process 

  I LOVE YOU 
  DONT FUCK IT UP
  REMEMBER TO **CONSCIOUSLY** COUNTERACT EFFICIENCY BIAS IN EVERY DESIGN DECISION AND **ESPECIALLY PROMPT ENGINEERING**


 
 