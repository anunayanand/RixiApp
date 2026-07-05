const { handleUserQuery } = require('../../services/ai/chatbotService');
const asyncHandler = require('../../utils/asyncHandler');

exports.postChat = asyncHandler(async (req, res) => {
  const { message, history } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  // history should be an array of objects {role: "user"|"assistant", content: "..."}
  const safeHistory = Array.isArray(history) ? history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  })) : [];

  // Extract user info from session if available
  const userData = req.session?.user || req.user || null;

  const responseData = await handleUserQuery(message, safeHistory, userData);

  if (typeof responseData === 'object' && responseData !== null) {
    res.json(responseData);
  } else {
    res.json({ reply: responseData });
  }
});
