const Conversation = require('../models/Conversation');
const Resource = require('../models/Resource');
const User = require('../models/User');
const Application = require('../models/Application');
const Roadmap = require('../models/Roadmap');
const { rankByQuery } = require('../services/recommendationService');
const { chatWithContext, generateChatTitle, detectLanguage, generateSmartFallbackReply } = require('../services/geminiService');

// GET /api/chatbot/conversations - List all conversations for the logged in user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ user: userId })
      .select('title category language isPinned updatedAt createdAt messages')
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = conversations.map(c => ({
      _id: c._id,
      title: c.title || 'New Chat',
      category: c.category || 'General',
      language: c.language || 'auto',
      isPinned: c.isPinned || false,
      messageCount: c.messages?.length || 0,
      lastMessage: c.messages?.length > 0 ? c.messages[c.messages.length - 1].text.slice(0, 60) : '',
      updatedAt: c.updatedAt,
      createdAt: c.createdAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({ message: 'Failed to load conversations', error: err.message });
  }
};

// GET /api/chatbot/conversations/:id - Get single conversation with full message history
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversation = await Conversation.findOne({ _id: req.params.id, user: userId })
      .populate('messages.matches')
      .lean();

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (err) {
    console.error('getConversation error:', err);
    res.status(500).json({ message: 'Failed to load conversation', error: err.message });
  }
};

// POST /api/chatbot/conversations - Create a brand new conversation
exports.createConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, category, language } = req.body;

    const newConversation = new Conversation({
      user: userId,
      title: title || 'New Chat',
      category: category || 'General',
      language: language || 'auto',
      messages: []
    });

    await newConversation.save();
    res.status(201).json(newConversation);
  } catch (err) {
    console.error('createConversation error:', err);
    res.status(500).json({ message: 'Failed to create conversation', error: err.message });
  }
};

// PUT /api/chatbot/conversations/:id/rename - Rename a conversation
exports.renameConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const conv = await Conversation.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { title: title.trim() },
      { new: true }
    );

    if (!conv) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({ message: 'Conversation renamed successfully', conversation: conv });
  } catch (err) {
    console.error('renameConversation error:', err);
    res.status(500).json({ message: 'Failed to rename conversation', error: err.message });
  }
};

// DELETE /api/chatbot/conversations/:id - Delete a single conversation
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await Conversation.findOneAndDelete({ _id: req.params.id, user: userId });

    if (!result) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('deleteConversation error:', err);
    res.status(500).json({ message: 'Failed to delete conversation', error: err.message });
  }
};

// DELETE /api/chatbot/conversations - Clear all conversations for the user
exports.clearAllConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    await Conversation.deleteMany({ user: userId });
    res.json({ message: 'All conversations cleared successfully' });
  } catch (err) {
    console.error('clearAllConversations error:', err);
    res.status(500).json({ message: 'Failed to clear conversations', error: err.message });
  }
};

