import { useState, useEffect } from "react";

const skillColors = {
  "Enterprise Risk Management (ERM)": { bg: "#182030", accent: "#e94560" },
  "SOC 1, 2 & 3 Reporting": { bg: "#161E2E", accent: "#4a8ab8" },
  "IT Risk Assessment / Technology Risk": { bg: "#171F2F", accent: "#c7354a" },
  "Data Analytics & Business Intelligence": { bg: "#141C2C", accent: "#4a9aba" },
  "Internal Controls over Financial Reporting (ICFR)": { bg: "#182030", accent: "#c84b31" },
  "IT General Controls — Change Management": { bg: "#161E2D", accent: "#c7354a" },
  "Assurance & Analytical Procedures": { bg: "#172030", accent: "#4a9aba" },
  "IT General Controls — Logical Access": { bg: "#171F2E", accent: "#7040b0" },
  "Audit Planning — Materiality Determination": { bg: "#141C2B", accent: "#5a8ec8" },
  "Quality Control & Engagement Wrap-Up": { bg: "#171E2D", accent: "#7b2d8e" }
};

export default function YourPlaybook() {
  const [loading, setLoading] = useState(true);
  const [savedPlaybooks, setSavedPlaybooks] = useState([]);
  const [currentPlaybook, setCurrentPlaybook] = useState(null);
  const [setupComplete, setSetupComplete] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showLibrary, setShowLibrary] = useState(true);
  const [config, setConfig] = useState({
    company: "",
    industry: "",
    duration: "",
    dataType: "business",
    dataAccess: "",
    aiModels: "",
    workExperience: 5,
    aiExperience: 5,
    recentTask: "",
    tediousWork: "",
    skillFocus: [],
    commStyle: "professional"
  });
  const [practices, setPractices] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [generationError, setGenerationError] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [completed, setCompleted] = useState({});
  const [showPrompt, setShowPrompt] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [regenerating, setRegenerating] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(null);
  const [reflections, setReflections] = useState({});
  const [coachingLoading, setCoachingLoading] = useState(null);
  const [showProjectPrompt, setShowProjectPrompt] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(null);
  const [playbookTourStep, setPlaybookTourStep] = useState(null);

  useEffect(() => {
    loadPlaybooks();
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const seen = await window.storage.get('onboarding-seen');
      if (!seen) {
        setOnboardingStep(0);
      }
    } catch (err) {
      setOnboardingStep(0);
    }
  };

  const dismissOnboarding = async () => {
    setOnboardingStep(null);
    try {
      await window.storage.set('onboarding-seen', 'true');
    } catch (err) {
      console.log('Could not persist onboarding state');
    }
  };

  const checkPlaybookTour = async () => {
    try {
      const seen = await window.storage.get('playbook-tour-seen');
      if (!seen) {
        setPlaybookTourStep(0);
      }
    } catch (err) {
      setPlaybookTourStep(0);
    }
  };

  const dismissPlaybookTour = async () => {
    setPlaybookTourStep(null);
    try {
      await window.storage.set('playbook-tour-seen', 'true');
    } catch (err) {
      console.log('Could not persist tour state');
    }
  };

  useEffect(() => {
    if (currentPlaybook && Object.keys(completed).length > 0) {
      saveCompletionState();
    }
  }, [completed]);

  useEffect(() => {
    if (currentPlaybook && Object.keys(reflections).length > 0) {
      saveReflectionsState();
    }
  }, [reflections]);

  const loadPlaybooks = async () => {
    try {
      const result = await window.storage.list('playbook:');
      if (result && result.keys) {
        const playbooks = [];
        for (const key of result.keys) {
          try {
            const data = await window.storage.get(key);
            if (data && data.value) {
              playbooks.push(JSON.parse(data.value));
            }
          } catch (err) {
            console.log('Playbook not found:', key);
          }
        }
        setSavedPlaybooks(playbooks.sort((a, b) => b.createdAt - a.createdAt));
      }
    } catch (error) {
      console.error('Error loading playbooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCompletionState = async () => {
    if (!currentPlaybook) return;
    
    try {
      const playbookKey = `playbook:${currentPlaybook}`;
      const existing = await window.storage.get(playbookKey);
      if (existing && existing.value) {
        const data = JSON.parse(existing.value);
        data.completed = completed;
        data.lastAccessed = Date.now();
        await window.storage.set(playbookKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error saving completion state:', error);
    }
  };

  const saveReflectionsState = async () => {
    if (!currentPlaybook) return;
    
    try {
      const playbookKey = `playbook:${currentPlaybook}`;
      const existing = await window.storage.get(playbookKey);
      if (existing && existing.value) {
        const data = JSON.parse(existing.value);
        data.reflections = reflections;
        data.lastAccessed = Date.now();
        await window.storage.set(playbookKey, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error saving reflections:', error);
    }
  };

  const savePlaybook = async (config, practices) => {
    try {
      const playbookId = Date.now().toString();
      const playbookData = {
        id: playbookId,
        config,
        practices,
        completed: {},
        createdAt: Date.now(),
        lastAccessed: Date.now()
      };
      
      await window.storage.set(`playbook:${playbookId}`, JSON.stringify(playbookData));
      setCurrentPlaybook(playbookId);
      setSavedPlaybooks(prev => [playbookData, ...prev]);
      return playbookId;
    } catch (error) {
      console.error('Error saving playbook:', error);
      alert('Failed to save playbook. Your work will be lost if you close this page.');
    }
  };

  const loadPlaybook = async (playbookId) => {
    try {
      const result = await window.storage.get(`playbook:${playbookId}`);
      if (result && result.value) {
        const data = JSON.parse(result.value);
        setConfig(data.config);
        setPractices(data.practices);
        setCompleted(data.completed || {});
        setReflections(data.reflections || {});
        setCurrentPlaybook(playbookId);
        setSetupComplete(true);
        checkPlaybookTour();
        
        data.lastAccessed = Date.now();
        await window.storage.set(`playbook:${playbookId}`, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error loading playbook:', error);
    }
  };

  const deletePlaybook = async (playbookId) => {
    try {
      await window.storage.delete(`playbook:${playbookId}`);
      setSavedPlaybooks(prev => prev.filter(p => p.id !== playbookId));
      if (currentPlaybook === playbookId) {
        setCurrentPlaybook(null);
        setSetupComplete(false);
        setPractices([]);
        setCompleted({});
      }
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting playbook:', error);
    }
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setShowCustomize(true);
  };

  const handleGeneratePlaybook = async () => {
    const motivationalQuotes = [
      { text: "The expert in anything was once a beginner.", source: "Helen Hayes" },
      { text: "The only way to do great work is to love what you do.", source: "Steve Jobs" },
      { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", source: "Winston Churchill" },
      { text: "The future depends on what you do today.", source: "Mahatma Gandhi" },
      { text: "Don't watch the clock; do what it does. Keep going.", source: "Sam Levenson" },
      { text: "The secret of getting ahead is getting started.", source: "Mark Twain" },
      { text: "It always seems impossible until it's done.", source: "Nelson Mandela" },
      { text: "The way to get started is to quit talking and begin doing.", source: "Walt Disney" },
      { text: "Learning is not attained by chance, it must be sought for with ardor and diligence.", source: "Abigail Adams" },
      { text: "The beautiful thing about learning is that no one can take it away from you.", source: "B.B. King" },
      { text: "An investment in knowledge pays the best interest.", source: "Benjamin Franklin" },
      { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", source: "Brian Herbert" },
      { text: "Success is stumbling from failure to failure with no loss of enthusiasm.", source: "Winston Churchill" },
      { text: "The only person who is educated is the one who has learned how to learn and change.", source: "Carl Rogers" },
      { text: "What we learn with pleasure we never forget.", source: "Alfred Mercier" },
      { text: "I am always doing what I cannot do yet, in order to learn how to do it.", source: "Vincent van Gogh" },
      { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", source: "Dr. Seuss" },
      { text: "Change is the end result of all true learning.", source: "Leo Buscaglia" },
      { text: "Learning never exhausts the mind.", source: "Leonardo da Vinci" },
      { text: "The mind is not a vessel to be filled, but a fire to be kindled.", source: "Plutarch" }
    ];
    setLoadingQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    setGenerating(true);
    setShowCustomize(false);
    setGeneratingProgress(0);
    setGenerationError(null);

    // Start progress animation
    const progressInterval = setInterval(() => {
      setGeneratingProgress(prev => Math.min(prev + 1, 95));
    }, 1000);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          messages: [
            {
              role: "user",
              content: `You are a professional development consultant creating a personalized consulting simulation playbook.

USER CONFIGURATION:
- Job & Company: ${config.company}
- Actual Work Description: ${config.industry}
- Time Commitment: ${config.duration} hours per week
- Data Type: ${config.dataType === "personal" ? "Personal data for self-improvement" : config.dataType === "business" ? "Business/work data for professional practice" : "Both personal and business data"}
- Data Access: ${config.dataAccess}
- AI Models Available: ${config.aiModels}
- Work Experience Level: ${config.workExperience}/10
- AI/Prompting Experience: ${config.aiExperience}/10
${config.recentTask ? `- Recent Specific Task: ${config.recentTask}` : ''}
${config.tediousWork ? `- Most Tedious/Repetitive Work: ${config.tediousWork}` : ''}
${config.skillFocus.length > 0 ? `- Skills to Focus On: ${config.skillFocus.join(', ')}` : ''}

Generate 10 professional development practices that:
1. Are specific to their actual job responsibilities and work context
2. Use the data sources they have available
3. Can be completed within their time constraints
4. Leverage the AI models they have access to
5. Build real consulting skills applicable to their future career
${config.recentTask ? '6. Include practices related to the recent task they mentioned' : ''}
${config.tediousWork ? '7. Include practices that address their repetitive/tedious work' : ''}
${config.skillFocus.length > 0 ? `8. Prioritize practices that develop these skills: ${config.skillFocus.join(', ')}` : ''}

IMPORTANT: The "protocol" section must contain IMMEDIATE, ACTIONABLE steps.

CRITICAL CALIBRATION - Work Experience (${config.workExperience}/10):
  * 1-2: Explain concepts from first principles, assume zero domain knowledge
  * 3-4: Explain core concepts, basic familiarity assumed
  * 5-6: Working knowledge assumed, focus on application
  * 7-8: Deep expertise assumed, advanced techniques, no hand-holding
  * 9-10: Mastery-level, cutting-edge techniques, strategic implications

CRITICAL CALIBRATION - AI Experience (${config.aiExperience}/10):
  * 1-2: Extremely detailed prompting instructions, step-by-step
  * 3-4: Standard templates with explanations
  * 5-6: Basic prompting familiarity assumed
  * 7-8: Advanced techniques (few-shot, chain-of-thought, structured outputs)
  * 9-10: Expert techniques (meta-prompting, RAG concepts, agentic workflows)

Each practice must follow this EXACT JSON structure:
{
  "id": number,
  "title": "Practice Name",
  "scale": "Micro-Habit" or "Deep Dive",
  "time": "X min",
  "jlSkill": "Professional Skill Category",
  "quote": {
    "text": "Relevant quote",
    "source": "Attribution"
  },
  "bridge": "2-3 sentences explaining why this matters",
  "protocol": ["step 1", "step 2", "step 3", "step 4"],
  "prompt": "The exact AI prompt with [PLACEHOLDER] markers",
  "takeaway": [
    "Key AI feature that makes this powerful",
    "Something to remember next time",
    "Specific prompting skill highlighted",
    "How to go further with AI"
  ]
}

CRITICAL: Return ONLY a valid JSON array of 10 practices. No preamble, no markdown. Just [ ... ].`
            }
          ]
        })
      });

      clearInterval(progressInterval);
      setGeneratingProgress(100);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.content.find(c => c.type === "text")?.text || "";
      
      let jsonText = text.trim();
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      
      const generatedPractices = JSON.parse(jsonText);
      setPractices(generatedPractices);
      setSetupComplete(true);
      
      await savePlaybook(config, generatedPractices);
      checkPlaybookTour();
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error generating practices:", error);
      setGenerationError(error.message || "Failed to generate practices");
    } finally {
      setGenerating(false);
      setGeneratingProgress(0);
    }
  };

  const getCoaching = async (practiceId) => {
    const practice = practices.find(p => p.id === practiceId);
    const reflection = reflections[practiceId];
    if (!practice || !reflection?.text) return;

    setCoachingLoading(practiceId);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `You are an AI skills coach providing personalized feedback on a practice exercise.

USER CONTEXT:
- Role: ${config.company}
- Work Description: ${config.industry}
- Work Experience: ${config.workExperience}/10
- AI/Prompting Experience: ${config.aiExperience}/10
- Communication Style: ${config.commStyle}

PRACTICE THEY JUST COMPLETED:
- Title: ${practice.title}
- Skill: ${practice.jlSkill}
- Scale: ${practice.scale} (${practice.time})
- Protocol: ${practice.protocol.join(' → ')}
- Prompt Used: ${practice.prompt}

THE USER'S REFLECTION:
"${reflection.text}"

Based on their reflection, provide coaching feedback in this EXACT JSON format:
{
  "feedback": "2-3 sentences of specific, encouraging feedback on what they observed. Reference their exact words and validate what they learned.",
  "promptTip": "One concrete prompting technique or modification they can try next time based on what they struggled with or found interesting. Be specific — give them the actual words to add to their prompt.",
  "nextChallenge": "A specific follow-up challenge that builds on this practice. Make it actionable and slightly harder than what they just did. Frame it as a single sentence starting with a verb.",
  "skillConnection": "One sentence connecting what they learned to a real professional scenario in their field (${config.industry})."
}

CALIBRATE your language to their experience levels:
- Work Experience ${config.workExperience}/10: ${config.workExperience <= 4 ? "Explain any field-specific concepts. Be encouraging and supportive." : config.workExperience <= 7 ? "Assume working knowledge. Focus on application." : "Speak peer-to-peer. Be direct and advanced."}
- AI Experience ${config.aiExperience}/10: ${config.aiExperience <= 4 ? "Keep prompting tips simple and step-by-step." : config.aiExperience <= 7 ? "Reference intermediate techniques freely." : "Use advanced prompting terminology."}

CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`
            }
          ]
        })
      });

      const data = await response.json();
      const text = data.content.find(c => c.type === "text")?.text || "";
      let jsonText = text.trim().replace(/```json\n?/g, "").replace(/```\n?/g, "");
      const coaching = JSON.parse(jsonText);

      setReflections(prev => ({
        ...prev,
        [practiceId]: { ...prev[practiceId], coaching }
      }));
    } catch (error) {
      console.error("Error getting coaching:", error);
      setReflections(prev => ({
        ...prev,
        [practiceId]: {
          ...prev[practiceId],
          coaching: {
            feedback: "Couldn't generate coaching feedback right now. Your reflection has been saved — try again later.",
            promptTip: "",
            nextChallenge: "",
            skillConnection: ""
          }
        }
      }));
    } finally {
      setCoachingLoading(null);
    }
  };

  const toggleComplete = (id) => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePrompt = (id) => {
    setShowPrompt(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const regeneratePractice = async (practiceId) => {
    setRegenerating(practiceId);
    
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          messages: [
            {
              role: "user",
              content: `You are regenerating a SINGLE practice for a professional development playbook.

USER CONFIGURATION:
- Job & Company: ${config.company}
- Actual Work Description: ${config.industry}
- Time Commitment: ${config.duration} hours per week
- Data Type: ${config.dataType === "personal" ? "Personal data for self-improvement" : config.dataType === "business" ? "Business/work data for professional practice" : "Both personal and business data"}
- Data Access: ${config.dataAccess}
- AI Models Available: ${config.aiModels}
- Work Experience Level: ${config.workExperience}/10
- AI/Prompting Experience: ${config.aiExperience}/10

Generate ONE professional development practice that:
1. Is specific to their actual job responsibilities and work context
2. Uses the data sources they have available
3. Can be completed within their time constraints
4. Leverages the AI models they have access to
5. Builds real consulting skills applicable to their future career

Return this EXACT JSON structure (just the object, no array):
{
  "id": ${practiceId},
  "title": "Practice Name",
  "scale": "Micro-Habit" or "Deep Dive",
  "time": "X min",
  "jlSkill": "Professional Skill Category",
  "quote": {
    "text": "Relevant quote",
    "source": "Attribution"
  },
  "bridge": "2-3 sentences explaining why this matters for their career path",
  "protocol": ["step 1", "step 2", "step 3", "step 4"],
  "prompt": "The exact AI prompt they should use, with [PLACEHOLDER] markers for where they insert their data",
  "takeaway": [
    "Key AI feature or technique that makes this practice powerful",
    "Something to remember for next time they do this practice",
    "Specific prompting or automation skill highlighted in this practice",
    "How to go even further with AI on this task"
  ]
}

CRITICAL: Return ONLY valid JSON. No preamble, no explanation, no markdown formatting. Just the JSON object starting with { and ending with }.`
            }
          ]
        })
      });

      const data = await response.json();
      const text = data.content.find(c => c.type === "text")?.text || "";
      
      let jsonText = text.trim();
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      
      const regeneratedPractice = JSON.parse(jsonText);
      
      const updatedPractices = practices.map(p => 
        p.id === practiceId ? regeneratedPractice : p
      );
      setPractices(updatedPractices);
      
      if (currentPlaybook) {
        const playbookKey = `playbook:${currentPlaybook}`;
        const existing = await window.storage.get(playbookKey);
        if (existing && existing.value) {
          const playbookData = JSON.parse(existing.value);
          playbookData.practices = updatedPractices;
          playbookData.lastAccessed = Date.now();
          await window.storage.set(playbookKey, JSON.stringify(playbookData));
        }
      }
      
    } catch (error) {
      console.error("Error regenerating practice:", error);
      alert("Failed to regenerate practice. Please try again.");
    } finally {
      setRegenerating(null);
    }
  };

  const completedCount = Object.values(completed).filter(Boolean).length;

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#151C28",
        color: "#E8E6E3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'SF Mono', 'Fira Code', monospace"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid #ffffff25",
            borderTop: "3px solid #e94560",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }}></div>
          <p style={{ color: "#6A6A6A", fontSize: "12px", letterSpacing: "2px" }}>LOADING PLAYBOOKS...</p>
        </div>
      </div>
    );
  }

  // Playbook Library (when user has saved playbooks and wants to see them)
  if (savedPlaybooks.length > 0 && showLibrary && !setupComplete) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#151C28",
        color: "#E8E6E3",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        padding: "40px 20px"
      }}>
        {deleteConfirm && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #1A2230 0%, #151C28 100%)",
              border: "1px solid #e9456055",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "500px",
              width: "100%"
            }}>
              <h3 style={{
                fontSize: "20px",
                fontWeight: "400",
                margin: "0 0 12px 0",
                letterSpacing: "-0.3px"
              }}>
                Delete Playbook?
              </h3>
              <p style={{
                color: "#8A8A8A",
                fontSize: "14px",
                margin: "0 0 24px 0",
                lineHeight: "1.5"
              }}>
                Are you sure you want to delete <strong style={{ color: "#e94560" }}>{deleteConfirm.name}</strong>? This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "transparent",
                    border: "1px solid #ffffff25",
                    borderRadius: "6px",
                    color: "#8A8A8A",
                    fontSize: "13px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deletePlaybook(deleteConfirm.id)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#e94560",
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "13px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{
            fontSize: "32px",
            fontWeight: "400",
            margin: "0 0 8px 0",
            letterSpacing: "-0.5px",
            textAlign: "center"
          }}>
            Your Playbook Library
          </h1>
          <p style={{
            color: "#6A6A6A",
            fontSize: "14px",
            margin: "0 0 32px 0",
            textAlign: "center"
          }}>
            {savedPlaybooks.length} saved {savedPlaybooks.length === 1 ? 'playbook' : 'playbooks'}
          </p>

          <button
            onClick={() => {
              console.log("Button clicked - setting showLibrary to false");
              setShowLibrary(false);
              setSetupComplete(false);
              setShowCustomize(false);
              setConfig({
                company: "",
                industry: "",
                duration: "",
                dataType: "business",
                dataAccess: "",
                aiModels: "",
                workExperience: 5,
                aiExperience: 5,
                recentTask: "",
                tediousWork: "",
                skillFocus: [],
                commStyle: "professional"
              });
            }}
            style={{
              width: "100%",
              padding: "16px",
              background: "linear-gradient(135deg, #e94560 0%, #c84b31 100%)",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "13px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontWeight: "700",
              cursor: "pointer",
              marginBottom: "24px"
            }}
          >
            + Create New Playbook
          </button>

          {savedPlaybooks.map((playbook) => {
            const completedInPlaybook = Object.values(playbook.completed || {}).filter(Boolean).length;
            const progress = (completedInPlaybook / 10) * 100;
            
            return (
              <div
                key={playbook.id}
                style={{
                  background: "linear-gradient(135deg, #1A2230 0%, #151C28 100%)",
                  border: "1px solid #ffffff18",
                  borderRadius: "8px",
                  padding: "24px",
                  marginBottom: "16px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: "18px",
                      fontWeight: "400",
                      margin: "0 0 4px 0",
                      letterSpacing: "-0.3px"
                    }}>
                      {playbook.config.company}
                    </h3>
                    <p style={{
                      color: "#6A6A6A",
                      fontSize: "12px",
                      margin: "0 0 8px 0",
                      fontFamily: "'SF Mono', 'Fira Code', monospace"
                    }}>
                      {playbook.config.duration} hours/week • {playbook.config.dataType === "personal" ? "Personal data" : playbook.config.dataType === "business" ? "Business data" : "Personal & business data"}
                    </p>
                    <p style={{
                      color: "#8A8A8A",
                      fontSize: "11px",
                      margin: 0,
                      fontFamily: "'SF Mono', 'Fira Code', monospace"
                    }}>
                      Created {new Date(playbook.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => loadPlaybook(playbook.id)}
                      style={{
                        background: "#e9456022",
                        border: "1px solid #e94560",
                        color: "#e94560",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontFamily: "'SF Mono', 'Fira Code', monospace",
                        letterSpacing: "1px",
                        textTransform: "uppercase"
                      }}
                    >
                      Open
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: playbook.id, name: playbook.config.company })}
                      style={{
                        background: "transparent",
                        border: "1px solid #ffffff25",
                        color: "#6A6A6A",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px"
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <div style={{
                    background: "#ffffff18",
                    height: "6px",
                    borderRadius: "3px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      background: progress === 100 ? "#22c55e" : "#e94560",
                      height: "100%",
                      width: `${progress}%`,
                      transition: "width 0.3s ease"
                    }}></div>
                  </div>
                </div>
                <p style={{
                  color: "#6A6A6A",
                  fontSize: "11px",
                  margin: 0,
                  fontFamily: "'SF Mono', 'Fira Code', monospace"
                }}>
                  {completedInPlaybook}/10 practices completed
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Customize Further Screen
  if (showCustomize) {
    const skillOptions = [
      "Data Analysis & Interpretation",
      "Report Writing & Documentation", 
      "Client Communication",
      "Strategic Decision-Making",
      "Time Management & Prioritization",
      "Technical Problem-Solving",
      "Presentation & Storytelling",
      "Process Optimization",
      "Risk Assessment",
      "Cross-functional Collaboration"
    ];

    return (
      <div style={{
        minHeight: "100vh",
        background: "#151C28",
        color: "#E8E6E3",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}>
        <div style={{
          maxWidth: "700px",
          width: "100%",
          background: "linear-gradient(135deg, #1A2230 0%, #151C28 100%)",
          border: "1px solid #ffffff18",
          borderRadius: "12px",
          padding: "48px 40px"
        }}>
          <div style={{
            textAlign: "center",
            marginBottom: "32px",
            paddingBottom: "24px",
            borderBottom: "1px solid #ffffff18"
          }}>
            <h1 style={{
              fontSize: "28px",
              fontWeight: "400",
              margin: "0 0 8px 0",
              letterSpacing: "-0.5px"
            }}>
              Make It Better
            </h1>
            <p style={{
              color: "#6A6A6A",
              fontSize: "14px",
              margin: 0,
              lineHeight: "1.5"
            }}>
              Answer 3 quick questions to get practices that fit your actual work even better.
            </p>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              color: "#D0CEC8",
              marginBottom: "8px",
              fontWeight: "400"
            }}>
              What's a specific project or task you worked on this week?
            </label>
            <textarea
              value={config.recentTask}
              onChange={(e) => setConfig({...config, recentTask: e.target.value})}
              placeholder="e.g., Built a financial model for Q1 forecasting, Audited vendor contracts for compliance, Created a dashboard for customer churn analysis"
              rows={3}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "#151C28",
                border: "1px solid #ffffff25",
                borderRadius: "6px",
                color: "#E8E6E3",
                fontSize: "14px",
                fontFamily: "inherit",
                boxSizing: "border-box",
                resize: "vertical"
              }}
            />
            <p style={{
              fontSize: "11px",
              color: "#6E6E6E",
              margin: "6px 0 0 0",
              fontFamily: "'SF Mono', 'Fira Code', monospace"
            }}>
              Optional - Skip if you prefer general practices
            </p>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              color: "#D0CEC8",
              marginBottom: "8px",
              fontWeight: "400"
            }}>
              What's the most repetitive or tedious part of your job?
            </label>
            <textarea
              value={config.tediousWork}
              onChange={(e) => setConfig({...config, tediousWork: e.target.value})}
              placeholder="e.g., Manually pulling data from 5 different systems into Excel, Writing the same client update emails, Reformatting reports for different stakeholders"
              rows={3}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "#151C28",
                border: "1px solid #ffffff25",
                borderRadius: "6px",
                color: "#E8E6E3",
                fontSize: "14px",
                fontFamily: "inherit",
                boxSizing: "border-box",
                resize: "vertical"
              }}
            />
            <p style={{
              fontSize: "11px",
              color: "#6E6E6E",
              margin: "6px 0 0 0",
              fontFamily: "'SF Mono', 'Fira Code', monospace"
            }}>
              Optional - AI excels at automating repetitive tasks
            </p>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              color: "#D0CEC8",
              marginBottom: "12px",
              fontWeight: "400"
            }}>
              Pick 2-3 skills you want to get better at:
            </label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px"
            }}>
              {skillOptions.map(skill => (
                <label
                  key={skill}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: config.skillFocus.includes(skill) ? "#e9456022" : "#151C28",
                    border: `1px solid ${config.skillFocus.includes(skill) ? "#e94560" : "#ffffff25"}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    transition: "all 0.2s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.25)"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={config.skillFocus.includes(skill)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setConfig({...config, skillFocus: [...config.skillFocus, skill]});
                      } else {
                        setConfig({...config, skillFocus: config.skillFocus.filter(s => s !== skill)});
                      }
                    }}
                    style={{ marginRight: "8px", cursor: "pointer" }}
                  />
                  {skill}
                </label>
              ))}
            </div>
            <p style={{
              fontSize: "11px",
              color: "#6E6E6E",
              margin: "8px 0 0 0",
              fontFamily: "'SF Mono', 'Fira Code', monospace"
            }}>
              Optional - Select up to 3 areas to focus on
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => handleGeneratePlaybook()}
              style={{
                flex: 1,
                padding: "16px",
                background: "linear-gradient(135deg, #e94560 0%, #c84b31 100%)",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "13px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Generate My Playbook
            </button>
            <button
              onClick={() => {
                setConfig({...config, recentTask: "", tediousWork: "", skillFocus: []});
                handleGeneratePlaybook();
              }}
              style={{
                padding: "16px 20px",
                background: "transparent",
                border: "1px solid #ffffff25",
                borderRadius: "6px",
                color: "#8A8A8A",
                fontSize: "11px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                cursor: "pointer"
              }}
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!setupComplete) {
    if (generating) {

      return (
        <div style={{
          minHeight: "100vh",
          background: "#151C28",
          color: "#E8E6E3",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            maxWidth: "600px",
            width: "100%",
            textAlign: "center"
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              border: "4px solid #ffffff25",
              borderTop: "4px solid #e94560",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 32px"
            }}></div>
            
            <h1 style={{
              fontSize: "32px",
              fontWeight: "400",
              margin: "0 0 16px 0",
              letterSpacing: "-0.5px"
            }}>
              Your Playbook is on the way!
            </h1>
            
            <div style={{
              margin: "0 0 24px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px"
            }}>
              <div style={{
                background: "#ffffff18",
                height: "8px",
                width: "200px",
                borderRadius: "4px",
                overflow: "hidden"
              }}>
                <div style={{
                  background: "linear-gradient(90deg, #e94560, #c84b31)",
                  height: "100%",
                  width: `${generatingProgress}%`,
                  transition: "width 0.3s ease"
                }}></div>
              </div>
              <span style={{
                color: "#6A6A6A",
                fontSize: "12px",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                minWidth: "45px"
              }}>
                {generatingProgress}%
              </span>
            </div>
            
            <p style={{
              color: "#8A8A8A",
              fontSize: "13px",
              margin: "0 0 48px 0",
              fontFamily: "'SF Mono', 'Fira Code', monospace"
            }}>
              {generatingProgress < 30 && "Analyzing your inputs..."}
              {generatingProgress >= 30 && generatingProgress < 60 && "Generating personalized practices..."}
              {generatingProgress >= 60 && generatingProgress < 90 && "Almost there..."}
              {generatingProgress >= 90 && "Finalizing your playbook..."}
            </p>

            <div style={{
              borderLeft: "3px solid #e94560",
              paddingLeft: "20px",
              marginBottom: "36px",
              fontStyle: "italic",
              color: "#787878",
              textAlign: "left"
            }}>
              <p style={{ fontSize: "18px", margin: "0 0 8px 0", color: "#D0CEC8", lineHeight: "1.5" }}>
                "{loadingQuote?.text}"
              </p>
              <p style={{ fontSize: "12px", margin: 0, fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                — {loadingQuote?.source}
              </p>
            </div>
          </div>

          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }

    if (generationError) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "#151C28",
          color: "#E8E6E3",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            maxWidth: "500px",
            width: "100%",
            background: "linear-gradient(135deg, #1A2230 0%, #151C28 100%)",
            border: "1px solid #e9456055",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "48px",
              marginBottom: "24px"
            }}>⚠️</div>
            
            <h2 style={{
              fontSize: "24px",
              fontWeight: "400",
              margin: "0 0 16px 0",
              letterSpacing: "-0.3px"
            }}>
              Generation Failed
            </h2>
            
            <p style={{
              color: "#8A8A8A",
              fontSize: "14px",
              margin: "0 0 32px 0",
              lineHeight: "1.6"
            }}>
              We couldn't generate your playbook. This might be due to a network issue or timeout. Please try again.
            </p>
            
            <button
              onClick={() => {
                setGenerationError(null);
                setShowCustomize(true);
              }}
              style={{
                padding: "14px 28px",
                background: "linear-gradient(135deg, #e94560 0%, #c84b31 100%)",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "13px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        minHeight: "100vh",
        background: "#151C28",
        color: "#E8E6E3",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}>
        {onboardingStep !== null && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}>
            <div style={{
              maxWidth: "520px",
              width: "100%",
              background: "linear-gradient(135deg, #1A2230 0%, #151C28 100%)",
              border: "1px solid #e9456055",
              borderRadius: "12px",
              padding: "40px 36px 32px",
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
            }}>
              {onboardingStep === 0 && (<>
                <div style={{ fontSize: "36px", marginBottom: "20px" }}>🎯</div>
                <h2 style={{
                  fontSize: "24px",
                  fontWeight: "400",
                  margin: "0 0 14px 0",
                  letterSpacing: "-0.3px"
                }}>Welcome to Playbook</h2>
                <p style={{
                  color: "#A0A0A0",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  margin: "0 0 8px 0"
                }}>
                  Playbook generates <strong style={{ color: "#e94560" }}>personalized AI practice exercises</strong> built around your actual job, your real data, and the AI tools you already use.
                </p>
                <p style={{
                  color: "#6A6A6A",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  margin: "0"
                }}>
                  Each practice includes a step-by-step protocol, a ready-to-use AI prompt, and a skill-building takeaway — so you learn by doing, not just reading.
                </p>
              </>)}
              {onboardingStep === 1 && (<>
                <div style={{ fontSize: "36px", marginBottom: "20px" }}>⚖️</div>
                <h2 style={{
                  fontSize: "24px",
                  fontWeight: "400",
                  margin: "0 0 14px 0",
                  letterSpacing: "-0.3px"
                }}>Calibrated to You</h2>
                <p style={{
                  color: "#A0A0A0",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  margin: "0 0 16px 0"
                }}>Two sliders control everything Playbook generates:</p>
                <div style={{ display: "flex", gap: "12px", textAlign: "left" }}>
                  <div style={{
                    flex: 1,
                    background: "#e9456012",
                    border: "1px solid #e9456033",
                    borderRadius: "8px",
                    padding: "14px 16px"
                  }}>
                    <div style={{
                      fontSize: "11px",
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                      color: "#e94560",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      fontWeight: "700",
                      marginBottom: "6px"
                    }}>Work Experience</div>
                    <p style={{ fontSize: "12px", color: "#8A8A8A", margin: 0, lineHeight: "1.5" }}>
                      Controls <strong style={{ color: "#D0CEC8" }}>domain depth</strong> — how much is explained vs. assumed about your field.
                    </p>
                  </div>
                  <div style={{
                    flex: 1,
                    background: "#4a9aba12",
                    border: "1px solid #4a9aba33",
                    borderRadius: "8px",
                    padding: "14px 16px"
                  }}>
                    <div style={{
                      fontSize: "11px",
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                      color: "#4a9aba",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      fontWeight: "700",
                      marginBottom: "6px"
                    }}>AI Experience</div>
                    <p style={{ fontSize: "12px", color: "#8A8A8A", margin: 0, lineHeight: "1.5" }}>
                      Controls <strong style={{ color: "#D0CEC8" }}>prompting complexity</strong> — how much guidance the AI prompts include.
                    </p>
                  </div>
                </div>
              </>)}
              {onboardingStep === 2 && (<>
                <div style={{ fontSize: "36px", marginBottom: "20px" }}>📋</div>
                <h2 style={{
                  fontSize: "24px",
                  fontWeight: "400",
                  margin: "0 0 14px 0",
                  letterSpacing: "-0.3px"
                }}>What You'll Get</h2>
                <p style={{
                  color: "#A0A0A0",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  margin: "0 0 16px 0"
                }}>After setup, Playbook generates:</p>
                <div style={{ textAlign: "left" }}>
                  {[
                    { label: "10 Practices", desc: "Each with a protocol, AI prompt, and skill takeaway", color: "#e94560" },
                    { label: "Project Prompt", desc: "A copy-paste system prompt to keep all your AI chats consistent", color: "#f59e0b" },
                    { label: "Progress Tracking", desc: "Mark practices complete and pick up where you left off", color: "#22c55e" }
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      marginBottom: "10px",
                      padding: "10px 14px",
                      background: "#ffffff06",
                      borderRadius: "6px",
                      border: "1px solid #ffffff10"
                    }}>
                      <span style={{
                        color: item.color,
                        fontFamily: "'SF Mono', 'Fira Code', monospace",
                        fontSize: "14px",
                        fontWeight: "700",
                        marginTop: "1px"
                      }}>→</span>
                      <div>
                        <div style={{ fontSize: "13px", color: "#E8E6E3", fontWeight: "600", marginBottom: "2px" }}>{item.label}</div>
                        <div style={{ fontSize: "12px", color: "#6A6A6A" }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>)}
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", margin: "24px 0 20px" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: i === onboardingStep ? "24px" : "8px",
                    height: "8px",
                    borderRadius: "4px",
                    background: i === onboardingStep ? "#e94560" : "#ffffff22",
                    transition: "all 0.3s ease"
                  }} />
                ))}
              </div>
              <button
                onClick={() => {
                  if (onboardingStep < 2) setOnboardingStep(onboardingStep + 1);
                  else dismissOnboarding();
                }}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: onboardingStep === 2 ? "linear-gradient(135deg, #e94560 0%, #c84b31 100%)" : "transparent",
                  border: onboardingStep === 2 ? "none" : "1px solid #e94560",
                  borderRadius: "6px",
                  color: onboardingStep === 2 ? "#fff" : "#e94560",
                  fontSize: "13px",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {onboardingStep === 2 ? "Got it — Let's build!" : "Next →"}
              </button>
              {onboardingStep > 0 && (
                <button
                  onClick={() => setOnboardingStep(onboardingStep - 1)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#6A6A6A",
                    fontSize: "12px",
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    cursor: "pointer",
                    marginTop: "12px",
                    padding: "4px 8px"
                  }}
                >← Back</button>
              )}
            </div>
          </div>
        )}
        <div style={{
          maxWidth: "600px",
          width: "100%",
          background: "linear-gradient(135deg, #1A2230 0%, #151C28 100%)",
          border: "1px solid #ffffff18",
          borderRadius: "12px",
          padding: "48px 40px"
        }}>
          {savedPlaybooks.length > 0 && (
            <button
              onClick={() => {
                setShowLibrary(true);
                setSetupComplete(false);
                setShowCustomize(false);
              }}
              style={{
                background: "transparent",
                border: "1px solid #ffffff25",
                color: "#8A8A8A",
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                marginBottom: "20px"
              }}
              onMouseOver={(e) => e.currentTarget.style.color = "#e94560"}
              onMouseOut={(e) => e.currentTarget.style.color = "#8A8A8A"}
            >
              ← Back to Library
            </button>
          )}
          
          <h1 style={{
            fontSize: "32px",
            fontWeight: "400",
            margin: "0 0 8px 0",
            letterSpacing: "-0.5px",
            textAlign: "center"
          }}>
            Create Your Playbook
          </h1>
          <p style={{
            color: "#6A6A6A",
            fontSize: "14px",
            margin: "0 0 32px 0",
            textAlign: "center",
            lineHeight: "1.5"
          }}>
            Tell us about your situation and we'll generate 10 personalized consulting practices.
          </p>

          <div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#8A8A8A",
                marginBottom: "8px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                What is your job? Be specific.
              </label>
              <p style={{
                fontSize: "11px",
                color: "#6A6A6A",
                margin: "0 0 8px 0",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                lineHeight: "1.4"
              }}>
                Include your role AND company/organization. Students: include your major and school.
              </p>
              <input
                type="text"
                value={config.company}
                onChange={(e) => setConfig({...config, company: e.target.value})}
                placeholder="e.g., Financial Analyst at Google, Marketing Intern at Stripe, MIS Student at UGA"
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#151C28",
                  border: "1px solid #ffffff25",
                  borderRadius: "6px",
                  color: "#E8E6E3",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#8A8A8A",
                marginBottom: "8px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                What do you actually do? Describe your work.
              </label>
              <p style={{
                fontSize: "11px",
                color: "#6A6A6A",
                margin: "0 0 8px 0",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                lineHeight: "1.4"
              }}>
                Think: What tasks fill my day? What deliverables do I create? Students: include coursework, projects, and skills you're building.
              </p>
              <textarea
                value={config.industry}
                onChange={(e) => setConfig({...config, industry: e.target.value})}
                placeholder="e.g., I build financial models for quarterly forecasting and present findings to executives. OR I'm taking AI, data analytics, and finance courses while working on a capstone project analyzing market trends."
                required
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#151C28",
                  border: "1px solid #ffffff25",
                  borderRadius: "6px",
                  color: "#E8E6E3",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#8A8A8A",
                marginBottom: "8px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                Time Commitment (hours per week)
              </label>
              <p style={{
                fontSize: "11px",
                color: "#6A6A6A",
                margin: "0 0 8px 0",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                lineHeight: "1.4"
              }}>
                Just enter the number (we'll assume hours per week). If you write "5", we read it as "5 hours/week".
              </p>
              <input
                type="text"
                value={config.duration}
                onChange={(e) => setConfig({...config, duration: e.target.value})}
                placeholder="e.g., 3-5, 2, 10"
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#151C28",
                  border: "1px solid #ffffff25",
                  borderRadius: "6px",
                  color: "#E8E6E3",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#8A8A8A",
                marginBottom: "8px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                Which type of data will you use?
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: config.dataType === "business" ? "#e9456022" : "#151C28",
                  border: `1px solid ${config.dataType === "business" ? "#e94560" : "#ffffff25"}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.25)"
                }}>
                  <input
                    type="radio"
                    name="dataType"
                    value="business"
                    checked={config.dataType === "business"}
                    onChange={(e) => setConfig({...config, dataType: e.target.value})}
                    style={{ marginRight: "12px", cursor: "pointer" }}
                  />
                  <div>
                    <div style={{ fontSize: "14px", color: "#E8E6E3", marginBottom: "2px" }}>
                      Business Data
                    </div>
                    <div style={{ fontSize: "11px", color: "#6A6A6A", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                      Use work or academic data to practice professional skills (public or private with permission)
                    </div>
                  </div>
                </label>
                
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: config.dataType === "personal" ? "#e9456022" : "#151C28",
                  border: `1px solid ${config.dataType === "personal" ? "#e94560" : "#ffffff25"}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.25)"
                }}>
                  <input
                    type="radio"
                    name="dataType"
                    value="personal"
                    checked={config.dataType === "personal"}
                    onChange={(e) => setConfig({...config, dataType: e.target.value})}
                    style={{ marginRight: "12px", cursor: "pointer" }}
                  />
                  <div>
                    <div style={{ fontSize: "14px", color: "#E8E6E3", marginBottom: "2px" }}>
                      Personal Data
                    </div>
                    <div style={{ fontSize: "11px", color: "#6A6A6A", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                      Use your own data for self-improvement and insights
                    </div>
                  </div>
                </label>
                
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: config.dataType === "both" ? "#e9456022" : "#151C28",
                  border: `1px solid ${config.dataType === "both" ? "#e94560" : "#ffffff25"}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.25)"
                }}>
                  <input
                    type="radio"
                    name="dataType"
                    value="both"
                    checked={config.dataType === "both"}
                    onChange={(e) => setConfig({...config, dataType: e.target.value})}
                    style={{ marginRight: "12px", cursor: "pointer" }}
                  />
                  <div>
                    <div style={{ fontSize: "14px", color: "#E8E6E3", marginBottom: "2px" }}>
                      Both Business & Personal
                    </div>
                    <div style={{ fontSize: "11px", color: "#6A6A6A", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                      Combination of work/academic and personal data
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#8A8A8A",
                marginBottom: "8px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                {config.dataType === "business"
                  ? "List Business/Work/Academic Data You Can Access" 
                  : config.dataType === "personal"
                  ? "List Your Personal Data Sources"
                  : "List Both Personal & Business/Academic Data Sources"}
              </label>
              <div style={{
                fontSize: "11px",
                color: "#8A8A8A",
                margin: "0 0 12px 0",
                lineHeight: "1.6",
                paddingLeft: "0"
              }}>
                <div style={{ marginBottom: "4px", color: "#6A6A6A", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>Examples of useful data sources:</div>
                <div style={{ color: "#8A8A8A", marginLeft: "0" }}>• Whoop/fitness data — analyze recovery patterns to optimize performance during exam weeks</div>
                <div style={{ color: "#8A8A8A", marginLeft: "0" }}>• Course grades/assignments — identify which study methods correlate with better outcomes</div>
                <div style={{ color: "#8A8A8A", marginLeft: "0" }}>• Personal spending/bank statements — build budgeting models using real financial data</div>
                <div style={{ color: "#8A8A8A", marginLeft: "0" }}>• Public company datasets (SEC filings, Kaggle) — practice professional analysis skills risk-free</div>
              </div>
              <textarea
                value={config.dataAccess}
                onChange={(e) => setConfig({...config, dataAccess: e.target.value})}
                placeholder={
                  config.dataType === "personal"
                    ? "e.g., Whoop wearable data, Spotify history, bank statements, calendar data, email archives"
                    : config.dataType === "business"
                    ? "e.g., Course grades, project datasets, public SEC filings, internship reports, Kaggle datasets"
                    : "e.g., Personal: Whoop data, Spotify history. Academic: Course datasets, capstone project data, public market data"
                }
                required
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#151C28",
                  border: "1px solid #ffffff25",
                  borderRadius: "6px",
                  color: "#E8E6E3",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#8A8A8A",
                marginBottom: "8px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                AI Models You'll Use
              </label>
              <input
                type="text"
                value={config.aiModels}
                onChange={(e) => setConfig({...config, aiModels: e.target.value})}
                placeholder="e.g., Claude, ChatGPT, Gemini"
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#151C28",
                  border: "1px solid #ffffff25",
                  borderRadius: "6px",
                  color: "#E8E6E3",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#8A8A8A",
                marginBottom: "12px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                Work Experience Level: {config.workExperience}/10
              </label>
              <p style={{
                fontSize: "11px",
                color: "#6A6A6A",
                margin: "0 0 12px 0",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                lineHeight: "1.4"
              }}>
                1-2 = New to this role, 3-4 = Learning, 5-6 = Competent, 7-8 = Expert, 9-10 = Master/Thought Leader
              </p>
              <input
                type="range"
                min="1"
                max="10"
                value={config.workExperience}
                onChange={(e) => setConfig({...config, workExperience: parseInt(e.target.value)})}
                style={{
                  width: "100%",
                  height: "6px",
                  borderRadius: "3px",
                  background: `linear-gradient(to right, #e94560 0%, #e94560 ${(config.workExperience - 1) * 11.11}%, #ffffff25 ${(config.workExperience - 1) * 11.11}%, #ffffff25 100%)`,
                  outline: "none",
                  appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer"
                }}
              />
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "4px",
                fontSize: "10px",
                color: "#6E6E6E",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                <span>Beginner</span>
                <span>Expert</span>
              </div>
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#8A8A8A",
                marginBottom: "12px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                AI / Prompting Experience Level: {config.aiExperience}/10
              </label>
              <p style={{
                fontSize: "11px",
                color: "#6A6A6A",
                margin: "0 0 12px 0",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                lineHeight: "1.4"
              }}>
                1-2 = Never used AI, 3-4 = Basic prompts, 5-6 = Comfortable, 7-8 = Advanced techniques, 9-10 = Prompt engineer/AI expert
              </p>
              <input
                type="range"
                min="1"
                max="10"
                value={config.aiExperience}
                onChange={(e) => setConfig({...config, aiExperience: parseInt(e.target.value)})}
                style={{
                  width: "100%",
                  height: "6px",
                  borderRadius: "3px",
                  background: `linear-gradient(to right, #4a9aba 0%, #4a9aba ${(config.aiExperience - 1) * 11.11}%, #ffffff25 ${(config.aiExperience - 1) * 11.11}%, #ffffff25 100%)`,
                  outline: "none",
                  appearance: "none",
                  WebkitAppearance: "none",
                  cursor: "pointer"
                }}
              />
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "4px",
                fontSize: "10px",
                color: "#6E6E6E",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                <span>Beginner</span>
                <span>Advanced</span>
              </div>
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#8A8A8A",
                marginBottom: "12px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                Preferred Communication Style
              </label>
              <p style={{
                fontSize: "11px",
                color: "#6A6A6A",
                margin: "0 0 12px 0",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                lineHeight: "1.4"
              }}>
                This sets the tone for your AI-generated Project Prompt so every chat stays consistent.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { value: "formal", label: "Formal", desc: "Structured, precise, and professional — suited for executive or client-facing work" },
                  { value: "professional", label: "Professional", desc: "Clear and business-appropriate, but approachable — the default for most work contexts" },
                  { value: "casual", label: "Casual", desc: "Conversational and relaxed — great for learning, brainstorming, and personal projects" }
                ].map(style => (
                  <label
                    key={style.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: config.commStyle === style.value ? "#e9456022" : "#151C28",
                      border: `1px solid ${config.commStyle === style.value ? "#e94560" : "#ffffff25"}`,
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.25)"
                    }}
                  >
                    <input
                      type="radio"
                      name="commStyle"
                      value={style.value}
                      checked={config.commStyle === style.value}
                      onChange={(e) => setConfig({...config, commStyle: e.target.value})}
                      style={{ marginRight: "12px", cursor: "pointer" }}
                    />
                    <div>
                      <div style={{ fontSize: "14px", color: "#E8E6E3", marginBottom: "2px" }}>
                        {style.label}
                      </div>
                      <div style={{ fontSize: "11px", color: "#6A6A6A", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                        {style.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={(e) => handleSetupSubmit(e)}
              style={{
                width: "100%",
                padding: "16px",
                background: "linear-gradient(135deg, #e94560 0%, #c84b31 100%)",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "13px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Continue →
            </button>
            <p style={{
              fontSize: "11px",
              color: "#6A6A6A",
              margin: "12px 0 0 0",
              textAlign: "center",
              fontFamily: "'SF Mono', 'Fira Code', monospace"
            }}>
              Next: Optional customization to make practices even better
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (activeCard !== null) {
    const p = practices.find(pr => pr.id === activeCard);
    const colors = skillColors[p.jlSkill] || { bg: "#182030", accent: "#e94560" };
    return (
      <div style={{
        minHeight: "100vh",
        background: "#151C28",
        color: "#E8E6E3",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        padding: "0"
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${colors.bg} 0%, #151C28 100%)`,
          borderBottom: `2px solid ${colors.accent}55`,
          padding: "24px 32px 20px"
        }}>
          <button
            onClick={() => setActiveCard(null)}
            style={{
              background: "none",
              border: `1px solid ${colors.accent}55`,
              color: colors.accent,
              padding: "6px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: "12px",
              letterSpacing: "1px",
              marginBottom: "16px",
              textTransform: "uppercase",
              marginRight: "12px"
            }}
          >
            ← Back to Playbook
          </button>
          <button
            onClick={() => regeneratePractice(p.id)}
            disabled={regenerating === p.id}
            style={{
              background: regenerating === p.id ? "#444444" : "none",
              border: `1px solid ${colors.accent}55`,
              color: regenerating === p.id ? "#6A6A6A" : colors.accent,
              padding: "6px 16px",
              borderRadius: "4px",
              cursor: regenerating === p.id ? "not-allowed" : "pointer",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: "12px",
              letterSpacing: "1px",
              marginBottom: "16px",
              textTransform: "uppercase"
            }}
          >
            {regenerating === p.id ? "Regenerating..." : "🔄 Regenerate"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <span style={{
              background: p.scale === "Micro-Habit" ? "#22c55e22" : "#f59e0b22",
              color: p.scale === "Micro-Habit" ? "#22c55e" : "#f59e0b",
              padding: "3px 10px",
              borderRadius: "3px",
              fontSize: "11px",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              fontWeight: "600"
            }}>
              {p.scale} — {p.time}
            </span>
            <span style={{
              color: "#6A6A6A",
              fontSize: "12px",
              fontFamily: "'SF Mono', 'Fira Code', monospace"
            }}>
              PRACTICE #{String(p.id).padStart(2, '0')}
            </span>
          </div>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "400",
            margin: "0 0 6px 0",
            letterSpacing: "-0.5px",
            lineHeight: "1.2"
          }}>
            {p.title}
          </h1>
          <p style={{
            color: colors.accent,
            fontSize: "13px",
            margin: 0,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            letterSpacing: "0.5px"
          }}>
            Skill: {p.jlSkill}
          </p>
        </div>

        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 24px" }}>
          <div style={{
            borderLeft: `3px solid ${colors.accent}`,
            paddingLeft: "20px",
            marginBottom: "36px",
            fontStyle: "italic",
            color: "#787878"
          }}>
            <p style={{ fontSize: "16px", margin: "0 0 6px 0", color: "#D0CEC8", lineHeight: "1.5" }}>
              "{p.quote.text}"
            </p>
            <p style={{ fontSize: "12px", margin: 0, fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
              — {p.quote.source}
            </p>
          </div>

          <div style={{ marginBottom: "36px" }}>
            <h2 style={{
              fontSize: "11px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: colors.accent,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontWeight: "600",
              marginBottom: "12px"
            }}>
              The Bridge — Why This Matters
            </h2>
            <p style={{
              fontSize: "15px",
              lineHeight: "1.75",
              color: "#B8B4AE",
              margin: 0
            }}>
              {p.bridge}
            </p>
          </div>

          <div style={{ marginBottom: "36px" }}>
            <h2 style={{
              fontSize: "11px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: colors.accent,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontWeight: "600",
              marginBottom: "16px"
            }}>
              The Protocol
            </h2>
            {p.protocol.map((step, i) => (
              <div key={i} style={{
                display: "flex",
                gap: "16px",
                marginBottom: "16px",
                alignItems: "flex-start"
              }}>
                <span style={{
                  background: `${colors.accent}22`,
                  color: colors.accent,
                  minWidth: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontWeight: "700",
                  flexShrink: 0
                }}>
                  {i + 1}
                </span>
                <p style={{
                  fontSize: "14px",
                  lineHeight: "1.65",
                  color: "#A0A0A0",
                  margin: 0,
                  paddingTop: "3px"
                }}>
                  {step}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "36px" }}>
            <button
              onClick={() => togglePrompt(p.id)}
              style={{
                background: `${colors.accent}11`,
                border: `1px solid ${colors.accent}66`,
                color: colors.accent,
                padding: "12px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                width: "100%",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span>The Prompt — Copy & Paste</span>
              <span>{showPrompt[p.id] ? "▲" : "▼"}</span>
            </button>
            {showPrompt[p.id] && (
              <div style={{
                background: "#10151E",
                border: `1px solid ${colors.accent}55`,
                borderTop: "none",
                borderRadius: "0 0 6px 6px",
                padding: "20px",
                position: "relative"
              }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(p.prompt);
                  }}
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: `${colors.accent}33`,
                    border: "none",
                    color: "#fff",
                    padding: "4px 12px",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontFamily: "'SF Mono', 'Fira Code', monospace"
                  }}
                >
                  COPY
                </button>
                <pre style={{
                  fontSize: "12.5px",
                  lineHeight: "1.7",
                  color: "#A0A0A0",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace"
                }}>
                  {p.prompt}
                </pre>
              </div>
            )}
          </div>

          <button
            onClick={() => toggleComplete(p.id)}
            style={{
              background: completed[p.id] ? "#22c55e" : "transparent",
              border: completed[p.id] ? "none" : `2px solid ${colors.accent}`,
              color: completed[p.id] ? "#000" : colors.accent,
              padding: "14px 28px",
              borderRadius: "6px",
              cursor: "pointer",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: "13px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontWeight: "700",
              width: "100%",
              transition: "all 0.2s ease",
              marginBottom: "36px"
            }}
          >
            {completed[p.id] ? "✓ Completed" : "Mark as Completed"}
          </button>

          {/* Reflection & AI Coaching */}
          {completed[p.id] && (
            <div style={{
              background: "#22c55e08",
              border: "1px solid #22c55e33",
              borderRadius: "8px",
              padding: "24px 28px",
              marginBottom: "36px"
            }}>
              <h2 style={{
                fontSize: "11px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "#22c55e",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontWeight: "600",
                marginBottom: "14px"
              }}>
                Reflect — What Did You Learn?
              </h2>
              <p style={{
                fontSize: "13px",
                color: "#8A8A8A",
                margin: "0 0 14px 0",
                lineHeight: "1.5"
              }}>
                Write a few sentences about what you learned, what surprised you, or what you struggled with. Then get personalized AI coaching.
              </p>
              <textarea
                value={reflections[p.id]?.text || ""}
                onChange={(e) => setReflections(prev => ({
                  ...prev,
                  [p.id]: { ...prev[p.id], text: e.target.value }
                }))}
                placeholder="e.g., I found that adding specific output format instructions to the prompt made a huge difference. The table came back exactly how I wanted it. I struggled with knowing how much context to include — too much seemed to confuse the response..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "#151C28",
                  border: "1px solid #22c55e33",
                  borderRadius: "6px",
                  color: "#E8E6E3",
                  fontSize: "13px",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  boxSizing: "border-box",
                  resize: "vertical",
                  lineHeight: "1.6"
                }}
              />
              <button
                onClick={() => getCoaching(p.id)}
                disabled={!reflections[p.id]?.text?.trim() || coachingLoading === p.id}
                style={{
                  marginTop: "12px",
                  padding: "12px 20px",
                  background: (!reflections[p.id]?.text?.trim() || coachingLoading === p.id)
                    ? "#ffffff10"
                    : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  border: "none",
                  borderRadius: "6px",
                  color: (!reflections[p.id]?.text?.trim() || coachingLoading === p.id) ? "#6A6A6A" : "#000",
                  fontSize: "12px",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontWeight: "700",
                  cursor: (!reflections[p.id]?.text?.trim() || coachingLoading === p.id) ? "not-allowed" : "pointer",
                  width: "100%",
                  transition: "all 0.2s ease"
                }}
              >
                {coachingLoading === p.id ? "Getting coaching..." : reflections[p.id]?.coaching ? "↻ Get New Coaching" : "Get AI Coaching →"}
              </button>

              {/* Coaching Response */}
              {reflections[p.id]?.coaching && (
                <div style={{
                  marginTop: "20px",
                  paddingTop: "20px",
                  borderTop: "1px solid #22c55e22"
                }}>
                  <h3 style={{
                    fontSize: "11px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "#22c55e",
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    fontWeight: "600",
                    marginBottom: "16px"
                  }}>
                    Your Coaching Feedback
                  </h3>

                  {/* Feedback */}
                  {reflections[p.id].coaching.feedback && (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{
                        fontSize: "11px",
                        fontFamily: "'SF Mono', 'Fira Code', monospace",
                        color: "#6A6A6A",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        marginBottom: "6px"
                      }}>What you did well</div>
                      <p style={{
                        fontSize: "14px",
                        lineHeight: "1.7",
                        color: "#B8B4AE",
                        margin: 0
                      }}>
                        {reflections[p.id].coaching.feedback}
                      </p>
                    </div>
                  )}

                  {/* Prompt Tip */}
                  {reflections[p.id].coaching.promptTip && (
                    <div style={{
                      marginBottom: "16px",
                      background: "#4a9aba10",
                      border: "1px solid #4a9aba33",
                      borderRadius: "6px",
                      padding: "14px 16px"
                    }}>
                      <div style={{
                        fontSize: "11px",
                        fontFamily: "'SF Mono', 'Fira Code', monospace",
                        color: "#4a9aba",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        marginBottom: "6px"
                      }}>Prompting tip</div>
                      <p style={{
                        fontSize: "13px",
                        lineHeight: "1.65",
                        color: "#A0A0A0",
                        margin: 0
                      }}>
                        {reflections[p.id].coaching.promptTip}
                      </p>
                    </div>
                  )}

                  {/* Next Challenge */}
                  {reflections[p.id].coaching.nextChallenge && (
                    <div style={{
                      marginBottom: "16px",
                      background: "#f59e0b10",
                      border: "1px solid #f59e0b33",
                      borderRadius: "6px",
                      padding: "14px 16px"
                    }}>
                      <div style={{
                        fontSize: "11px",
                        fontFamily: "'SF Mono', 'Fira Code', monospace",
                        color: "#f59e0b",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        marginBottom: "6px"
                      }}>Next challenge</div>
                      <p style={{
                        fontSize: "13px",
                        lineHeight: "1.65",
                        color: "#A0A0A0",
                        margin: 0
                      }}>
                        {reflections[p.id].coaching.nextChallenge}
                      </p>
                    </div>
                  )}

                  {/* Skill Connection */}
                  {reflections[p.id].coaching.skillConnection && (
                    <div style={{
                      background: "#e9456010",
                      border: "1px solid #e9456033",
                      borderRadius: "6px",
                      padding: "14px 16px"
                    }}>
                      <div style={{
                        fontSize: "11px",
                        fontFamily: "'SF Mono', 'Fira Code', monospace",
                        color: "#e94560",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        marginBottom: "6px"
                      }}>Real-world connection</div>
                      <p style={{
                        fontSize: "13px",
                        lineHeight: "1.65",
                        color: "#A0A0A0",
                        margin: 0
                      }}>
                        {reflections[p.id].coaching.skillConnection}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {p.takeaway && p.takeaway.length > 0 && (
            <div style={{
              background: `${colors.accent}08`,
              border: `1px solid ${colors.accent}55`,
              borderRadius: "8px",
              padding: "24px 28px"
            }}>
              <h2 style={{
                fontSize: "11px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: colors.accent,
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontWeight: "600",
                marginBottom: "16px"
              }}>
                The Takeaway — AI Skills in Action
              </h2>
              <ul style={{
                margin: 0,
                padding: "0 0 0 20px",
                listStyleType: "none"
              }}>
                {p.takeaway.map((point, i) => (
                  <li key={i} style={{
                    fontSize: "14px",
                    lineHeight: "1.7",
                    color: "#B8B4AE",
                    marginBottom: "12px",
                    position: "relative",
                    paddingLeft: "8px"
                  }}>
                    <span style={{
                      position: "absolute",
                      left: "-20px",
                      color: colors.accent,
                      fontWeight: "700"
                    }}>
                      •
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#151C28",
      color: "#E8E6E3",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      padding: "0"
    }}>
      {playbookTourStep !== null && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.75)",
          zIndex: 1000,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: "80px",
          padding: "80px 20px 20px"
        }}>
          <div style={{
            maxWidth: "480px",
            width: "100%",
            background: "linear-gradient(135deg, #1A2230 0%, #151C28 100%)",
            border: "1px solid #e9456055",
            borderRadius: "12px",
            padding: "32px 28px 24px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
          }}>
            {playbookTourStep === 0 && (<>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px"
              }}>
                <span style={{
                  background: "#e9456022",
                  color: "#e94560",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  fontWeight: "700"
                }}>PROJECT</span>
                <span style={{
                  fontSize: "11px",
                  color: "#6A6A6A",
                  fontFamily: "'SF Mono', 'Fira Code', monospace"
                }}>STEP 1 OF 4</span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "400", margin: "0 0 10px 0" }}>
                Project Creation Prompt
              </h3>
              <p style={{ color: "#A0A0A0", fontSize: "13px", lineHeight: "1.65", margin: 0 }}>
                At the top of your practices, you'll find a ready-made <strong style={{ color: "#e94560" }}>system prompt</strong>. Copy it into a new Claude Project to keep every AI conversation calibrated to your role, skill level, and communication style — no re-explaining yourself each time.
              </p>
            </>)}
            {playbookTourStep === 1 && (<>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px"
              }}>
                <span style={{
                  background: "#f59e0b22",
                  color: "#f59e0b",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  fontWeight: "700"
                }}>PRACTICES</span>
                <span style={{
                  fontSize: "11px",
                  color: "#6A6A6A",
                  fontFamily: "'SF Mono', 'Fira Code', monospace"
                }}>STEP 2 OF 4</span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "400", margin: "0 0 10px 0" }}>
                Your 10 Practices
              </h3>
              <p style={{ color: "#A0A0A0", fontSize: "13px", lineHeight: "1.65", margin: 0 }}>
                Each card is a self-contained exercise. <strong style={{ color: "#D0CEC8" }}>Click any card</strong> to expand it and see the full protocol, the bridge explaining why it matters, and a skill-building takeaway. Practices are labeled as <strong style={{ color: "#22c55e" }}>Micro-Habit</strong> (quick, 5-15 min) or <strong style={{ color: "#f59e0b" }}>Deep Dive</strong> (longer, 30-60 min).
              </p>
            </>)}
            {playbookTourStep === 2 && (<>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px"
              }}>
                <span style={{
                  background: "#4a9aba22",
                  color: "#4a9aba",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  fontWeight: "700"
                }}>PROMPTS</span>
                <span style={{
                  fontSize: "11px",
                  color: "#6A6A6A",
                  fontFamily: "'SF Mono', 'Fira Code', monospace"
                }}>STEP 3 OF 4</span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "400", margin: "0 0 10px 0" }}>
                Copy & Paste Prompts
              </h3>
              <p style={{ color: "#A0A0A0", fontSize: "13px", lineHeight: "1.65", margin: 0 }}>
                Inside each practice, look for <strong style={{ color: "#D0CEC8" }}>The Prompt</strong> — a collapsible section with a ready-to-use AI prompt. Hit <strong style={{ color: "#D0CEC8" }}>COPY</strong>, paste it into Claude or any AI tool, and replace the <strong style={{ color: "#e94560" }}>[PLACEHOLDER]</strong> markers with your own data. The prompt is pre-calibrated to your experience level.
              </p>
            </>)}
            {playbookTourStep === 3 && (<>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px"
              }}>
                <span style={{
                  background: "#22c55e22",
                  color: "#22c55e",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  fontWeight: "700"
                }}>TRACKING</span>
                <span style={{
                  fontSize: "11px",
                  color: "#6A6A6A",
                  fontFamily: "'SF Mono', 'Fira Code', monospace"
                }}>STEP 4 OF 4</span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "400", margin: "0 0 10px 0" }}>
                Track Your Progress
              </h3>
              <p style={{ color: "#A0A0A0", fontSize: "13px", lineHeight: "1.65", margin: "0 0 12px 0" }}>
                After completing a practice, hit <strong style={{ color: "#22c55e" }}>Mark as Completed</strong> at the bottom of the detail view. Your progress is saved automatically — come back anytime and pick up where you left off. If a practice doesn't fit, use the <strong style={{ color: "#D0CEC8" }}>Regenerate</strong> button to get a fresh one.
              </p>
            </>)}
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", margin: "20px 0 16px" }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: i === playbookTourStep ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: i === playbookTourStep ? "#e94560" : "#ffffff22",
                  transition: "all 0.3s ease"
                }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {playbookTourStep > 0 && (
                <button
                  onClick={() => setPlaybookTourStep(playbookTourStep - 1)}
                  style={{
                    padding: "12px 16px",
                    background: "transparent",
                    border: "1px solid #ffffff25",
                    borderRadius: "6px",
                    color: "#8A8A8A",
                    fontSize: "12px",
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    cursor: "pointer",
                    letterSpacing: "1px"
                  }}
                >← BACK</button>
              )}
              <button
                onClick={() => {
                  if (playbookTourStep < 3) setPlaybookTourStep(playbookTourStep + 1);
                  else dismissPlaybookTour();
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: playbookTourStep === 3 ? "linear-gradient(135deg, #e94560 0%, #c84b31 100%)" : "transparent",
                  border: playbookTourStep === 3 ? "none" : "1px solid #e94560",
                  borderRadius: "6px",
                  color: playbookTourStep === 3 ? "#fff" : "#e94560",
                  fontSize: "12px",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {playbookTourStep === 3 ? "Got it — Let's go!" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{
        background: "linear-gradient(180deg, #1A2230 0%, #151C28 100%)",
        borderBottom: "1px solid #ffffff08",
        padding: "40px 32px 32px",
        textAlign: "center"
      }}>
        <p style={{
          fontSize: "11px",
          letterSpacing: "4px",
          textTransform: "uppercase",
          color: "#6E6E6E",
          margin: "0 0 8px 0",
          fontFamily: "'SF Mono', 'Fira Code', monospace"
        }}>
          {config.company}
        </p>
        <h1 style={{
          fontSize: "32px",
          fontWeight: "400",
          margin: "0 0 8px 0",
          letterSpacing: "-0.5px",
          lineHeight: "1.15"
        }}>
          Your Personalized Playbook
        </h1>
        <p style={{
          color: "#6A6A6A",
          fontSize: "14px",
          margin: "0 0 20px 0",
          maxWidth: "500px",
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: "1.5"
        }}>
          10 practices tailored to your career path, data sources, and time commitment.
        </p>
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "32px",
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          fontSize: "12px",
          flexWrap: "wrap"
        }}>
          <span style={{ color: "#6E6E6E" }}>
            COMPLETED: <span style={{ color: "#22c55e" }}>{completedCount}</span>/10
          </span>
          <span style={{ color: "#6E6E6E" }}>
            TIME: <span style={{ color: "#f59e0b" }}>{config.duration} hrs/week</span>
          </span>
          <span style={{ color: "#6E6E6E" }}>
            AI: <span style={{ color: "#e94560" }}>{config.aiModels}</span>
          </span>
        </div>
        <button
          onClick={() => {
            setSetupComplete(false);
            setShowLibrary(true);
            setActiveCard(null);
          }}
          style={{
            marginTop: "20px",
            background: "transparent",
            border: "1px solid #ffffff25",
            color: "#8A8A8A",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "11px",
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            letterSpacing: "1px"
          }}
        >
          ← Back to Library
        </button>
      </div>

      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "32px 24px"
      }}>
        {/* Project Creation Prompt */}
        {(() => {
          const workLevel = config.workExperience <= 3 ? "beginner — explain concepts from first principles, assume no domain knowledge"
            : config.workExperience <= 6 ? "intermediate — working knowledge assumed, focus on practical application"
            : config.workExperience <= 8 ? "advanced — deep expertise assumed, use advanced techniques with no hand-holding"
            : "expert — mastery-level, discuss cutting-edge techniques and strategic implications";
          
          const aiLevel = config.aiExperience <= 3 ? "beginner — provide detailed, step-by-step prompting instructions"
            : config.aiExperience <= 6 ? "intermediate — standard prompting familiarity assumed, explain when introducing new techniques"
            : config.aiExperience <= 8 ? "advanced — comfortable with chain-of-thought, few-shot prompting, and structured outputs"
            : "expert — familiar with meta-prompting, RAG concepts, and agentic workflows";

          const toneDesc = config.commStyle === "formal"
            ? "Use formal, structured language throughout. Write with precision and professionalism suitable for executive or client-facing contexts. Avoid colloquialisms and keep tone authoritative."
            : config.commStyle === "casual"
            ? "Use conversational, relaxed language throughout. Explain concepts naturally as if talking to a peer. Prioritize clarity and engagement over formality. Keep things approachable and direct."
            : "Use clear, professional language that is approachable but business-appropriate. Balance thoroughness with readability. Be direct without being stiff.";

          const projectPrompt = `You are a professional development coach and AI skills trainer.

ABOUT THE USER:
- Role: ${config.company}
- Work Description: ${config.industry}
- Available Data Sources: ${config.dataAccess}
- AI Tools in Use: ${config.aiModels}
- Time Commitment: ${config.duration} hours per week
- Work Experience Level: ${config.workExperience}/10 (${workLevel})
- AI/Prompting Experience Level: ${config.aiExperience}/10 (${aiLevel})

COMMUNICATION STYLE:
${toneDesc}

YOUR GOAL:
The user is building professional skills through hands-on, AI-driven practice exercises tailored to their actual work. Every response you give should be grounded in their role, data sources, and tools listed above.

CALIBRATION RULES:
- Match technical depth to their work experience level (${config.workExperience}/10). ${config.workExperience <= 4 ? "Define jargon before using it. Build up from fundamentals." : config.workExperience <= 7 ? "You can assume familiarity with core concepts in their field." : "Speak peer-to-peer. Skip basics entirely."}
- Match AI/prompting complexity to their AI experience level (${config.aiExperience}/10). ${config.aiExperience <= 4 ? "Walk through prompts step-by-step. Explain why each part of a prompt matters." : config.aiExperience <= 7 ? "Reference prompting best practices without over-explaining." : "Discuss advanced patterns freely — they'll keep up."}
- Reference their specific data sources and tools when suggesting exercises or examples.
- Keep all guidance actionable and directly applicable to their professional context.
- Respect their time commitment of ${config.duration} hours/week — scope suggestions accordingly.`;

          return (
            <div style={{ marginBottom: "24px" }}>
              <button
                onClick={() => setShowProjectPrompt(!showProjectPrompt)}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #1A2230 0%, #151C28 100%)",
                  border: "1px solid #e9456066",
                  borderRadius: showProjectPrompt ? "8px 8px 0 0" : "8px",
                  padding: "18px 24px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#e94560aa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e9456066';
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    background: "#e9456022",
                    color: "#e94560",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    fontWeight: "700"
                  }}>
                    PROJECT
                  </span>
                  <span style={{
                    fontSize: "16px",
                    fontWeight: "400",
                    color: "#E8E6E3",
                    fontFamily: "'Georgia', 'Times New Roman', serif"
                  }}>
                    Project Creation Prompt
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    fontSize: "11px",
                    color: "#6A6A6A",
                    fontFamily: "'SF Mono', 'Fira Code', monospace"
                  }}>
                    Copy & paste into a new Claude Project
                  </span>
                  <span style={{ color: "#e94560", fontSize: "16px" }}>
                    {showProjectPrompt ? "▲" : "▼"}
                  </span>
                </div>
              </button>
              {showProjectPrompt && (
                <div style={{
                  background: "#10151E",
                  border: "1px solid #e9456066",
                  borderTop: "none",
                  borderRadius: "0 0 8px 8px",
                  padding: "24px",
                  position: "relative"
                }}>
                  <p style={{
                    fontSize: "12px",
                    color: "#8A8A8A",
                    margin: "0 0 16px 0",
                    lineHeight: "1.6",
                    fontFamily: "'Georgia', 'Times New Roman', serif"
                  }}>
                    This prompt was auto-generated from your setup inputs. Paste it into a <strong style={{ color: "#e94560" }}>Claude Project's system prompt</strong> to keep every conversation in that project calibrated to your role, skill level, and communication style.
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(projectPrompt)}
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      background: "#e9456055",
                      border: "none",
                      color: "#fff",
                      padding: "6px 14px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                      letterSpacing: "1px",
                      fontWeight: "600"
                    }}
                  >
                    COPY
                  </button>
                  <pre style={{
                    fontSize: "12px",
                    lineHeight: "1.7",
                    color: "#A0A0A0",
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
                    background: "#10151E",
                    padding: "20px",
                    borderRadius: "6px",
                    border: "1px solid #ffffff18"
                  }}>
                    {projectPrompt}
                  </pre>
                </div>
              )}
            </div>
          );
        })()}

        {practices.map((p) => {
          const colors = skillColors[p.jlSkill] || { bg: "#182030", accent: "#e94560" };
          return (
            <div
              key={p.id}
              onClick={() => setActiveCard(p.id)}
              style={{
                background: `linear-gradient(135deg, ${colors.bg}88 0%, #151C28 100%)`,
                border: `1px solid ${completed[p.id] ? '#22c55e66' : colors.accent + '55'}`,
                borderRadius: "8px",
                padding: "24px 28px",
                marginBottom: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.accent + '66';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = completed[p.id] ? '#22c55e66' : colors.accent + '55';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              {completed[p.id] && (
                <div style={{
                  position: "absolute",
                  top: "0",
                  right: "0",
                  background: "#22c55e",
                  color: "#000",
                  padding: "2px 12px",
                  fontSize: "10px",
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontWeight: "700",
                  borderRadius: "0 8px 0 4px",
                  letterSpacing: "1px"
                }}>
                  DONE
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{
                      color: "#505050",
                      fontSize: "12px",
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                      fontWeight: "700"
                    }}>
                      {String(p.id).padStart(2, '0')}
                    </span>
                    <span style={{
                      background: p.scale === "Micro-Habit" ? "#22c55e18" : "#f59e0b18",
                      color: p.scale === "Micro-Habit" ? "#22c55e" : "#f59e0b",
                      padding: "2px 8px",
                      borderRadius: "3px",
                      fontSize: "10px",
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                      letterSpacing: "1px",
                      textTransform: "uppercase"
                    }}>
                      {p.scale} — {p.time}
                    </span>
                  </div>
                  <h3 style={{
                    fontSize: "18px",
                    fontWeight: "400",
                    margin: "0 0 6px 0",
                    color: "#E8E6E3",
                    letterSpacing: "-0.3px"
                  }}>
                    {p.title}
                  </h3>
                  <p style={{
                    fontSize: "12px",
                    color: colors.accent,
                    margin: 0,
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    opacity: 0.8
                  }}>
                    {p.jlSkill}
                  </p>
                </div>
                <span style={{
                  color: "#444444",
                  fontSize: "20px",
                  marginLeft: "16px",
                  marginTop: "16px"
                }}>
                  →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}