const Resource = require('../models/Resource');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { rankByUser, rankByQuery } = require('../services/recommendationService');
const { extractSemanticIntent } = require('../services/geminiService');
const { notifyRole } = require('../services/notificationService');

// GET /api/resources/search
exports.search = async (req, res) => {
  try {
    const { keyword, category, industry, stage, location, fundingType } = req.query;
    const query = { status: 'approved', isActive: true };

    if (keyword) {
      query.$text = { $search: keyword };
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (industry && industry !== 'all') {
      query.industryFocus = { $in: [new RegExp(industry, 'i'), 'all'] };
    }
    if (stage && stage !== 'all') {
      query.stageFocus = { $regex: `(^|,)\\s*(${stage}|all)\\s*(,|$)`, $options: 'i' };
    }
    if (location && location !== 'all') {
      query.location = { $in: [new RegExp(location, 'i'), 'all', 'Global', 'India'] };
    }
    if (fundingType && fundingType !== 'all') {
      query.fundingType = fundingType;
    }

    let results = await Resource.find(query).lean();

    // If logged in, re-rank by personalized AI match score
    if (req.user) {
      const user = await User.findById(req.user.id).lean();
      if (user) {
        results = rankByUser(user, results);
      }
    } else {
      results = results.map(r => ({ ...r, matchScore: 80, matchReason: 'Verified startup opportunity' }));
    }

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
};

// POST /api/resources/semantic-search (Natural language semantic discovery)
exports.semanticSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Natural language search query is required' });
    }

    // Step 1: Extract semantic intent using Gemini
    const intent = await extractSemanticIntent(query);

    // Step 2: Query MongoDB for candidate resources
    const dbFilter = { status: 'approved', isActive: true };
    const candidates = await Resource.find(dbFilter).lean();

    // Step 3: Rank resources using cosine similarity + semantic match
    const ranked = rankByQuery(query, candidates);

    // Step 4: Boost resources matching extracted intent fields
    const boosted = ranked.map(r => {
      let extra = 0;
      const domain = (intent.domain || '').toLowerCase();
      const loc = (intent.location || '').toLowerCase();
      const st = (intent.stage || '').toLowerCase();
      const cat = (intent.category || '').toLowerCase();

      if (domain !== 'all' && r.industryFocus.toLowerCase().includes(domain)) extra += 15;
      if (loc !== 'all' && r.location.toLowerCase().includes(loc)) extra += 15;
      if (st !== 'all' && r.stageFocus.toLowerCase().includes(st)) extra += 10;
      if (cat !== 'all' && r.category.toLowerCase().includes(cat)) extra += 15;

      const finalScore = Math.min(r.matchScore + extra, 99);
      const matchReason = `Matched for ${intent.summary || 'your startup requirement'}`;

      return {
        ...r,
        matchScore: finalScore,
        matchReason
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    // Track search activity if logged in
    if (req.user) {
      await Activity.create({
        user: req.user.id,
        action: 'search',
        metadata: { query, intent }
      });
    }

    res.json({
      intent,
      results: boosted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Semantic search failed', error: err.message });
  }
};

// GET /api/resources/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    const allResources = await Resource.find({ status: 'approved', isActive: true }).lean();
    const ranked = rankByUser(user, allResources);
    res.json(ranked.slice(0, 12));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load recommendations', error: err.message });
  }
};

// GET /api/resources/:id
exports.getOne = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    if (req.user) {
      await Activity.create({ user: req.user.id, resource: resource._id, action: 'view' });
    }
    res.json(resource);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch resource', error: err.message });
  }
};

// GET /api/resources (admin list all)
exports.getAll = async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list resources', error: err.message });
  }
};

// POST /api/resources (admin create)
exports.create = async (req, res) => {
  try {
    const resource = await Resource.create({
      ...req.body,
      createdBy: req.user.id,
      status: 'approved',
      verificationStatus: 'verified'
    });

    // Notify founders in the matching domain
    if (resource.industryFocus && resource.industryFocus !== 'all') {
      notifyRole('founder', {
        title: `New ${resource.category} Opportunity 🌟`,
        message: `New resource added for ${resource.industryFocus}: "${resource.title}"`,
        type: 'resource',
        link: '/search'
      });
    }

    res.status(201).json(resource);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create resource', error: err.message });
  }
};

// PUT /api/resources/:id (admin update)
exports.update = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(resource);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update resource', error: err.message });
  }
};

// DELETE /api/resources/:id (admin remove)
exports.remove = async (req, res) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete resource', error: err.message });
  }
};

// GET /api/resources/analytics/trend
exports.trendAnalytics = async (req, res) => {
  try {
    const trend = await Resource.aggregate([
      { $group: { _id: '$industryFocus', resourceCount: { $sum: 1 }, totalViews: { $sum: '$viewCount' } } },
      { $sort: { totalViews: -1 } }
    ]);
    res.json(trend);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch trend analytics', error: err.message });
  }
};
