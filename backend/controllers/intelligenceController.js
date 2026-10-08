const User = require('../models/User');
const Resource = require('../models/Resource');
const Application = require('../models/Application');
const ReadinessReport = require('../models/ReadinessReport');
const { analyzeStartupReadiness } = require('../services/geminiService');
const { rankByUser } = require('../services/recommendationService');

/**
 * Connects identified gaps in readiness dimensions to real MongoDB resources
 */
async function attachRealResourcesToDimensions(dimensions) {
  const allResources = await Resource.find({ status: 'approved', isActive: true }).lean();

  const categoryMapping = {
    productReadiness: ['Tool/Software', 'Incubator/Accelerator'],
    marketReadiness: ['Mentor', 'Incubator/Accelerator'],
    businessModelReadiness: ['Mentor', 'Government Scheme'],
    teamReadiness: ['Mentor'],
    legalReadiness: ['Legal/Compliance', 'Government Scheme'],
    financialReadiness: ['Government Scheme', 'Funding'],
    fundingReadiness: ['Funding', 'Government Scheme'],
    technologyReadiness: ['Tool/Software']
  };

  const enriched = {};
  for (const [key, dim] of Object.entries(dimensions)) {
    const cats = categoryMapping[key] || ['Funding'];
    const matching = allResources
      .filter(r => cats.includes(r.category))
      .slice(0, 3);

    enriched[key] = {
      ...dim,
      relevantResources: matching
    };
  }
  return enriched;
}

/**
 * Builds Opportunity Gaps grounded strictly in real MongoDB resources
 */
async function buildOpportunityGaps(user, dimensions) {
  const allResources = await Resource.find({ status: 'approved', isActive: true }).lean();
  const ranked = rankByUser(user, allResources);

  const gaps = [];

  // 1. MVP & Product Gap
  if (user.mvpStatus === 'not_started' || user.mvpStatus === 'in_development') {
    const toolResources = ranked.filter(r => r.category === 'Tool/Software' || r.category === 'Incubator/Accelerator').slice(0, 2);
    gaps.push({
      title: 'MVP & Prototype Development Gap',
      category: 'Product Development',
      urgency: 'critical',
      whatStartupHas: user.problem ? `Identified problem: "${user.problem.slice(0, 80)}"` : 'Idea concept',
      whatIsMissing: 'A working minimum viable product (MVP) tested with pilot users',
      recommendedAction: 'Build a rapid prototype, set up cloud architecture with startup credits, and launch to initial pilot users.',
      linkedResources: toolResources
    });
  }

  // 2. Market Validation Gap
  if (!user.marketValidation || user.marketValidation === 'none') {
    const mentorResources = ranked.filter(r => r.category === 'Mentor').slice(0, 2);
    gaps.push({
      title: 'Customer Discovery & Validation Gap',
      category: 'Market Validation',
      urgency: 'high',
      whatStartupHas: `Target customer segment (${user.targetCustomers || 'B2B'}) defined`,
      whatIsMissing: 'Structured user interview data, LOIs, or pilot user commitment',
      recommendedAction: 'Conduct structured customer interviews and validate willingness to pay before scaling build efforts.',
      linkedResources: mentorResources
    });
  }

  // 3. Legal & Business Incorporation Gap
  if (!user.businessRegistration || user.businessRegistration === 'unregistered') {
    const legalResources = ranked.filter(r => r.category === 'Legal/Compliance' || r.category === 'Government Scheme').slice(0, 2);
    gaps.push({
      title: 'Legal Incorporation & Compliance Gap',
      category: 'Legal & Compliance',
      urgency: 'high',
      whatStartupHas: 'Unregistered business initiative',
      whatIsMissing: 'Formal entity registration (Pvt Ltd / LLP) & DPIIT Startup recognition',
      recommendedAction: 'Incorporate as a Private Limited company or LLP to become eligible for government grants and seed equity.',
      linkedResources: legalResources
    });
  }

  // 4. Funding Readiness Gap
  if (user.fundingRequirement && user.fundingRequirement !== 'none' && user.fundingStage === 'bootstrapped') {
    const fundingResources = ranked.filter(r => r.category === 'Funding' || r.category === 'Government Scheme').slice(0, 3);
    gaps.push({
      title: 'Seed & Grant Capital Readiness Gap',
      category: 'Funding & Grants',
      urgency: 'high',
      whatStartupHas: `Bootstrapped stage looking for ${user.fundingRequirement} funding`,
      whatIsMissing: 'Standard pitch deck, financial model, and verified grant applications',
      recommendedAction: 'Apply to government seed funds (Startup India Seed Fund) and prepare data room documents.',
      linkedResources: fundingResources
    });
  }

  // 5. Domain Mentorship Gap
  if (!user.requiredExpertise || user.requiredExpertise.length === 0) {
    const mentorResources = ranked.filter(r => r.category === 'Mentor').slice(0, 2);
    gaps.push({
      title: 'Domain Advisory & Growth Guidance Gap',
      category: 'Mentorship',
      urgency: 'medium',
      whatStartupHas: `${user.businessDomain || user.industry || 'Domain'} startup context`,
      whatIsMissing: 'Experienced mentor to provide strategic product and go-to-market feedback',
      recommendedAction: 'Connect with verified mentors on Startup Resource Hub specializing in your industry domain.',
      linkedResources: mentorResources
    });
  }

  return gaps;
}

