import { CanonicalEntry, CANONICAL_UNIVERSES } from "./canonicalUniverseDatabase";
import { GeminiService } from "../ai/gemini.service";

export type UniverseAtmosphere = {
  gradient: string;
  glow: string;
  accent: string;
  particlesColor: string;
  themeClass: string;
  soundAtmosphere: string;
};

export type StoryArc = {
  id: string;
  name: string;
  description: string;
  entries: string[]; // Canonical entry IDs
  emotionalCurve: string[];
};

export type CharacterIntroduction = {
  id: string;
  name: string;
  role: string;
  quote: string;
  visualEffect: "lightning" | "shadow" | "cosmic" | "chakra" | "hyperspace";
  entryTrigger: string;
  description: string;
  alignment: "Hero" | "Anti-Hero" | "Villain";
  relationships: string;
  timelineSignificance: string;
  avatarUrl: string;
};

export type EmotionalPhase = {
  phase: string;
  title: string;
  description: string;
  intensity: number; // 1-100 scale
};

export type UniverseExploreData = {
  id: string;
  name: string;
  atmosphere: UniverseAtmosphere;
  heroText: string;
  heroSubtext: string;
  storyArcs: StoryArc[];
  characterIntroductions: CharacterIntroduction[];
  emotionalProgression: EmotionalPhase[];
};

