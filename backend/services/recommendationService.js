/**
 * Enhanced Multi-Factor Recommendation & Opportunity Matching Engine
 * Uses term-frequency vectors, cosine similarity, and stage/location weighting.
 */

function tokenize(text) {
  if (!text) return [];
  const cleaned = text.toLowerCase().replace(/[^a-z0-9,\s]/g, ' ');
  return cleaned.split(/[,\s]+/).filter(w => w.length > 1);
}

function termFrequencyVector(tokens) {
  const vector = {};
  for (const token of tokens) {
    vector[token] = (vector[token] || 0) + 1;
  }
  return vector;
}

function cosineSimilarity(v1, v2) {
  const keys1 = Object.keys(v1);
  const keys2 = Object.keys(v2);
  if (keys1.length === 0 || keys2.length === 0) return 0;

  const allTerms = new Set([...keys1, ...keys2]);
  let dot = 0, mag1 = 0, mag2 = 0;

  for (const term of allTerms) {
    const a = v1[term] || 0;
    const b = v2[term] || 0;
    dot += a * b;
    mag1 += a * a;
    mag2 += b * b;
  }
  if (mag1 === 0 || mag2 === 0) return 0;
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

function buildUserVector(user) {
  const parts = [
    user.startupStage,
    user.businessDomain || user.industry,
    user.location,
    user.needs,
    user.problem,
    user.targetCustomers,
    user.fundingRequirement,
    user.requiredExpertise,
    user.currentChallenges
  ].filter(Boolean).join(' ');
  return termFrequencyVector(tokenize(parts));
}

function buildResourceVector(resource) {
  const parts = [
    resource.tags,
    resource.industryFocus,
    resource.stageFocus,
    resource.location,
    resource.category,
    resource.fundingType,
    resource.eligibilityCriteria,
    resource.targetUsers,
    resource.title,
    resource.description
  ].filter(Boolean).join(' ');
  return termFrequencyVector(tokenize(parts));
}

/**
 * Generates human-readable match reasons based on profile & resource overlap
 */
function generateMatchReason(user, resource) {
  const reasons = [];
  const uDomain = (user.businessDomain || user.industry || '').toLowerCase();
  const rDomain = (resource.industryFocus || '').toLowerCase();
  const uStage = (user.startupStage || '').toLowerCase();
  const rStage = (resource.stageFocus || '').toLowerCase();
  const uLoc = (user.location || '').toLowerCase();
  const rLoc = (resource.location || '').toLowerCase();

  if (rDomain === 'all' || (uDomain && rDomain.includes(uDomain))) {
    reasons.push(`Targeted for ${uDomain || 'your'} industry`);
  }
  if (rStage === 'all' || (uStage && rStage.includes(uStage))) {
    reasons.push(`Designed for ${uStage || 'current'} stage`);
  }
  if (rLoc === 'all' || rLoc === 'global' || (uLoc && rLoc.includes(uLoc))) {
    reasons.push(`Available in ${resource.location}`);
  }
  if (resource.category === 'Government Scheme') {
    reasons.push('Verified non-dilutive government support');
  } else if (resource.category === 'Funding') {
    reasons.push('Direct early-stage capital opportunity');
  }

  return reasons.length > 0 ? reasons.slice(0, 2).join(' • ') : `Relevant ${resource.category} for startup growth`;
}

/**
 * Ranks resources by relevance to a user profile
 */
function rankByUser(user, resources) {
  if (!user) {
    return resources.map(r => ({
      ...(r.toObject ? r.toObject() : r),
      matchScore: 85,
      matchReason: `High-impact ${r.category} for startups`
    }));
  }

  const userVector = buildUserVector(user);
  const scored = resources.map(r => {
    const resVector = buildResourceVector(r);
    let sim = cosineSimilarity(userVector, resVector);

    // Contextual boosts
    const uDomain = (user.businessDomain || user.industry || '').toLowerCase();
    const rDomain = (r.industryFocus || '').toLowerCase();
    const uStage = (user.startupStage || '').toLowerCase();
    const rStage = (r.stageFocus || '').toLowerCase();

    let multiplier = 1.0;
    if (rDomain.includes(uDomain) && uDomain) multiplier += 0.25;
    if (rStage.includes(uStage) && uStage) multiplier += 0.25;
    if (r.industryFocus === 'all') multiplier += 0.1;
    if (r.stageFocus === 'all') multiplier += 0.1;

    let finalScore = Math.min(Math.round(sim * multiplier * 100), 99);
    // Baseline score for all-stage or all-domain resources
    if (finalScore < 45 && (r.industryFocus === 'all' || r.stageFocus === 'all')) {
      finalScore = 55 + Math.floor(Math.random() * 15);
    }
    if (finalScore < 30) finalScore = 40;

    return {
      ...(r.toObject ? r.toObject() : r),
      matchScore: finalScore,
      matchReason: generateMatchReason(user, r)
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Ranks resources by relevance to a free-text / semantic query
 */
function rankByQuery(query, resources) {
  const queryVector = termFrequencyVector(tokenize(query));
  const scored = resources.map(r => {
    const resVector = buildResourceVector(r);
    const sim = cosineSimilarity(queryVector, resVector);
    let score = Math.round(sim * 100);
    if (score < 30 && query.toLowerCase().includes(r.category.toLowerCase())) {
      score = 70;
    }
    return {
      ...(r.toObject ? r.toObject() : r),
      matchScore: Math.min(score, 98),
      matchReason: `Matched keywords: "${query.slice(0, 30)}..."`
    };
  });
  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Ranks mentors for a founder profile and explains WHY each mentor is recommended
 */
function rankMentorsForFounder(founder, mentors) {
  const founderText = [
    founder.businessDomain || founder.industry,
    founder.startupStage,
    founder.problem,
    founder.needs,
    founder.requiredExpertise,
    founder.currentChallenges,
    founder.location
  ].filter(Boolean).join(' ');

  const founderVector = termFrequencyVector(tokenize(founderText));

  const scored = mentors.map(m => {
    const mentorObj = m.toObject ? m.toObject() : m;
    const mentorText = [
      mentorObj.expertise,
      mentorObj.mentorDomain || mentorObj.industry,
      mentorObj.bio,
      mentorObj.supportedStages,
      mentorObj.company,
      mentorObj.location
    ].filter(Boolean).join(' ');

    const mentorVector = termFrequencyVector(tokenize(mentorText));
    const sim = cosineSimilarity(founderVector, mentorVector);

    let score = Math.min(Math.round((sim + 0.45) * 65), 98);
    if (score < 50) score = 55 + (mentorObj.experienceYears > 5 ? 15 : 5);

    // Formulate explicit "Why recommended" reasoning
    const reasons = [];
    if (mentorObj.mentorDomain || mentorObj.industry) {
      reasons.push(`${mentorObj.mentorDomain || mentorObj.industry} domain specialization`);
    }
    if (mentorObj.experienceYears) {
      reasons.push(`${mentorObj.experienceYears}+ years industry track record`);
    }
    if (mentorObj.expertise) {
      const topSkills = mentorObj.expertise.split(',').slice(0, 2).map(s => s.trim()).join(' & ');
      reasons.push(`Key guidance in ${topSkills}`);
    }

    const whyRecommended = reasons.length > 0
      ? `Recommended for: ${reasons.join(', ')}.`
      : 'Aligned with your startup stage and operational goals.';

    return {
      ...mentorObj,
      matchScore: score,
      whyRecommended
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = {
  rankByUser,
  rankByQuery,
  rankMentorsForFounder,
  generateMatchReason
};