// GET /api/intelligence/readiness
exports.getReadinessAnalysis = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let report = await ReadinessReport.findOne({ user: user._id });

    // If report doesn't exist or is older than 7 days, generate it
    if (!report) {
      const aiAnalysis = await analyzeStartupReadiness(user);
      const gaps = await buildOpportunityGaps(user, aiAnalysis.dimensions);

      report = await ReadinessReport.create({
        user: user._id,
        overallScore: aiAnalysis.overallScore || 50,
        readinessLevel: aiAnalysis.readinessLevel || 'Idea Validation',
        dimensions: aiAnalysis.dimensions,
        opportunityGaps: gaps,
        aiInsights: aiAnalysis.aiInsights || [],
        lastAnalyzedAt: new Date()
      });
    }

    // Attach real verified DB resources to the dimensions for frontend display
    const enrichedDimensions = await attachRealResourcesToDimensions(report.dimensions.toObject ? report.dimensions.toObject() : report.dimensions);
    const populatedGaps = await buildOpportunityGaps(user, report.dimensions);

    res.json({
      overallScore: report.overallScore,
      readinessLevel: report.readinessLevel,
      dimensions: enrichedDimensions,
      opportunityGaps: populatedGaps,
      aiInsights: report.aiInsights,
      lastAnalyzedAt: report.lastAnalyzedAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate readiness analysis', error: err.message });
  }
};

// POST /api/intelligence/readiness/reanalyze
exports.reanalyzeReadiness = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const aiAnalysis = await analyzeStartupReadiness(user);
    const gaps = await buildOpportunityGaps(user, aiAnalysis.dimensions);

    const report = await ReadinessReport.findOneAndUpdate(
      { user: user._id },
      {
        overallScore: aiAnalysis.overallScore || 50,
        readinessLevel: aiAnalysis.readinessLevel || 'Idea Validation',
        dimensions: aiAnalysis.dimensions,
        opportunityGaps: gaps,
        aiInsights: aiAnalysis.aiInsights || [],
        lastAnalyzedAt: new Date()
      },
      { upsert: true, new: true }
    );

    const enrichedDimensions = await attachRealResourcesToDimensions(report.dimensions);
    const populatedGaps = await buildOpportunityGaps(user, report.dimensions);

    res.json({
      message: 'Readiness report refreshed successfully',
      overallScore: report.overallScore,
      readinessLevel: report.readinessLevel,
      dimensions: enrichedDimensions,
      opportunityGaps: populatedGaps,
      aiInsights: report.aiInsights,
      lastAnalyzedAt: report.lastAnalyzedAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Reanalysis failed', error: err.message });
  }
};

// GET /api/intelligence/opportunity-gaps
exports.getOpportunityGaps = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const gaps = await buildOpportunityGaps(user, {});
    res.json(gaps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to detect opportunity gaps', error: err.message });
  }
};

// GET /api/intelligence/deadlines
exports.getDeadlineIntelligence = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const now = new Date();
    const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Tracked applications with deadlines
    const applications = await Application.find({ user: req.user.id })
      .populate('resource')
      .lean();

    // Resources with upcoming deadlines
    const upcomingResources = await Resource.find({
      status: 'approved',
      isActive: true,
      deadline: { $gte: now, $lte: thirtyDaysAhead }
    }).sort({ deadline: 1 }).lean();

    const rankedUpcoming = rankByUser(user, upcomingResources);

    const urgentList = [];
    const upcomingList = [];

    rankedUpcoming.forEach(r => {
      const daysLeft = Math.ceil((new Date(r.deadline) - now) / (1000 * 60 * 60 * 24));
      const item = {
        ...r,
        daysLeft,
        urgency: daysLeft <= 7 ? 'critical' : 'moderate'
      };
      if (daysLeft <= 7) urgentList.push(item);
      else upcomingList.push(item);
    });

    res.json({
      urgentCount: urgentList.length,
      upcomingCount: upcomingList.length,
      urgent: urgentList,
      upcoming: upcomingList,
      trackedApplications: applications.filter(a => a.deadline || a.resource?.deadline)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load deadline intelligence', error: err.message });
  }
};