const marvelExploreData: UniverseExploreData = {
  id: "marvel",
  name: "Marvel",
  atmosphere: {
    gradient: "linear-gradient(135deg, rgba(229,9,20,0.15) 0%, rgba(5,6,9,0.95) 100%)",
    glow: "rgba(229,9,20,0.25)",
    accent: "#e50914",
    particlesColor: "#ff4d4d",
    themeClass: "marvel-cosmic",
    soundAtmosphere: "Heroic Orchestral / Brass Resonance"
  },
  heroText: "The Marvel Multiverse",
  heroSubtext: "Travel through cosmic portals, street-level conflicts, and the infinity-spanning timeline of Earth's Mightiest Heroes.",
  storyArcs: [
    {
      id: "infinity-saga",
      name: "The Infinity Saga",
      description: "The decade-spanning search for the six Infinity Stones, uniting heroes from Earth and space to defeat the Mad Titan, Thanos.",
      entries: ["iron-man", "the-avengers", "guardians-of-the-galaxy", "avengers-age-of-ultron", "captain-america-civil-war", "thor-ragnarok", "black-panther", "avengers-infinity-war", "ant-man-and-the-wasp", "avengers-endgame"],
      emotionalCurve: ["Legacy Beginnings", "Rising Threats", "Internal Division", "Cosmic Tragedy", "Ultimate Sacrifice"]
    },
    {
      id: "multiverse-saga",
      name: "The Multiverse Saga",
      description: "The shattering of reality's boundary, leading to alternative universes colliding, temporal anomalies, and new threats.",
      entries: ["spider-man-far-from-home", "spider-man-no-way-home", "loki-season-1", "she-hulk", "hawkeye", "echo", "daredevil-born-again"],
      emotionalCurve: ["Post-Grief Chaos", "Temporal Shattering", "Street-Level Resurgence", "Redemption Quest"]
    },
    {
      id: "civil-war-arc",
      name: "The Avengers Division",
      description: "A fracture in trust, leading to superhero registration, personal vendettas, and the break-up of the Avengers before the Infinity War.",
      entries: ["captain-america-civil-war", "spider-man-homecoming", "black-panther"],
      emotionalCurve: ["Moral Anxiety", "Fractured Trust", "Heroic Sovereignty"]
    }
  ],
  characterIntroductions: [
    {
      id: "iron-man",
      name: "Tony Stark / Iron Man",
      role: "The Emotional Center",
      quote: "I am Iron Man.",
      visualEffect: "cosmic",
      entryTrigger: "A high-tech arc reactor ignites the dark screen, casting red and gold light.",
      description: "Evolves from a selfish weapons designer into the sacrificial heart of the entire universe.",
      alignment: "Hero",
      relationships: "Mentor to Peter Parker, tense brotherly bond with Steve Rogers.",
      timelineSignificance: "Initiated the superhero era and eventually snapped Thanos out of existence.",
      avatarUrl: "/assets/characters/iron-man.png"
    },
    {
      id: "captain-america",
      name: "Steve Rogers / Captain America",
      role: "The Moral Compass",
      quote: "I can do this all day.",
      visualEffect: "shadow",
      entryTrigger: "A vibraphone-glowing vibranium shield emerges from a dark fog.",
      description: "A man out of time, whose unwavering moral core guides the Avengers through corrupt organizations and intergalactic threats.",
      alignment: "Hero",
      relationships: "Protective friend of Bucky Barnes, leader of the Avengers.",
      timelineSignificance: "Led the resistance during Civil War and the final charge against Thanos.",
      avatarUrl: "/assets/characters/captain-america.png"
    },
    {
      id: "thor",
      name: "Thor Odinson",
      role: "The Cosmic Power",
      quote: "Bring me Thanos!",
      visualEffect: "lightning",
      entryTrigger: "Lightning strikes the screen in a slow-motion shockwave, crackling across the frame.",
      description: "The God of Thunder who loses his home, his family, and his eye, yet finds the strength to forge Stormbreaker and fight on.",
      alignment: "Hero",
      relationships: "Complicated sibling rivalry with Loki, ally to the Hulk.",
      timelineSignificance: "Bypassed the Bifrost to join the Wakanda battle, nearly stopping Thanos.",
      avatarUrl: "/assets/characters/thor.png"
    },
    {
      id: "daredevil",
      name: "Matt Murdock / Daredevil",
      role: "The Street-Level Defender",
      quote: "I'm not trying to be a hero. I'm just a man who's fed up.",
      visualEffect: "shadow",
      entryTrigger: "Crimson rain drips over a church altar in Hell's Kitchen, outlining a masked silhouette.",
      description: "A blind lawyer by day and vigilante by night, fighting for the soul of Hell's Kitchen while battling his own faith.",
      alignment: "Hero",
      relationships: "Arch-enemy of Wilson Fisk, ally to Elektra and Foggy Nelson.",
      timelineSignificance: "Maintains the street-level continuity that bridges into the Born Again era.",
      avatarUrl: "/assets/characters/daredevil.png"
    }
  ],
  emotionalProgression: [
    { phase: "Phase 1", title: "The Spark of Hope", description: "Beginning of the saga. Excitement, new discoveries, and setting up alliances.", intensity: 35 },
    { phase: "Phase 2", title: "Fractured Trust", description: "Internal divisions, ideological clashes, and a sense of growing cosmic helplessness.", intensity: 70 },
    { phase: "Phase 3", title: "The Cosmic Defeat", description: "Shattered hopes, universal loss, and the slow, heavy process of grieving in a snapped world.", intensity: 95 },
    { phase: "Phase 4", title: "Legacy & Rebirth", description: "Tribute to fallen leaders, entering a complex and dangerous multiverse, and finding new purpose.", intensity: 65 }
  ]
};

