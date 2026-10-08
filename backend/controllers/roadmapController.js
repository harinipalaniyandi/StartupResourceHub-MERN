const Roadmap = require('../models/Roadmap');
const User = require('../models/User');
const Resource = require('../models/Resource');
const ReadinessReport = require('../models/ReadinessReport');
const { notify } = require('../services/notificationService');

/**
 * Builds standard tailored roadmap stages and tasks linked to real DB resources
 */
async function generateTailoredRoadmap(user) {
  const allResources = await Resource.find({ status: 'approved', isActive: true }).lean();
  const domain = user.businessDomain || user.industry || 'Tech';
  const stage = user.startupStage || 'idea';

  // Helper to find matching resource
  const findResourceByCat = (cat) => {
    return allResources.find(r => r.category === cat) || allResources[0];
  };

  const fundingRes = findResourceByCat('Funding');
  const govtRes = findResourceByCat('Government Scheme');
  const toolRes = findResourceByCat('Tool/Software');
  const legalRes = findResourceByCat('Legal/Compliance');
  const mentorRes = findResourceByCat('Mentor');

  const stages = [
    {
      stageNumber: 1,
      title: 'Stage 1: Problem Validation & Customer Discovery',
      description: 'Validate the core problem hypothesis and define target customer personas.',
      status: stage === 'idea' ? 'in_progress' : 'completed',
      tasks: [
        {
          id: 'task-1-1',
          title: `Conduct 25 customer discovery interviews in ${domain}`,
          description: 'Document key customer pain points and willingness to pay.',
          priority: 'critical',
          isCompleted: stage !== 'idea',
          recommendedAction: 'Schedule weekly interviews with target stakeholders.',
          resourceCategory: 'Mentor',
          linkedResourceId: mentorRes?._id
        },
        {
          id: 'task-1-2',
          title: 'Develop Lean Value Proposition Canvas',
          description: 'Summarize customer segments, problem statements, and unique value proposition.',
          priority: 'high',
          isCompleted: stage !== 'idea',
          recommendedAction: 'Draft and review with an industry mentor.',
          resourceCategory: 'Tool/Software',
          linkedResourceId: toolRes?._id
        }
      ]
    },
    {
      stageNumber: 2,
      title: 'Stage 2: MVP Prototyping & Technical Architecture',
      description: 'Build a working minimum viable product to test core value delivery.',
      status: (stage === 'mvp' || stage === 'idea') ? 'in_progress' : 'completed',
      tasks: [
        {
          id: 'task-2-1',
          title: 'Build Core MVP Prototype with Analytics',
          description: 'Create functional version with minimal essential features.',
          priority: 'critical',
          isCompleted: user.mvpStatus === 'mvp_ready' || user.mvpStatus === 'live_with_users',
          recommendedAction: 'Focus only on primary customer workflow before adding complex features.',
          resourceCategory: 'Tool/Software',
          linkedResourceId: toolRes?._id
        },
        {
          id: 'task-2-2',
          title: 'Deploy Cloud Infrastructure & Apply for Credits',
          description: 'Set up scalable database, auth, and hosting using cloud startup program credits.',
          priority: 'high',
          isCompleted: user.mvpStatus === 'live_with_users',
          recommendedAction: 'Claim startup cloud credits to keep infrastructure cost near zero.',
          resourceCategory: 'Tool/Software',
          linkedResourceId: toolRes?._id
        }
      ]
    },
    {
      stageNumber: 3,
      title: 'Stage 3: Legal Structuring & Startup India Registration',
      description: 'Formalize legal structure and apply for government recognition & tax incentives.',
      status: user.businessRegistration === 'private_limited' ? 'completed' : 'in_progress',
      tasks: [
        {
          id: 'task-3-1',
          title: 'Register Entity (Private Limited / LLP)',
          description: 'Incorporate legal business entity to hold IP and sign vendor contracts.',
          priority: 'critical',
          isCompleted: user.businessRegistration === 'private_limited' || user.businessRegistration === 'llp',
          recommendedAction: 'Execute founder agreement and shareholder vesting structure.',
          resourceCategory: 'Legal/Compliance',
          linkedResourceId: legalRes?._id
        },
        {
          id: 'task-3-2',
          title: 'Apply for DPIIT Startup India Recognition',
          description: 'Access tax exemptions, fast-tracked patents, and government seed funding.',
          priority: 'high',
          isCompleted: false,
          recommendedAction: 'Submit incorporation certificate on Startup India portal.',
          resourceCategory: 'Government Scheme',
          linkedResourceId: govtRes?._id
        }
      ]
    },
    {
      stageNumber: 4,
      title: 'Stage 4: Seed Funding & Grant Acquisition',
      description: 'Secure initial non-dilutive grants and prepare investment data room.',
      status: stage === 'early_revenue' ? 'in_progress' : 'not_started',
      tasks: [
        {
          id: 'task-4-1',
          title: 'Apply for Startup India Seed Fund Scheme (SISFS)',
          description: 'Apply for up to ₹20L grant / ₹50L debt for proof of concept and pilot trials.',
          priority: 'critical',
          isCompleted: false,
          recommendedAction: 'Select eligible approved incubator and submit 10-slide pitch deck.',
          resourceCategory: 'Funding',
          linkedResourceId: fundingRes?._id
        },
        {
          id: 'task-4-2',
          title: 'Build Investor Data Room & 3-Year Financial Model',
          description: 'Compile cap table, unit economics, traction metrics, and customer pipeline.',
          priority: 'high',
          isCompleted: false,
          recommendedAction: 'Work with a finance mentor to pressure-test unit economics.',
          resourceCategory: 'Mentor',
          linkedResourceId: mentorRes?._id
        }
      ]
    },
    {
      stageNumber: 5,
      title: 'Stage 5: Go-to-Market Execution & Revenue Scaling',
      description: 'Accelerate user acquisition, optimize conversion, and reach product-market fit.',
      status: stage === 'scaling' ? 'in_progress' : 'not_started',
      tasks: [
        {
          id: 'task-5-1',
          title: `Launch Targeted GTM Campaigns in ${domain}`,
          description: 'Execute focused multi-channel marketing campaigns to acquire first 100 paying customers.',
          priority: 'high',
          isCompleted: user.revenueStatus === 'generating_revenue' || user.revenueStatus === 'profitable',
          recommendedAction: 'Measure customer acquisition cost (CAC) and customer lifetime value (LTV).',
          resourceCategory: 'Mentor',
          linkedResourceId: mentorRes?._id
        },
        {
          id: 'task-5-2',
          title: 'Establish Strategic Partnerships & Distribution Channels',
          description: 'Partner with industry ecosystem players and co-working hubs for expanded reach.',
          priority: 'medium',
          isCompleted: false,
          recommendedAction: 'Leverage accelerator alumni networks and partner programs.',
          resourceCategory: 'Co-working Space',
          linkedResourceId: findResourceByCat('Co-working Space')?._id
        }
      ]
    }
  ];

  // Calculate overall progress
  let totalTasks = 0;
  let completedTasks = 0;
  stages.forEach(st => {
    st.tasks.forEach(t => {
      totalTasks++;
      if (t.isCompleted) completedTasks++;
    });
  });

  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    startupName: user.startupName || `${user.name}'s Startup`,
    startupStage: stage,
    businessDomain: domain,
    overallProgress,
    stages
  };
}

