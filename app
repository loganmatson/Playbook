import { useState, useEffect } from "react";

const skillColors = {
  "Enterprise Risk Management (ERM)": { bg: "#1a1a2e", accent: "#e94560" },
  "SOC 1, 2 & 3 Reporting": { bg: "#16213e", accent: "#0f3460" },
  "IT Risk Assessment / Technology Risk": { bg: "#1b1b2f", accent: "#e23e57" },
  "Data Analytics & Business Intelligence": { bg: "#0d1b2a", accent: "#1b4965" },
  "Internal Controls over Financial Reporting (ICFR)": { bg: "#1a1a2e", accent: "#c84b31" },
  "IT General Controls — Change Management": { bg: "#162447", accent: "#e43f5a" },
  "Assurance & Analytical Procedures": { bg: "#1b262c", accent: "#0f4c75" },
  "IT General Controls — Logical Access": { bg: "#1f1147", accent: "#6639a6" },
  "Audit Planning — Materiality Determination": { bg: "#0a1628", accent: "#1e56a0" },
  "Quality Control & Engagement Wrap-Up": { bg: "#1c1427", accent: "#7b2d8e" }
};

export default function YourPlaybook() {
  const [loading, setLoading] = useState(true);
  const [savedPlaybooks, setSavedPlaybooks] = useState([]);
  const [currentPlaybook, setCurrentPlaybook] = useState(null);
  const [setupComplete, setSetupComplete] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [config, setConfig] = useState({
    company: "",
    industry: "",
    duration: "",
    dataType: "personal",
    dataAccess: "",
    aiModels: "",
    workExperience: 5,
    aiExperience: 5,
    recentTask: "",
    tediousWork: "",
    skillFocus: []
  });
  const [practices, setPractices] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [completed, setCompleted] = useState({});
  const [showPrompt, setShowPrompt] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [regenerating, setRegenerating] = useState(null);

  useEffect(() => {
    loadPlaybooks();
  }, []);

  useEffect(() => {
    if (currentPlaybook && Object.keys(completed).length > 0) {
      saveCompletionState();
    }
  }, [completed]);

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
        setCurrentPlaybook(playbookId);
        setSetupComplete(true);
        
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
    setGenerating(true);
    setShowCustomize(false);

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
3. Can be completed within their time constraints (${config.duration} hours/week total)
4. Leverage the AI models they have access to
5. Build real consulting skills applicable to their future career
${config.recentTask ? '6. Include at least 2 practices directly related to the recent task they mentioned' : ''}
${config.tediousWork ? '7. Include at least 1 practice that addresses their repetitive/tedious work' : ''}
${config.skillFocus.length > 0 ? `8. Prioritize practices that develop these skills: ${config.skillFocus.join(', ')}` : ''}

IMPORTANT: The "protocol" section must contain IMMEDIATE, ACTIONABLE steps - not vague suggestions. Each step should tell them exactly what to DO right now (e.g., "Open this file", "Export this data", "Paste into the prompt"). Think: "If I had 10 minutes right now, what exact actions would I take?"

CRITICAL CALIBRATION INSTRUCTIONS - EXPERTISE LEVELS:

Work Experience Level (${config.workExperience}/10):
  * 1-2 (Absolute Beginner): Explain every business concept from first principles. Assume zero domain knowledge. Include extensive "why this matters" context. Define all jargon. Use analogies to explain industry-specific processes.
  * 3-4 (Learning): Explain core concepts but assume basic familiarity. Provide moderate context. Define technical terms when first used.
  * 5-6 (Competent): Assume working knowledge of their field. Focus on application over explanation. Minimal jargon definition needed.
  * 7-8 (Advanced/Expert): Assume deep expertise. Skip foundational explanations entirely. Focus on optimization, edge cases, and advanced techniques. Reference industry frameworks and methodologies by name without explanation.
  * 9-10 (Master/Thought Leader): Assume mastery-level expertise. Practices should push boundaries, explore emerging techniques, challenge conventional approaches. Reference cutting-edge industry research, advanced frameworks, and strategic implications. No hand-holding.

AI/Prompting Experience Level (${config.aiExperience}/10):
  * 1-2 (Never Used AI): Provide extremely detailed prompting instructions. Explain what AI is doing and why. Include tips like "copy this entire prompt" and "paste your data where it says [PLACEHOLDER]". Show exactly where to find AI response. Use simple, single-step prompts.
  * 3-4 (Basic User): Standard prompt templates with explanations of key parts. Moderate hand-holding. Explain prompting techniques used (e.g., "We're asking for structured output because...").
  * 5-6 (Comfortable): Assume familiarity with basic prompting. Minimal explanation of prompt structure. Can handle multi-turn conversations and basic techniques.
  * 7-8 (Advanced): Use sophisticated prompting techniques without explanation: few-shot learning, chain-of-thought reasoning, role-based prompting, system instructions, structured outputs, prompt chaining. Assume they understand concepts like temperature, token limits, context windows.
  * 9-10 (Expert/Prompt Engineer): Deploy cutting-edge techniques: constitutional AI principles, meta-prompting, adversarial prompting for robustness testing, prompt optimization strategies, retrieval-augmented generation concepts, agentic workflows, tool use, and API integration patterns. Assume deep understanding of LLM architecture and behavior.

Each practice should follow this EXACT JSON structure:
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

CRITICAL: Return ONLY a valid JSON array of 10 practices. No preamble, no explanation, no markdown formatting. Just the JSON array starting with [ and ending with ].`
            }
          ]
        })
      });

      const data = await response.json();
      const text = data.content.find(c => c.type === "text")?.text || "";
      
      let jsonText = text.trim();
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      
      const generatedPractices = JSON.parse(jsonText);
      setPractices(generatedPractices);
      setSetupComplete(true);
      
      await savePlaybook(config, generatedPractices);
    } catch (error) {
      console.error("Error generating practices:", error);
      alert("Failed to generate practices. Please try again or check your inputs.");
    } finally {
      setGenerating(false);
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
        background: "#0a0a0f",
        color: "#e8e6e3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'SF Mono', 'Fira Code', monospace"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid #ffffff22",
            borderTop: "3px solid #e94560",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }}></div>
          <p style={{ color: "#666", fontSize: "12px", letterSpacing: "2px" }}>LOADING PLAYBOOKS...</p>
        </div>
      </div>
    );
  }

  if (!setupComplete && savedPlaybooks.length > 0) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#e8e6e3",
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
              background: "linear-gradient(135deg, #12121a 0%, #0a0a0f 100%)",
              border: "1px solid #e9456033",
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
                color: "#888",
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
                    border: "1px solid #ffffff22",
                    borderRadius: "6px",
                    color: "#888",
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
            color: "#666",
            fontSize: "14px",
            margin: "0 0 32px 0",
            textAlign: "center"
          }}>
            {savedPlaybooks.length} saved {savedPlaybooks.length === 1 ? 'playbook' : 'playbooks'}
          </p>

          <button
            onClick={() => setSetupComplete(false)}
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
                  background: "linear-gradient(135deg, #12121a 0%, #0a0a0f 100%)",
                  border: "1px solid #ffffff11",
                  borderRadius: "8px",
                  padding: "24px",
                  marginBottom: "16px"
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
                      color: "#666",
                      fontSize: "12px",
                      margin: "0 0 8px 0",
                      fontFamily: "'SF Mono', 'Fira Code', monospace"
                    }}>
                      {playbook.config.duration} hours/week • {playbook.config.dataType === "personal" ? "Personal data" : playbook.config.dataType === "business" ? "Business data" : "Personal & business data"}
                    </p>
                    <p style={{
                      color: "#888",
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
                        border: "1px solid #ffffff22",
                        color: "#666",
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
                    background: "#ffffff11",
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
                  color: "#666",
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
        background: "#0a0a0f",
        color: "#e8e6e3",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}>
        <div style={{
          maxWidth: "700px",
          width: "100%",
          background: "linear-gradient(135deg, #12121a 0%, #0a0a0f 100%)",
          border: "1px solid #ffffff11",
          borderRadius: "12px",
          padding: "48px 40px"
        }}>
          <div style={{
            textAlign: "center",
            marginBottom: "32px",
            paddingBottom: "24px",
            borderBottom: "1px solid #ffffff11"
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
              color: "#666",
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
              color: "#ccc",
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
                background: "#0a0a0f",
                border: "1px solid #ffffff22",
                borderRadius: "6px",
                color: "#e8e6e3",
                fontSize: "14px",
                fontFamily: "inherit",
                boxSizing: "border-box",
                resize: "vertical"
              }}
            />
            <p style={{
              fontSize: "11px",
              color: "#555",
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
              color: "#ccc",
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
                background: "#0a0a0f",
                border: "1px solid #ffffff22",
                borderRadius: "6px",
                color: "#e8e6e3",
                fontSize: "14px",
                fontFamily: "inherit",
                boxSizing: "border-box",
                resize: "vertical"
              }}
            />
            <p style={{
              fontSize: "11px",
              color: "#555",
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
              color: "#ccc",
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
                    background: config.skillFocus.includes(skill) ? "#e9456022" : "#0a0a0f",
                    border: `1px solid ${config.skillFocus.includes(skill) ? "#e94560" : "#ffffff22"}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    transition: "all 0.2s ease"
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
              color: "#555",
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
                border: "1px solid #ffffff22",
                borderRadius: "6px",
                color: "#888",
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
      const motivationalQuotes = [
        { text: "The expert in anything was once a beginner.", source: "Helen Hayes" },
        { text: "The only way to do great work is to love what you do.", source: "Steve Jobs" },
        { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", source: "Winston Churchill" },
        { text: "The future depends on what you do today.", source: "Mahatma Gandhi" },
        { text: "Don't watch the clock; do what it does. Keep going.", source: "Sam Levenson" },
        { text: "The secret of getting ahead is getting started.", source: "Mark Twain" },
        { text: "It always seems impossible until it's done.", source: "Nelson Mandela" },
        { text: "The way to get started is to quit talking and begin doing.", source: "Walt Disney" }
      ];
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

      return (
        <div style={{
          minHeight: "100vh",
          background: "#0a0a0f",
          color: "#e8e6e3",
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
              border: "4px solid #ffffff22",
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
            
            <p style={{
              color: "#666",
              fontSize: "14px",
              margin: "0 0 48px 0",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              letterSpacing: "1px"
            }}>
              Generating 10 personalized practices...
            </p>

            <div style={{
              borderLeft: "3px solid #e94560",
              paddingLeft: "20px",
              marginBottom: "36px",
              fontStyle: "italic",
              color: "#999",
              textAlign: "left"
            }}>
              <p style={{ fontSize: "18px", margin: "0 0 8px 0", color: "#ccc", lineHeight: "1.5" }}>
                "{randomQuote.text}"
              </p>
              <p style={{ fontSize: "12px", margin: 0, fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                — {randomQuote.source}
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

    return (
      <div style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#e8e6e3",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}>
        <div style={{
          maxWidth: "600px",
          width: "100%",
          background: "linear-gradient(135deg, #12121a 0%, #0a0a0f 100%)",
          border: "1px solid #ffffff11",
          borderRadius: "12px",
          padding: "48px 40px"
        }}>
          {savedPlaybooks.length > 0 && (
            <button
              onClick={() => setSetupComplete(false)}
              style={{
                background: "transparent",
                border: "1px solid #ffffff22",
                color: "#888",
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                marginBottom: "20px"
              }}
              onMouseOver={(e) => e.currentTarget.style.color = "#e94560"}
              onMouseOut={(e) => e.currentTarget.style.color = "#888"}
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
            color: "#666",
            fontSize: "14px",
            margin: "0 0 32px 0",
            textAlign: "center",
            lineHeight: "1.5"
          }}>
            Tell us about your situation and we'll generate 10 personalized consulting practices.
          </p>

          <form onSubmit={handleSetupSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#888",
                marginBottom: "8px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                What is your job? Be specific.
              </label>
              <input
                type="text"
                value={config.company}
                onChange={(e) => setConfig({...config, company: e.target.value})}
                placeholder="e.g., Financial Analyst at Google, Product Manager at Stripe, Audit Associate"
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#0a0a0f",
                  border: "1px solid #ffffff22",
                  borderRadius: "6px",
                  color: "#e8e6e3",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
              />
              <p style={{
                fontSize: "11px",
                color: "#666",
                margin: "6px 0 0 0",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                lineHeight: "1.4"
              }}>
                Include your role AND company/organization. The more specific, the better.
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#888",
                marginBottom: "8px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                What do you actually do? Describe your work.
              </label>
              <textarea
                value={config.industry}
                onChange={(e) => setConfig({...config, industry: e.target.value})}
                placeholder="e.g., I build financial models for quarterly forecasting, analyze variance reports, and present findings to CFO. OR I conduct SOC 2 audits for tech companies, test internal controls, and draft compliance reports."
                required
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#0a0a0f",
                  border: "1px solid #ffffff22",
                  borderRadius: "6px",
                  color: "#e8e6e3",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  resize: "vertical"
                }}
              />
              <p style={{
                fontSize: "11px",
                color: "#666",
                margin: "6px 0 0 0",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                lineHeight: "1.4"
              }}>
                Think: What tasks fill my day? What deliverables do I create? What skills does my job require?
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#888",
                marginBottom: "8px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                Time Commitment (hours per week)
              </label>
              <input
                type="text"
                value={config.duration}
                onChange={(e) => setConfig({...config, duration: e.target.value})}
                placeholder="e.g., 3-5, 2, 10"
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#0a0a0f",
                  border: "1px solid #ffffff22",
                  borderRadius: "6px",
                  color: "#e8e6e3",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
              />
              <p style={{
                fontSize: "11px",
                color: "#666",
                margin: "6px 0 0 0",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                lineHeight: "1.4"
              }}>
                Just enter the number (we'll assume hours per week). If you write "5", we read it as "5 hours/week".
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#888",
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
                  background: config.dataType === "personal" ? "#e9456022" : "#0a0a0f",
                  border: `1px solid ${config.dataType === "personal" ? "#e94560" : "#ffffff22"}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
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
                    <div style={{ fontSize: "14px", color: "#e8e6e3", marginBottom: "2px" }}>
                      Personal Data
                    </div>
                    <div style={{ fontSize: "11px", color: "#666", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                      Use your own data for self-improvement and insights
                    </div>
                  </div>
                </label>
                
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: config.dataType === "business" ? "#e9456022" : "#0a0a0f",
                  border: `1px solid ${config.dataType === "business" ? "#e94560" : "#ffffff22"}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
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
                    <div style={{ fontSize: "14px", color: "#e8e6e3", marginBottom: "2px" }}>
                      Business Data
                    </div>
                    <div style={{ fontSize: "11px", color: "#666", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                      Use work data to practice professional skills (public or private with permission)
                    </div>
                  </div>
                </label>
                
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: config.dataType === "both" ? "#e9456022" : "#0a0a0f",
                  border: `1px solid ${config.dataType === "both" ? "#e94560" : "#ffffff22"}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
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
                    <div style={{ fontSize: "14px", color: "#e8e6e3", marginBottom: "2px" }}>
                      Both Personal & Business
                    </div>
                    <div style={{ fontSize: "11px", color: "#666", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                      Combination of personal and work-related data
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
                color: "#888",
                marginBottom: "8px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                {config.dataType === "personal" 
                  ? "List Your Personal Data Sources" 
                  : config.dataType === "business"
                  ? "List Business/Work Data You Can Access"
                  : "List Both Personal & Business Data Sources"}
              </label>
              <textarea
                value={config.dataAccess}
                onChange={(e) => setConfig({...config, dataAccess: e.target.value})}
                placeholder={
                  config.dataType === "personal"
                    ? "e.g., Whoop wearable data, Spotify history, bank statements, calendar data, email archives"
                    : config.dataType === "business"
                    ? "e.g., Sales pipeline data, customer feedback surveys, financial statements, marketing analytics, public competitor data"
                    : "e.g., Personal: Whoop data, Spotify history. Business: Sales reports, customer surveys, public market data"
                }
                required
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#0a0a0f",
                  border: "1px solid #ffffff22",
                  borderRadius: "6px",
                  color: "#e8e6e3",
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
                color: "#888",
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
                  background: "#0a0a0f",
                  border: "1px solid #ffffff22",
                  borderRadius: "6px",
                  color: "#e8e6e3",
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
                color: "#888",
                marginBottom: "12px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                Work Experience Level: {config.workExperience}/10
              </label>
              <p style={{
                fontSize: "11px",
                color: "#666",
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
                  background: `linear-gradient(to right, #e94560 0%, #e94560 ${(config.workExperience - 1) * 11.11}%, #ffffff22 ${(config.workExperience - 1) * 11.11}%, #ffffff22 100%)`,
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
                color: "#555",
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
                color: "#888",
                marginBottom: "12px",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                AI / Prompting Experience Level: {config.aiExperience}/10
              </label>
              <p style={{
                fontSize: "11px",
                color: "#666",
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
                  background: `linear-gradient(to right, #1b4965 0%, #1b4965 ${(config.aiExperience - 1) * 11.11}%, #ffffff22 ${(config.aiExperience - 1) * 11.11}%, #ffffff22 100%)`,
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
                color: "#555",
                fontFamily: "'SF Mono', 'Fira Code', monospace"
              }}>
                <span>Beginner</span>
                <span>Advanced</span>
              </div>
            </div>

            <button
              type="submit"
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
              color: "#666",
              margin: "12px 0 0 0",
              textAlign: "center",
              fontFamily: "'SF Mono', 'Fira Code', monospace"
            }}>
              Next: Optional customization to make practices even better
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (activeCard !== null) {
    const p = practices.find(pr => pr.id === activeCard);
    const colors = skillColors[p.jlSkill] || { bg: "#1a1a2e", accent: "#e94560" };
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#e8e6e3",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        padding: "0"
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${colors.bg} 0%, #0a0a0f 100%)`,
          borderBottom: `2px solid ${colors.accent}33`,
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
              background: regenerating === p.id ? "#333" : "none",
              border: `1px solid ${colors.accent}55`,
              color: regenerating === p.id ? "#666" : colors.accent,
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
              color: "#666",
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
            color: "#999"
          }}>
            <p style={{ fontSize: "16px", margin: "0 0 6px 0", color: "#ccc", lineHeight: "1.5" }}>
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
              color: "#b8b5b0",
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
                  color: "#a8a5a0",
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
                border: `1px solid ${colors.accent}44`,
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
                background: "#111118",
                border: `1px solid ${colors.accent}22`,
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
                  color: "#8a8780",
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

          {p.takeaway && p.takeaway.length > 0 && (
            <div style={{
              background: `${colors.accent}08`,
              border: `1px solid ${colors.accent}22`,
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
                    color: "#b8b5b0",
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
      background: "#0a0a0f",
      color: "#e8e6e3",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      padding: "0"
    }}>
      <div style={{
        background: "linear-gradient(180deg, #12121a 0%, #0a0a0f 100%)",
        borderBottom: "1px solid #ffffff08",
        padding: "40px 32px 32px",
        textAlign: "center"
      }}>
        <p style={{
          fontSize: "11px",
          letterSpacing: "4px",
          textTransform: "uppercase",
          color: "#555",
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
          color: "#666",
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
          <span style={{ color: "#555" }}>
            COMPLETED: <span style={{ color: "#22c55e" }}>{completedCount}</span>/10
          </span>
          <span style={{ color: "#555" }}>
            TIME: <span style={{ color: "#f59e0b" }}>{config.duration} hrs/week</span>
          </span>
          <span style={{ color: "#555" }}>
            AI: <span style={{ color: "#e94560" }}>{config.aiModels}</span>
          </span>
        </div>
        <button
          onClick={() => {
            setSetupComplete(false);
            setActiveCard(null);
          }}
          style={{
            marginTop: "20px",
            background: "transparent",
            border: "1px solid #ffffff22",
            color: "#888",
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
        {practices.map((p) => {
          const colors = skillColors[p.jlSkill] || { bg: "#1a1a2e", accent: "#e94560" };
          return (
            <div
              key={p.id}
              onClick={() => setActiveCard(p.id)}
              style={{
                background: `linear-gradient(135deg, ${colors.bg}88 0%, #0a0a0f 100%)`,
                border: `1px solid ${completed[p.id] ? '#22c55e33' : colors.accent + '22'}`,
                borderRadius: "8px",
                padding: "24px 28px",
                marginBottom: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.accent + '66';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = completed[p.id] ? '#22c55e33' : colors.accent + '22';
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
                      color: "#444",
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
                    color: "#e8e6e3",
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
                  color: "#333",
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