const dcExploreData: UniverseExploreData = {
  id: "dc",
  name: "DC",
  atmosphere: {
    gradient: "linear-gradient(135deg, rgba(14,116,144,0.15) 0%, rgba(5,6,9,0.95) 100%)",
    glow: "rgba(14,116,144,0.25)",
    accent: "#0e7490",
    particlesColor: "#22d3ee",
    themeClass: "dc-gothic",
    soundAtmosphere: "Gothic Orchestral / Dark Ambient String Melancholy"
  },
  heroText: "The Dark Knight Trilogy",
  heroSubtext: "Step into Christopher Nolan's grounded Gotham City. Explore the psychological depth of fear, chaos, and absolute legacy.",
  storyArcs: [
    {
      id: "knight-ascent",
      name: "The Legend of the Bat",
      description: "Bruce Wayne's evolution from a traumatized orphan into Gotham's protector, battling Ra's al Ghul, the Scarecrow, and the league of shadows.",
      entries: ["batman-begins"],
      emotionalCurve: ["Traumatic Grief", "Mastering Fear", "Vigilante Justice"]
    },
    {
      id: "gotham-chaos",
      name: "The Brink of Chaos",
      description: "Gotham's moral code is pushed to its absolute limits by the Joker's nihilistic reign, leading to tragic losses and dark sacrifices.",
      entries: ["the-dark-knight"],
      emotionalCurve: ["Escalating Fear", "Nihilistic Terror", "Moral Tragedy"]
    },
    {
      id: "knight-rebirth",
      name: "The Fire Rises",
      description: "Eight years after the Joker, Bruce Wayne must emerge from retirement to save Gotham from Bane's physical and revolutionary destruction.",
      entries: ["the-dark-knight-rises"],
      emotionalCurve: ["Broken Spirit", "Physical Descent", "Rebirth & Legacy"]
    }
  ],
  characterIntroductions: [
    {
      id: "batman-begins",
      name: "Bruce Wayne / Batman",
      role: "The Knight of Fear",
      quote: "It's not who I am underneath, but what I do that defines me.",
      visualEffect: "shadow",
      entryTrigger: "Swarms of black bats gather to form a caped silhouette in the gothic night.",
      description: "Uses his childhood fear of bats as a weapon against the criminal underworld, sacrificing his personal life for Gotham.",
      alignment: "Hero",
      relationships: "Guided by Alfred Pennyworth, ally to James Gordon.",
      timelineSignificance: "Established the grounded, realistic standard for vigilantes.",
      avatarUrl: "/assets/characters/batman.png"
    },
    {
      id: "joker",
      name: "The Joker",
      role: "The Agent of Chaos",
      quote: "Why so serious?",
      visualEffect: "shadow",
      entryTrigger: "A single playing card flips slowly in the air, landing to reveal a scarred, painted face.",
      description: "A psychopathic, nihilistic force of nature who seeks to prove that anyone can be pushed into madness.",
      alignment: "Villain",
      relationships: "Obsessive psychological mirror to Batman.",
      timelineSignificance: "Shattered Bruce Wayne's dream of an orderly Gotham and caused the death of Rachel Dawes.",
      avatarUrl: "/assets/characters/joker.png"
    },
    {
      id: "bane",
      name: "Bane",
      role: "The Revolutionary Brute",
      quote: "Ah, you think darkness is your ally.",
      visualEffect: "lightning",
      entryTrigger: "Heavy concrete footsteps crash in slow motion, accompanied by a muffled voice behind a metallic mask.",
      description: "A member of the League of Shadows with unmatched strength and tactical intellect, bent on completing Ra's al Ghul's work.",
      alignment: "Villain",
      relationships: "Protector of Talia al Ghul.",
      timelineSignificance: "Physically broke Batman, took over Gotham, and forced the final rebirth of the Dark Knight.",
      avatarUrl: "/assets/characters/bane.png"
    }
  ],
  emotionalProgression: [
    { phase: "Phase 1", title: "Conquering Fear", description: "Bruce Wayne confronts his inner demons, faces the League of Shadows, and establishes his symbol.", intensity: 45 },
    { phase: "Phase 2", title: "Nihilism & Grief", description: "The Joker tears down the city's structure, bringing heartbreak, sacrifice, and the death of Gotham's White Knight.", intensity: 90 },
    { phase: "Phase 3", title: "The Pit & Rebirth", description: "Batman is physically broken and thrown into the Pit. He must find the will to climb out and save a burning city.", intensity: 100 }
  ]
};