// GET /api/roadmap
exports.getRoadmap = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const roadmap = await Roadmap.findOne({ user: user._id })
      .populate('stages.tasks.linkedResourceId');

    // If no roadmap has been generated yet, return null (do not auto-generate by default)
    if (!roadmap) {
      return res.json(null);
    }

    res.json(roadmap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load roadmap', error: err.message });
  }
};

// POST /api/roadmap/generate (Generate / Regenerate based on updated profile)
exports.generateRoadmap = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const generated = await generateTailoredRoadmap(user);

    const roadmap = await Roadmap.findOneAndUpdate(
      { user: user._id },
      { $set: generated, generatedAt: new Date() },
      { upsert: true, new: true }
    ).populate('stages.tasks.linkedResourceId');

    await notify(user._id, {
      title: 'AI Startup Roadmap Generated',
      message: 'Your personalized stage-by-stage execution roadmap is ready.',
      type: 'roadmap',
      link: '/roadmap'
    });

    res.json({ message: 'Roadmap generated successfully', roadmap });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate roadmap', error: err.message });
  }
};

// DELETE /api/roadmap (Reset / Clear roadmap)
exports.deleteRoadmap = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Roadmap.findOneAndDelete({ user: user._id });
    res.json({ message: 'Roadmap reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to reset roadmap', error: err.message });
  }
};

// PUT /api/roadmap/tasks/:stageNumber/:taskId
exports.toggleTask = async (req, res) => {
  try {
    const { stageNumber, taskId } = req.params;
    const roadmap = await Roadmap.findOne({ user: req.user.id });
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });

    const stage = roadmap.stages.find(s => String(s.stageNumber) === String(stageNumber));
    if (!stage) return res.status(404).json({ message: 'Stage not found' });

    const task = stage.tasks.find(t => (t.id && t.id === taskId) || (t._id && t._id.toString() === taskId.toString()));
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;

    // Recalculate stage status
    const allCompleted = stage.tasks.every(t => t.isCompleted);
    const anyCompleted = stage.tasks.some(t => t.isCompleted);
    stage.status = allCompleted ? 'completed' : anyCompleted ? 'in_progress' : 'not_started';

    // Recalculate overall progress
    let total = 0;
    let done = 0;
    roadmap.stages.forEach(st => {
      st.tasks.forEach(t => {
        total++;
        if (t.isCompleted) done++;
      });
    });
    roadmap.overallProgress = total > 0 ? Math.round((done / total) * 100) : 0;

    await roadmap.save();
    const populated = await Roadmap.findById(roadmap._id).populate('stages.tasks.linkedResourceId');

    if (task.isCompleted) {
      await notify(req.user.id, {
        title: 'Roadmap Milestone Achieved! 🎯',
        message: `Completed: "${task.title}". Roadmap is now ${roadmap.overallProgress}% complete.`,
        type: 'roadmap',
        link: '/roadmap'
      });
    }

    res.json({ message: 'Task updated', roadmap: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update task', error: err.message });
  }
};
