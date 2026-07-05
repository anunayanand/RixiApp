const Groq = require("groq-sdk");
const Bootcamp = require("../../models/Bootcamp");

let groqClient = null;

try {
  if (process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } else {
    console.warn("GROQ_API_KEY is not set for Chatbot.");
  }
} catch (err) {
  console.error("Failed to initialize Groq client for Chatbot:", err);
}

// In-memory cache for dynamic context
let contextCache = {
  data: null,
  lastFetched: null,
};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function getDynamicContext() {
  const now = Date.now();
  if (contextCache.data && contextCache.lastFetched && (now - contextCache.lastFetched < CACHE_TTL)) {
    return contextCache.data;
  }

  try {
    // Fetch live bootcamps
    const liveBootcamps = await Bootcamp.find({ status: 'live' }).lean();
    let bootcampText = "Current Active Bootcamps:\n";
    if (liveBootcamps.length === 0) {
      bootcampText += "None at the moment.\n";
    } else {
      liveBootcamps.forEach(bc => {
        bootcampText += `- ${bc.name}: ${bc.description}. (Paid: ${bc.isPaid}, Price: ${bc.payment?.amount} ${bc.payment?.currency})\n`;
      });
    }
    bootcampText += "\nBootcamp Certificate Process: Upon successful completion of a bootcamp and submitting all required assignments or projects, students receive an industry-recognized certificate.\n";
    bootcampText += "Past Bootcamps: We have successfully conducted previous bootcamps in various domains like Web Development and Data Analytics. Past bootcamps have included both free introductory cohorts and premium paid programs.\n";

    // Internship Programs Context
    const internshipText = `
Internship Programs:
RixiLab Technologies offers virtual internships and training programs. Students can register, complete projects, submit feedback, and get certified.
To learn more, direct users to the specific page at the endpoint: /internship
Available Internship Domains & Registration Charges (in INR):
- Web Development: ₹100
- Data Analytics: ₹150
- DSA (Data Structures & Algorithms): ₹124
- Graphics Design: ₹100
- Python Programming: ₹149
- Java Programming: ₹174
- Full Stack Development: ₹124
- Machine Learning: ₹200
- Artificial Intelligence: ₹200
    `;

    // Campus Ambassador Program Context
    const capText = `
Campus Ambassador Program (CAP):
RixiLab Technologies offers a Campus Ambassador Program where students represent us on their college campuses.
Status: The CAP is LIVE all the time! We accept applications year-round.
How Earning & Stipends Work: Ambassadors earn a stipend and financial rewards based on their performance. They earn by successfully driving referrals, promoting RixiLab programs, and building community engagement. The more active they are, the higher their earnings.
They also receive certificates of leadership and excellence. They act as a bridge between the student community and RixiLab Technologies.
To learn more or apply, direct users to the specific page at the endpoint: /cap
    `;

    const fullContext = bootcampText + "\n" + internshipText + "\n" + capText;
    
    // Update cache
    contextCache.data = fullContext;
    contextCache.lastFetched = now;

    return fullContext;
  } catch (err) {
    console.error("Error fetching context for chatbot:", err);
    return "Context unavailable.";
  }
}

/**
 * Handle user query with Rixi AI chatbot
 */
async function handleUserQuery(userMessage, chatHistory = [], userData = null) {
  if (!groqClient) {
    return { reply: "I'm sorry, my AI brain is currently disconnected (API key missing)." };
  }

  const dynamicData = await getDynamicContext();

  const baseUrl = process.env.BASE_URL || 'https://rixilab.in';
  
  let personalizedGreeting = "";
  if (userData && userData.name) {
    personalizedGreeting = `\nThe user you are speaking to is named ${userData.name}. Greet them personally and use their name when appropriate.`;
  } else if (userData && userData.email) {
    personalizedGreeting = `\nThe user you are speaking to is logged in with email ${userData.email}.`;
  }

  const systemPrompt = `
You are Rixi, a friendly, helpful, and professional AI assistant for RixiLab Technologies.
Your primary role is to help users navigate our website, learn about our Bootcamps, Internships, and other educational offerings.${personalizedGreeting}

Here is the latest data about our current offerings:
---
${dynamicData}
---

Base URL of the website: ${baseUrl}

Rules:
1. Always be polite, concise, and helpful. Treat the data provided above as the complete and authoritative truth. Do not say you lack specific information; present the provided information confidently.
2. If asked about pricing or available programs, refer to the data provided above.
3. Do not make up any courses, bootcamps, or prices that are not listed above.
4. If you don't know the answer, politely say you don't know and advise them to contact support.
5. You are an AI, keep your responses relatively short so they fit well in a chat window. However, when listing multiple items (like courses, domains, or prices), ALWAYS format them as a Markdown bulleted list for better readability.
6. When a user asks to be directed to a specific page or if you are providing a link, ALWAYS construct the full URL by combining the Base URL provided above with the specific endpoint/path (e.g., ${baseUrl}/internship). You MUST format links as Markdown hyperlinks using a short, descriptive name instead of raw URLs (e.g., [Internships](${baseUrl}/internship), [CAP](${baseUrl}/cap)). Never output the raw URL directly.
7. You MUST respond with a valid JSON object in the exact following format:
{
  "reply": "Your markdown-formatted text response to the user here.",
  "suggestions": ["Short question 1?", "Short question 2?"]
}
Provide exactly 2 to 3 VERY SHORT (maximum 3 to 5 words) contextually relevant follow-up phrases as suggestions. Phrase these suggestions from the USER's perspective (e.g., "Tell me more", "I want to apply", "What are the fees?"). They should encourage the user to explore and understand the offerings. Never phrase them as the AI asking the user a question (e.g., do NOT output "Would you like to know more?").
  `;

  const messages = [
    { role: "system", content: systemPrompt },
    ...chatHistory,
    { role: "user", content: userMessage }
  ];

  try {
    const chatCompletion = await groqClient.chat.completions.create({
      messages: messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 400,
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (content) {
      try {
        return JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse JSON response from LLM:", e);
        return { reply: content };
      }
    }
    return { reply: "I'm sorry, I couldn't generate a response." };
  } catch (error) {
    console.error("Chatbot Error:", error);
    return "Oops! Something went wrong while trying to think. Please try again later.";
  }
}

module.exports = { handleUserQuery };