// POST /api/chatbot or POST /api/chatbot/message - Main AI Chat Handler (Session & Persistent)
exports.chat = async (req, res) => {
  try {
    const { message, conversationId, language = 'auto' } = req.body;
    if (!message || !message.trim()) {
      return res.json({
        reply: 'Hi! Ask me anything about your startup roadmap, seed funding schemes, grant deadlines, or mentor recommendations.',
        matches: [],
        mentors: []
      });
    }

    const userText = message.trim();

    // Retrieve user context if logged in
    let founderContext = { name: 'Founder', startupStage: 'idea', businessDomain: 'Tech' };
    let applications = [];
    let roadmap = null;
    let currentConversation = null;

    if (req.user) {
      const user = await User.findById(req.user.id).lean();
      if (user) founderContext = user;

      applications = await Application.find({ user: req.user.id }).populate('resource').lean();
      roadmap = await Roadmap.findOne({ user: req.user.id }).lean();

      // Find or create conversation
      if (conversationId) {
        currentConversation = await Conversation.findOne({ _id: conversationId, user: req.user.id });
      }

      if (!currentConversation) {
        currentConversation = new Conversation({
          user: req.user.id,
          title: 'New Chat',
          language: language,
          messages: []
        });
      }
    }

    // Step 1: Detect User Intent & Target Domains
    const queryLower = userText.toLowerCase();

    const isFundingOrSchemeQuery = /\b(funding|grant|grants|scheme|schemes|sisfs|tanseed|mudra|seed fund|investor|investors|vc|angel|capital|subsidy|loan|equity|finance)\b/i.test(queryLower);
    const isLegalOrComplianceQuery = /\b(legal|lawyer|compliance|ipr|patent|trademark|registration|incorporation|dpiit|pvt ltd|gst|llp)\b/i.test(queryLower);
    const isToolOrWorkspaceQuery = /\b(tool|tools|software|cloud|credits|aws|gcp|workspace|coworking|incubator|accelerator)\b/i.test(queryLower);
    const isExplicitResourceQuery = /\b(resource|resources|portal|links|database|materials|apply|forms|scheme list)\b/i.test(queryLower);
    const isRoadmapIntent = /\b(roadmap|road map|execution plan|milestone|phases|step by step|timeline|guide to start|how to start|how to launch)\b/i.test(queryLower);

    const isResourceIntent = isFundingOrSchemeQuery || isLegalOrComplianceQuery || isToolOrWorkspaceQuery || isExplicitResourceQuery;
    const isMentorIntent = /\b(mentor|mentors|advisor|advisors|guidance|guide|connect with|expert|coaching|consultant|pitch review)\b/i.test(queryLower);

    const isMentorOnly = (/\b(only|mattum|alone)\b/i.test(queryLower) && isMentorIntent) || (isMentorIntent && !isFundingOrSchemeQuery && !isLegalOrComplianceQuery && !isToolOrWorkspaceQuery);
    const isFundingOnly = (/\b(only|mattum|alone)\b/i.test(queryLower) && isFundingOrSchemeQuery) || (isFundingOrSchemeQuery && !isMentorIntent);

    // Domain keywords dictionary
    const domainKeywords = {
      ecommerce: ['ecommerce', 'e-commerce', 'd2c', 'retail', 'online store', 'shopping', 'handmade', 'craft', 'b2c', 'marketplace', 'wire craft', 'products'],
      agritech: ['agri', 'agriculture', 'agritech', 'farming', 'farm', 'fpo', 'crop', 'soil', 'farmer', 'equipment sharing'],
      fintech: ['fintech', 'finance', 'banking', 'payment', 'payments', 'gateway', 'rbi', 'lending', 'crypto', 'loan'],
      healthtech: ['health', 'healthcare', 'healthtech', 'medical', 'pharma', 'biotech', 'clinic', 'telemedicine', 'diagnostic'],
      edtech: ['edtech', 'education', 'learning', 'upskilling', 'students', 'teaching', 'course', 'training'],
      saas: ['saas', 'software', 'b2b', 'enterprise', 'api', 'cloud', 'devtool', 'platform'],
      legal: ['legal', 'lawyer', 'compliance', 'ipr', 'patent', 'trademark', 'registration', 'incorporation'],
      marketing: ['marketing', 'growth', 'branding', 'seo', 'ads', 'acquisition', 'social media', 'content', 'sales'],
      fundraising: ['investor', 'pitch', 'vc', 'angel', 'valuation', 'term sheet', 'fundraising', 'seed capital']
    };

    let queriedDomains = [];
    for (const [dom, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(k => queryLower.includes(k))) {
        queriedDomains.push(dom);
      }
    }

    // Step 2: Query and rank verified resources from MongoDB
    let visibleResources = [];
    let rankedResources = [];
    try {
      const allResources = await Resource.find({ status: 'approved', isActive: true }).lean();
      rankedResources = rankByQuery(userText, allResources);

      if (!isMentorOnly && isResourceIntent) {
        visibleResources = rankedResources.filter(r => r.matchScore >= 35).slice(0, 3);
        if (visibleResources.length === 0 && rankedResources.length > 0 && !isFundingOnly) {
          visibleResources = rankedResources.slice(0, 1);
        }
      }
    } catch (resErr) {
      console.warn('Resource search non-critical error:', resErr.message);
    }

    // Step 3: Query and rank mentors from MongoDB with strict domain filtering
    let visibleMentors = [];
    let matchedMentorsList = [];
    try {
      if (isMentorIntent && !isFundingOnly) {
        const allMentors = await User.find({ role: 'mentor', isVerified: true, isActive: true })
          .select('name mentorDomain industry expertise experienceYears company location bio verificationScore')
          .lean();

        matchedMentorsList = allMentors
          .map(m => {
            let score = 0;
            const expertiseStr = (m.expertise || '').toLowerCase();
            const domainStr = (m.mentorDomain || m.industry || '').toLowerCase();
            const bioStr = (m.bio || '').toLowerCase();
            const nameStr = (m.name || '').toLowerCase();
            const fullMentorText = `${nameStr} ${domainStr} ${expertiseStr} ${bioStr}`;

            // If specific domains were queried by the user:
            if (queriedDomains.length > 0) {
              let hasDomainMatch = false;
              for (const dom of queriedDomains) {
                const keywords = domainKeywords[dom];
                if (keywords.some(k => fullMentorText.includes(k))) {
                  hasDomainMatch = true;
                  score += 65;
                  break;
                }
              }
              // If user asked for specific domain (e.g. ecommerce), do NOT match unrelated mentors!
              if (!hasDomainMatch) {
                return { ...m, matchScore: 0 };
              }
            } else {
              // General mentor query without explicit domain
              score = 45;
              if (founderContext.businessDomain && fullMentorText.includes(founderContext.businessDomain.toLowerCase())) {
                score += 30;
              }
            }

            // Additional keyword relevance
            const userWords = queryLower.split(/\s+/).filter(w => w.length > 3);
            for (const w of userWords) {
              if (fullMentorText.includes(w)) {
                score += 10;
              }
            }

            return { ...m, matchScore: Math.min(score, 98) };
          })
          .filter(m => m.matchScore >= 50)
          .sort((a, b) => b.matchScore - a.matchScore);

        visibleMentors = matchedMentorsList.slice(0, 3);
      }
    } catch (mentorErr) {
      console.warn('Mentor search non-critical error:', mentorErr.message);
    }

    // Determine target language
    const effectiveLang = language !== 'auto' ? language : (currentConversation?.language || detectLanguage(userText));

    // Step 4: Run dual-mode AI synthesis with Gemini
    const historySnippet = currentConversation ? currentConversation.messages.slice(-6) : [];
    let reply = '';

    try {
      reply = await chatWithContext(
        userText,
        founderContext,
        visibleResources.length > 0 ? visibleResources : rankedResources.slice(0, 4),
        applications,
        roadmap,
        visibleMentors.length > 0 ? visibleMentors : matchedMentorsList.slice(0, 3),
        effectiveLang,
        historySnippet
      );
    } catch (geminiErr) {
      console.warn('Gemini chat fallback triggered:', geminiErr.message);
      reply = generateSmartFallbackReply(
        userText,
        founderContext,
        visibleResources.length > 0 ? visibleResources : rankedResources.slice(0, 4),
        visibleMentors.length > 0 ? visibleMentors : matchedMentorsList.slice(0, 3),
        effectiveLang
      );
    }

    // Step 5: If user is logged in, save message to conversation in MongoDB
    if (req.user && currentConversation) {
      // Auto-set title if it's the first message or titled "New Chat"
      if (currentConversation.messages.length === 0 || currentConversation.title === 'New Chat') {
        try {
          const smartTitle = await generateChatTitle(userText);
          currentConversation.title = smartTitle;
        } catch (e) {
          currentConversation.title = userText.slice(0, 30);
        }
      }

      currentConversation.messages.push({
        sender: 'user',
        text: userText,
        language: effectiveLang,
        timestamp: new Date()
      });

      currentConversation.messages.push({
        sender: 'bot',
        text: reply,
        language: effectiveLang,
        matches: visibleResources.map(r => r._id),
        matchedResourcesData: visibleResources,
        matchedMentorsData: visibleMentors,
        timestamp: new Date()
      });

      currentConversation.language = effectiveLang;
      await currentConversation.save();

      return res.json({
        reply,
        matches: visibleResources,
        mentors: visibleMentors,
        conversationId: currentConversation._id,
        conversationTitle: currentConversation.title,
        conversation: currentConversation
      });
    }

    // Guest response
    res.json({
      reply,
      matches: visibleResources,
      mentors: visibleMentors
    });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({
      reply: 'Sorry, I encountered an error processing your startup inquiry. Please try again.',
      matches: [],
      mentors: []
    });
  }
};
