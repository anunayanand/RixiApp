const Groq = require("groq-sdk");

// Initialize Groq client
let groqClient = null;

try {
  if (process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } else {
    console.warn("GROQ_API_KEY is not set in the environment variables.");
  }
} catch (err) {
  console.error("Failed to initialize Groq client:", err);
}

/**
 * Generate a professional analysis of the batch data using Groq LLM
 * @param {Object} stats The aggregated statistics for the batch
 * @returns {Promise<String>} The generated HTML analysis text
 */
async function generateBatchAnalysis(stats) {
  if (!groqClient) {
    return "<p><em>AI Analysis is currently unavailable. Please check your API key configuration.</em></p>";
  }

  const prompt = `
  You are an expert Data Analyst and Program Manager at Rixi Lab.
  I am generating a performance and demographic report for Batch ${stats.batchNo}.
  
  Here are the statistics for this batch:
  - Total Interns: ${stats.totalInterns}
  - Certified Interns: ${stats.certifiedInterns} (${stats.certificationRate}%)
  - Average Quiz Score: ${stats.averageQuizScore}%
  - Total Income from Batch: ₹${stats.totalIncome}
  - Total Projects Submitted: ${stats.totalProjects}
    - Accepted: ${stats.projectsAccepted}
    - Rejected: ${stats.projectsRejected}
    - Pending: ${stats.projectsPending}
  - Top Domains: ${stats.topDomains.join(", ")}
  - Top Colleges: ${stats.topColleges.join(", ")}
  - Interns via Referral: ${stats.referralCount}

  Write a professional executive analysis of these metrics.
  Format your response STRICTLY as a valid JSON object with exactly these keys:
  {
    "executiveSummary": "A concise 2-3 sentence overview analyzing the overall batch performance.",
    "keyHighlights": ["strength 1", "strength 2", "strength 3"],
    "areasForImprovement": ["improvement 1", "improvement 2"],
    "actionItems": ["action 1", "action 2", "action 3"],
    "operationalRating": "A short, analytical phrase evaluating the cohort (e.g. 'High Performing Cohort', 'Stable Operational Batch', 'Performance Improvement Recommended')"
  }
  Do not include any markdown code blocks, do not include raw HTML, just return the raw JSON object.
  `;

  try {
    const chatCompletion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional Data Analyst. You output clean, valid JSON only. No explanations, no markdown formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    let analysisText = chatCompletion.choices[0]?.message?.content || "{}";
    
    // Clean up any markdown code blocks if the AI accidentally adds them
    analysisText = analysisText.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(analysisText);
  } catch (error) {
    console.error("Groq Analysis Error:", error);
    return {
      executiveSummary: "Analysis generation failed or timed out.",
      keyHighlights: [],
      areasForImprovement: ["Verify API configuration"],
      actionItems: ["Check system logs for Groq API errors"],
      operationalRating: "Data Unavailable"
    };
  }
}

module.exports = { generateBatchAnalysis };