const starWarsExploreData: UniverseExploreData = {
  id: "star-wars",
  name: "Star Wars",
  atmosphere: {
    gradient: "linear-gradient(135deg, rgba(30,58,138,0.15) 0%, rgba(5,6,9,0.95) 100%)",
    glow: "rgba(30,58,138,0.25)",
    accent: "#1e3a8a",
    particlesColor: "#60a5fa",
    themeClass: "starwars-galactic",
    soundAtmosphere: "Epic Space Opera / Choir / Lightsaber Hum"
  },
  heroText: "The Galactic Chronicles",
  heroSubtext: "Dive into a galaxy far, far away. Trace the balance of the Force, the rebellion against the Empire, and the journeys of lone warriors.",
  storyArcs: [
    {
      id: "original-trilogy",
      name: "The Rebellion's Spark",
      description: "Luke Skywalker's journey from a farm boy to a Jedi Knight as he helps the Rebel Alliance dismantle the Galactic Empire and redeem his father.",
      entries: ["star-wars-a-new-hope", "the-empire-strikes-back", "return-of-the-jedi"],
      emotionalCurve: ["Mythic Awakening", "Devastating Truth", "Redemption & Peace"]
    },
    {
      id: "new-republic",
      name: "The Outer Rim Frontier",
      description: "Following the fall of the Empire, a lone Mandalorian bounty hunter protects a mysterious child while remnants of imperial forces plot their return.",
      entries: ["the-mandalorian", "ahsoka"],
      emotionalCurve: ["Found Family Bond", "Imperial Resurgence"]
    }
  ],
  characterIntroductions: [
    {
      id: "luke-skywalker",
      name: "Luke Skywalker",
      role: "The Hope of the Jedi",
      quote: "I am a Jedi, like my father before me.",
      visualEffect: "cosmic",
      entryTrigger: "A blue lightsaber ignites in the darkness, humming with cosmic power.",
      description: "A farmboy who rises to become the legendary Jedi who saved the galaxy by refusing to fight his father in anger.",
      alignment: "Hero",
      relationships: "Son of Anakin Skywalker, trained by Obi-Wan Kenobi and Master Yoda.",
      timelineSignificance: "Destroyed the first Death Star and redeemed Darth Vader, restoring balance to the Force.",
      avatarUrl: "/assets/characters/luke-skywalker.png"
    },
    {
      id: "darth-vader",
      name: "Darth Vader / Anakin",
      role: "The Tragedy of the Force",
      quote: "No, I am your father.",
      visualEffect: "shadow",
      entryTrigger: "Heavy, mechanical breathing echoes in a smoke-filled corridor, followed by the hiss of a crimson lightsaber.",
      description: "A tragic hero who fell to the dark side out of fear of loss, becoming the Emperor's enforcer before sacrificing himself to save his son.",
      alignment: "Villain",
      relationships: "Apprentice to Emperor Palpatine, father of Luke and Leia.",
      timelineSignificance: "Enforced the Empire's grip on the galaxy, but ultimately fulfilled the prophecy of the Chosen One.",
      avatarUrl: "/assets/characters/darth-vader.png"
    },
    {
      id: "the-mandalorian",
      name: "Din Djarin / The Mandalorian",
      role: "The Reluctant Protector",
      quote: "This is the Way.",
      visualEffect: "hyperspace",
      entryTrigger: "A shining beskar helmet slowly turns in the galactic starlight, reflecting distant nebulae.",
      description: "A Mandalorian bounty hunter whose life changes forever when he is hired to find Grogu, choosing to protect him instead.",
      alignment: "Hero",
      relationships: "Adoptive father to Grogu, ally to Bo-Katan and Ahsoka Tano.",
      timelineSignificance: "United various factions on Mandalore and helped rebuild the outer rim.",
      avatarUrl: "/assets/characters/mandalorian.png"
    }
  ],
  emotionalProgression: [
    { phase: "Phase 1", title: "Galactic Calling", description: "Discovering a wider universe, learning the ways of the Force, and achieving initial victory.", intensity: 40 },
    { phase: "Phase 2", title: "The Darkest Revelation", description: "Facing defeats, losing mentors, and confronting the horrifying truth about family legacy.", intensity: 85 },
    { phase: "Phase 3", title: "Redemption & Triumph", description: "Refusing to yield to hatred, saving a fallen father, and celebrating freedom across the galaxy.", intensity: 95 }
  ]
};

