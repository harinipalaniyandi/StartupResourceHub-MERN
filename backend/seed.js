/**
 * Comprehensive Database Seeder
 * Populates diverse startup resources, verified mentors, and default admin.
 * Run with: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const Resource = require('./models/Resource');
const User = require('./models/User');

async function seed() {
  await connectDB();

  console.log('🌱 Seeding database...');

  await Resource.deleteMany({});
  const resources = [
    {
      title: 'Startup India Seed Fund Scheme (SISFS)',
      description: 'Government financial assistance of up to ₹20 Lakhs as grant for proof of concept/prototype and up to ₹50 Lakhs through debt/convertible debentures for commercialization.',
      category: 'Government Scheme',
      tags: 'funding,grant,seed,government,dpiit,prototype,sisfs',
      industryFocus: 'all',
      stageFocus: 'idea,mvp',
      location: 'India',
      budgetRange: '0-20L Grant',
      fundingType: 'Grant',
      externalLink: 'https://seedfund.startupindia.gov.in',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      deadlineType: 'rolling',
      eligibilityCriteria: 'DPIIT recognized startups incorporated within 2 years with a viable business concept.',
      requiredDocuments: ['DPIIT Certificate', 'Pitch Deck', 'Business Plan', 'Founder ID Proof', 'Bank Statement'],
      targetUsers: 'Early-stage Indian Founders',
      status: 'approved',
      verificationStatus: 'verified',
      viewCount: 142
    },
    {
      title: 'Tamil Nadu Startup Seed Grant Fund (TANSEED)',
      description: 'Special grant of ₹10 Lakhs provided by StartupTN for early-stage green/tech/social startups based in Tamil Nadu.',
      category: 'Government Scheme',
      tags: 'tamilnadu,grant,tanseed,seed,startuptn,earlystage',
      industryFocus: 'all',
      stageFocus: 'idea,mvp',
      location: 'Tamil Nadu',
      budgetRange: '10L Grant',
      fundingType: 'Grant',
      externalLink: 'https://startuptn.in/tanseed',
      deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      deadlineType: 'fixed',
      eligibilityCriteria: 'Startups registered in Tamil Nadu with working prototype or validated MVP.',
      requiredDocuments: ['StartupTN Registration', 'Pitch Deck', 'Video Demo', 'GST Certificate'],
      targetUsers: 'Tamil Nadu Startups',
      status: 'approved',
      verificationStatus: 'verified',
      viewCount: 215
    },
    {
      title: 'Y Combinator Accelerator Program',
      description: 'World leading accelerator investing $500,000 for early stage startups alongside 3 months of intensive mentorship and demo day access.',
      category: 'Funding',
      tags: 'funding,accelerator,vc,mentorship,yc,siliconvalley',
      industryFocus: 'all',
      stageFocus: 'mvp,early_revenue',
      location: 'Global',
      budgetRange: '$500K Equity',
      fundingType: 'Equity',
      externalLink: 'https://www.ycombinator.com/apply',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      deadlineType: 'fixed',
      eligibilityCriteria: 'High growth potential technology companies with technical founders.',
      requiredDocuments: ['Application Form', '1-Min Founder Video', 'Demo Video', 'Cap Table'],
      targetUsers: 'Global Tech Startups',
      status: 'approved',
      verificationStatus: 'verified',
      viewCount: 480
    },
    {
      title: 'Razorpay Rize Fintech Growth Program',
      description: 'Exclusive fintech credits, API access, compliance support, and up to $100K in SaaS tool benefits for early fintech and e-commerce companies.',
      category: 'Funding',
      tags: 'fintech,credits,payments,razorpay,saas,ecommerce',
      industryFocus: 'fintech,ecommerce',
      stageFocus: 'idea,mvp,early_revenue',
      location: 'India',
      budgetRange: 'Credits & Perks',
      fundingType: 'Credits',
      externalLink: 'https://razorpay.com/rize',
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      deadlineType: 'rolling',
      eligibilityCriteria: 'Registered fintech, d2c, or e-commerce startups with active payment needs.',
      requiredDocuments: ['Company Registration', 'Product Deck'],
      targetUsers: 'Fintech & E-commerce Builders',
      status: 'approved',
      verificationStatus: 'verified',
      viewCount: 189
    },
    {
      title: 'Google for Startups Cloud & AI Credits Program',
      description: 'Up to $200,000 in Google Cloud and Gemini AI model credits over 2 years, plus technical mentorship from Google engineers.',
      category: 'Tool/Software',
      tags: 'cloud,ai,credits,google,gemini,infrastructure,tools',
      industryFocus: 'all',
      stageFocus: 'idea,mvp,early_revenue',
      location: 'Global',
      budgetRange: '$200K Credits',
      fundingType: 'Credits',
      externalLink: 'https://cloud.google.com/startup',
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      deadlineType: 'rolling',
      eligibilityCriteria: 'Startups under 10 years old with institutional or angel backing/incubator affiliation.',
      requiredDocuments: ['Company Website', 'Founding details', 'Cloud architecture outline'],
      targetUsers: 'Tech & AI Startups',
      status: 'approved',
      verificationStatus: 'verified',
      viewCount: 310
    },
    {
      title: 'Vakilsearch Startup Legal & Compliance Package',
      description: 'Subsidized Private Limited incorporation, GST registration, Trademark filing, and founder agreements drafting for seed-stage startups.',
      category: 'Legal/Compliance',
      tags: 'legal,compliance,incorporation,trademark,gst,contracts',
      industryFocus: 'all',
      stageFocus: 'idea,mvp',
      location: 'India',
      budgetRange: '₹5k - ₹20k',
      fundingType: 'N/A',
      externalLink: 'https://vakilsearch.com',
      deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      deadlineType: 'rolling',
      eligibilityCriteria: 'New founders incorporating their business entity.',
      requiredDocuments: ['PAN Card', 'Aadhar Card', 'Address Proof', 'Proposed Company Names'],
      targetUsers: 'New Founders & Early Builders',
      status: 'approved',
      verificationStatus: 'verified',
      viewCount: 175
    },
    {
      title: 'IIT Madras Incubation Cell (IITMIC)',
      description: 'Premier deeptech, agri-tech, and hardware incubator offering seed funding up to ₹50L, specialized lab access, and IIT faculty mentorship.',
      category: 'Incubator/Accelerator',
      tags: 'incubator,iit,deeptech,agritech,hardware,labs,funding',
      industryFocus: 'agritech,healthtech,deeptech,cleantech',
      stageFocus: 'idea,mvp',
      location: 'Tamil Nadu',
      budgetRange: 'Seed Capital & Lab',
      fundingType: 'Grant & Equity',
      externalLink: 'https://incubation.iitm.ac.in',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Urgent deadline < 7 days
      deadlineType: 'fixed',
      eligibilityCriteria: 'Technology and science-backed innovations with IP potential.',
      requiredDocuments: ['Executive Summary', 'Technical Architecture', 'IP/Patent details', 'Founder Resumes'],
      targetUsers: 'Deeptech & Agritech Innovators',
      status: 'approved',
      verificationStatus: 'verified',
      viewCount: 290
    },
    {
      title: 'WeWork Labs India Co-working Hub',
      description: 'Flexible workspaces with free access to investor office hours, growth workshops, and global partner perks across top Indian metro hubs.',
      category: 'Co-working Space',
      tags: 'coworking,office,wework,network,investors,desk',
      industryFocus: 'all',
      stageFocus: 'all',
      location: 'India',
      budgetRange: '₹8k/desk/mo',
      fundingType: 'Workspace',
      externalLink: 'https://wework.co.in/labs',
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      deadlineType: 'rolling',
      eligibilityCriteria: 'Early to growth stage teams seeking collaborative workspace.',
      requiredDocuments: ['Team Size details', 'KYC'],
      targetUsers: 'Founders & Remote Teams',
      status: 'approved',
      verificationStatus: 'verified',
      viewCount: 160
    }
  ];

  await Resource.insertMany(resources);
  console.log(`✅ ${resources.length} verified resources seeded.`);

  // Seed default admin
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  await User.findOneAndUpdate(
    { email: 'admin@srh.com' },
    {
      name: 'SRH System Admin',
      email: 'admin@srh.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isVerified: true,
      isActive: true,
      businessDomain: 'All',
      location: 'HQ'
    },
    { upsert: true }
  );
  console.log('👤 Admin account verified: admin@srh.com / Admin@123');

  // Seed verified mentors
  const mentorPasswordHash = await bcrypt.hash('Mentor@123', 12);

  const mentors = [
    {
      name: 'Dr. Ramesh Sundaram',
      email: 'ramesh.mentor@srh.com',
      passwordHash: mentorPasswordHash,
      role: 'mentor',
      isVerified: true,
      isMentorVerified: true,
      isActive: true,
      mentorDomain: 'Agritech',
      industry: 'Agritech',
      expertise: 'agritech supply chain, farmgate market linkages, grant writing, iot',
      experienceYears: 14,
      company: 'AgriNext Ventures',
      location: 'Tamil Nadu, India',
      linkedinProfile: 'https://linkedin.com/in/ramesh-agri-mentor',
      supportedStages: 'idea,mvp,early_revenue',
      availability: 'available',
      bio: '14+ years in agriculture supply chains, farmer FPO networks, and precision farming technology. Guided 20+ startups to government seed grants.',
      verificationScore: 95
    },
    {
      name: 'Ananya Sharma',
      email: 'ananya.fintech@srh.com',
      passwordHash: mentorPasswordHash,
      role: 'mentor',
      isVerified: true,
      isMentorVerified: true,
      isActive: true,
      mentorDomain: 'Fintech',
      industry: 'Fintech',
      expertise: 'fintech regulations, rbi compliance, seed fundraising, payment gateways',
      experienceYears: 10,
      company: 'FinLeap Capital',
      location: 'Bangalore, India',
      linkedinProfile: 'https://linkedin.com/in/ananya-fintech',
      supportedStages: 'mvp,early_revenue,scaling',
      availability: 'available',
      bio: 'Former FinTech VP & Angel Investor. Helping early-stage fintech founders navigate banking partner integrations, RBI guidelines, and pre-seed rounds.',
      verificationScore: 92
    },
    {
      name: 'Vikramaditya Rao',
      email: 'vikram.ecommerce@srh.com',
      passwordHash: mentorPasswordHash,
      role: 'mentor',
      isVerified: true,
      isMentorVerified: true,
      isActive: true,
      mentorDomain: 'E-commerce',
      industry: 'E-commerce',
      expertise: 'd2c branding, customer acquisition, inventory logistics, performance marketing',
      experienceYears: 8,
      company: 'ScaleCraft D2C',
      location: 'Chennai, India',
      linkedinProfile: 'https://linkedin.com/in/vikram-d2c',
      supportedStages: 'idea,mvp,early_revenue',
      availability: 'available',
      bio: 'Scaled 3 D2C & e-commerce brands from 0 to 10k monthly orders. Passionate about helping handmade and niche consumer brand founders build profitable channels.',
      verificationScore: 88
    }
  ];

  for (const m of mentors) {
    await User.findOneAndUpdate({ email: m.email }, m, { upsert: true });
  }
  console.log(`🎓 ${mentors.length} verified mentors seeded (Password: Mentor@123).`);

  console.log('🎉 Seeding completed successfully.');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
