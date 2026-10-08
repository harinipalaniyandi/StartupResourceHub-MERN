const Application = require('../models/Application');
const Resource = require('../models/Resource');
const { notify } = require('../services/notificationService');

// GET /api/applications - List current user's tracked resources
exports.getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ user: req.user.id })
      .populate('resource')
      .sort({ updatedAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load applications', error: err.message });
  }
};

// POST /api/applications - Start tracking a resource
exports.trackResource = async (req, res) => {
  try {
    const { resourceId, notes, deadline } = req.body;
    let app = await Application.findOne({ user: req.user.id, resource: resourceId }).populate('resource');
    if (app) return res.json(app); // already tracked

    const resource = await Resource.findById(resourceId);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    // Generate checklist from resource's required documents or standard items
    const checklistItems = resource.requiredDocuments && resource.requiredDocuments.length > 0
      ? resource.requiredDocuments.map(doc => ({ task: `Prepare ${doc}`, completed: false }))
      : [
          { task: 'Prepare pitch deck / summary', completed: false },
          { task: 'Review eligibility guidelines', completed: false },
          { task: 'Submit application portal form', completed: false }
        ];

    app = await Application.create({
      user: req.user.id,
      resource: resourceId,
      status: 'saved',
      notes: notes || '',
      deadline: deadline || resource.deadline || null,
      checklist: checklistItems
    });

    const populated = await Application.findById(app._id).populate('resource');

    await notify(req.user.id, {
      title: 'Resource Added to Tracker 📋',
      message: `Tracking "${resource.title}". Checklist and status ready.`,
      type: 'application',
      link: '/applications'
    });

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: 'Failed to track resource', error: err.message });
  }
};

// PUT /api/applications/:id - Update status, notes, deadline, checklist
exports.updateApplication = async (req, res) => {
  try {
    const { status, notes, deadline, checklist } = req.body;
    const allowedStatuses = ['saved', 'interested', 'preparing', 'applied', 'under_review', 'accepted', 'rejected'];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    const updateFields = {};
    if (status) {
      updateFields.status = status;
      if (status === 'applied') updateFields.appliedAt = new Date();
    }
    if (notes !== undefined) updateFields.notes = notes;
    if (deadline !== undefined) updateFields.deadline = deadline;
    if (checklist !== undefined) updateFields.checklist = checklist;

    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updateFields },
      { new: true }
    ).populate('resource');

    if (!app) return res.status(404).json({ message: 'Application not found' });

    if (status === 'applied' || status === 'accepted') {
      await notify(req.user.id, {
        title: `Opportunity Status: ${status.toUpperCase()} 🚀`,
        message: `Updated status for "${app.resource?.title || 'Resource'}" to ${status}.`,
        type: 'application',
        link: '/applications'
      });
    }

    res.json(app);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update application', error: err.message });
  }
};

// DELETE /api/applications/:id - Stop tracking
exports.deleteApplication = async (req, res) => {
  try {
    await Application.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Removed from tracker' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove from tracker', error: err.message });
  }
};