const animeExploreData: UniverseExploreData = {
  id: "naruto",
  name: "Naruto",
  atmosphere: {
    gradient: "linear-gradient(135deg, rgba(234,88,12,0.15) 0%, rgba(5,6,9,0.95) 100%)",
    glow: "rgba(234,88,12,0.25)",
    accent: "#ea580c",
    particlesColor: "#f97316",
    themeClass: "naruto-chakra",
    soundAtmosphere: "Traditional Japanese Flute / Epic Orchestral Choir / Rasengan Hum"
  },
  heroText: "The Shinobi Chronicles",
  heroSubtext: "Walk the path of ninjas, from lonely outcasts to legendary Hokages. Experience the bonds, sacrifices, and cycle of pain in the shinobi world.",
  storyArcs: [
    {
      id: "shinobi-origins",
      name: "The Lone Outcast",
      description: "Naruto Uzumaki's early days as an orphan seeking recognition in the Leaf Village, culminating in his battle against Sasuke at the Valley of the End.",
      entries: ["naruto"],
      emotionalCurve: ["Deep Isolation", "Unbreakable Bonds", "The Great Fracture"]
    },
    {
      id: "akatsuki-threat",
      name: "The Akatsuki Rising",
      description: "A time-skip brings older, stronger foes. Naruto must train under Jiraiya to face the Akatsuki organization seeking the Nine-Tailed Beast.",
      entries: ["naruto-shippuden"],
      emotionalCurve: ["Return & Hopes", "Tragic Losses", "Ultimate Confrontation"]
    },
    {
      id: "pain-arc",
      name: "The Cycle of Pain",
      description: "The devastating assault on Konoha by Pain, forcing Naruto to master Sage Mode and find a way to break the generational cycle of hatred.",
      entries: ["naruto-pain-arc"],
      emotionalCurve: ["Devastating Grief", "Sage Mastery", "Philosophical Dialogue"]
    },
    {
      id: "next-generation",
      name: "The Next Generation",
      description: "A peaceful world achieved by Naruto's generation is explored through his son, Boruto, as new scientific ninja tools and ancient Otsutsuki threats emerge.",
      entries: ["boruto"],
      emotionalCurve: ["Peaceful Friction", "New Threats", "Passing the Torch"]
    }
  ],
  characterIntroductions: [
    {
      id: "naruto",
      name: "Naruto Uzumaki",
      role: "The Unyielding Shinobi",
      quote: "I'm not gonna run away, I never go back on my word! That's my nindo: my ninja way!",
      visualEffect: "chakra",
      entryTrigger: "Swirling orange chakra fire envelops the screen, condensing into a determination-filled face.",
      description: "Begins as a hated, lonely host of the Nine-Tails and grows into the beloved Hero of the Leaf Village and Seventh Hokage.",
      alignment: "Hero",
      relationships: "Rival and brother to Sasuke, student of Jiraiya and Kakashi.",
      timelineSignificance: "Defeated Pain, brought Sasuke back, and united the Shinobi Alliance to achieve world peace.",
      avatarUrl: "/assets/characters/naruto.png"
    },
    {
      id: "sasuke",
      name: "Sasuke Uchiha",
      role: "The Shadow Defender",
      quote: "I'm going to the battlefield... I won't let this village and my brother be wasted.",
      visualEffect: "lightning",
      entryTrigger: "Chidori lightning screeches like a thousand birds in a pitch-black frame, lighting up red sharingan eyes.",
      description: "Driven by revenge to destroy his brother and later the Leaf Village, before Naruto's bond finally saves him, turning him into Konoha's protector.",
      alignment: "Anti-Hero",
      relationships: "Brother of Itachi Uchiha, rival to Naruto.",
      timelineSignificance: "Key fighter in the Fourth Great Ninja War and partner to Naruto in defending the new peace.",
      avatarUrl: "/assets/characters/sasuke.png"
    },
    {
      id: "pain",
      name: "Pain / Nagato",
      role: "The Philosopher of Hatred",
      quote: "Those who do not know true pain can never know true peace.",
      visualEffect: "chakra",
      entryTrigger: "Rinnegan eyes ripple across the screen as rain falls on a grey skyline.",
      description: "Leader of the Akatsuki who believes the only way to end human conflict is through the threat of mutual destruction and shared pain.",
      alignment: "Villain",
      relationships: "Former student of Jiraiya, like Naruto.",
      timelineSignificance: "Completely destroyed Konoha and killed Jiraiya, forcing Naruto's philosophical growth.",
      avatarUrl: "/assets/characters/pain.png"
    }
  ],
  emotionalProgression: [
    { phase: "Phase 1", title: "Outcast's Struggle", description: "Loneliness, graffiti on monuments, but finding friends and an unbreakable will.", intensity: 30 },
    { phase: "Phase 2", title: "Bonds Broken", description: "Sasuke leaves the village, leaving Naruto and friends struggling with weakness and determination.", intensity: 65 },
    { phase: "Phase 3", title: "Grief & Philosophical Awakening", description: "Jiraiya's death, Konoha's destruction, and the heavy realization of what it takes to break the cycle of hate.", intensity: 100 },
    { phase: "Phase 4", title: "The Legacy of Peace", description: "Becoming the Hero of the Leaf, war resolution, and passing the torch to a new, peaceful generation.", intensity: 60 }
  ]
};

export const ExploreService = {
  getUniverseData: (id: string): UniverseExploreData | undefined => {
    switch (id.toLowerCase()) {
      case "marvel":
        return marvelExploreData;
      case "dc":
        return dcExploreData;
      case "star-wars":
      case "starwars":
        return starWarsExploreData;
      case "naruto":
      case "anime":
        return animeExploreData;
      default:
        return undefined;
    }
  },

  getUniverseList: () => {
    return [
      { id: "marvel", name: "Marvel", accent: "#e50914", gradient: "from-[#e50914]/25 to-transparent", bgUrl: "https://image.tmdb.org/t/p/w1280/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg" },
      { id: "dc", name: "DC", accent: "#0e7490", gradient: "from-[#0e7490]/25 to-transparent", bgUrl: "https://image.tmdb.org/t/p/w1280/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg" },
      { id: "star-wars", name: "Star Wars", accent: "#1e3a8a", gradient: "from-[#1e3a8a]/25 to-transparent", bgUrl: "https://image.tmdb.org/t/p/w1280/yUiXA68FfQeA8cRBhd0Ao0jIRZt.jpg" },
      { id: "naruto", name: "Naruto / Anime", accent: "#ea580c", gradient: "from-[#ea580c]/25 to-transparent", bgUrl: "https://image.tmdb.org/t/p/w1280/A6tMQAo6t6eRFCPhsrShmxZLqFB.jpg" }
    ];
  },

  generateAiStorylineIntelligence: async (query: { universe: string; focus: string }): Promise<any> => {
    try {
      const prompt = `You are CineScope's premium cinematic story intelligence engine.
Based on the universe "${query.universe}" and the focal point "${query.focus}", generate a highly polished, deep narrative analysis.
Focus on character development, emotional arcs, and connection to the broader timeline.
Keep it extremely immersive and written in a premium streaming review style.

Return ONLY a valid JSON object in this exact shape:
{
  "summary": "one concise cinematic paragraph summing up the core story evolution",
  "characterEvolutions": [
    {
      "character": "Name of character",
      "transformation": "one sentence describing their overall change",
      "keyTurningPoint": "the event that changed them"
    }
  ],
  "emotionalMilestones": [
    {
      "milestone": "Short milestone name",
      "impact": "description of the emotional impact on the viewer"
    }
  ],
  "timelineSignificance": "one sentence explaining why this focal point is critical to the franchise's continuity"
}`;

      const aiResponse = await GeminiService.generateCanonicalRoadmap(prompt);
      return aiResponse;
    } catch (error) {
      // Fallback response in case Gemini API is offline or has issues
      return {
        summary: `The story arc of ${query.focus} represents a pivotal moment in the ${query.universe} universe, merging personal stakes with world-altering consequences that redefine the characters' journeys.`,
        characterEvolutions: [
          {
            character: query.focus,
            transformation: "Evolves from a struggle for individual identity into accepting a broader, legendary responsibility.",
            keyTurningPoint: "Confronting their deepest fear in the face of absolute loss."
          }
        ],
        emotionalMilestones: [
          {
            milestone: "Acceptance of Legacy",
            impact: "A deep, bittersweet transition that leaves a lasting emotional mark on the entire saga."
          }
        ],
        timelineSignificance: `This connection serves as the anchor point that binds the early origins of ${query.universe} to its ultimate, high-stakes resolution.`
      };
    }
  }
};
