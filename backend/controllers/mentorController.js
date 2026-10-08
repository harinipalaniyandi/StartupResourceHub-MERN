const MentorRequest = require('../models/MentorRequest');
const Message = require('../models/Message');
const User = require('../models/User');
const { notify } = require('../services/notificationService');
const { rankMentorsForFounder } = require('../services/recommendationService');

// GET /api/mentors - List all verified mentors with optional filtering
exports.listMentors = async (req, res) => {
  try {
    const { domain, availability, location } = req.query;
    const query = { role: 'mentor', isVerified: true, isActive: true };

    if (domain && domain !== 'all') {
      query.$or = [
        { mentorDomain: new RegExp(domain, 'i') },
        { expertise: new RegExp(domain, 'i') },
        { industry: new RegExp(domain, 'i') }
      ];
    }
    if (availability && availability !== 'all') {
      query.availability = availability;
    }
    if (location && location !== 'all') {
      query.location = new RegExp(location, 'i');
    }

    const mentors = await User.find(query)
      .select('name email mentorDomain industry location expertise experienceYears availability bio company linkedinProfile supportedStages isMentorVerified')
      .lean();

    res.json(mentors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to list mentors', error: err.message });
  }
};

// GET /api/mentors/match - AI-ranked mentors for the logged-in founder with match explanation
exports.matchMentors = async (req, res) => {
  try {
    const founder = await User.findById(req.user.id).lean();
    if (!founder) return res.status(404).json({ message: 'Founder profile not found' });

    const mentors = await User.find({ role: 'mentor', isVerified: true, isActive: true })
      .select('name email mentorDomain industry location expertise experienceYears availability bio company linkedinProfile supportedStages isMentorVerified')
      .lean();

    const ranked = rankMentorsForFounder(founder, mentors);
    res.json(ranked);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Mentor matching failed', error: err.message });
  }
};

// POST /api/mentors/request - Founder sends request to mentor
exports.sendRequest = async (req, res) => {
  try {
    const { mentorId, message } = req.body;
    const founder = await User.findById(req.user.id);
    const mentor = await User.findById(mentorId);

    if (!mentor || mentor.role !== 'mentor') {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Check if an active/pending request already exists
    const existing = await MentorRequest.findOne({
      founder: req.user.id,
      mentor: mentorId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existing) {
      return res.status(409).json({ message: `You already have an ${existing.status} request with this mentor.` });
    }

    const request = await MentorRequest.create({
      founder: req.user.id,
      mentor: mentorId,
      message: message || '',
      status: 'pending',
      startupContext: {
        startupName: founder.startupName || `${founder.name}'s Startup`,
        startupStage: founder.startupStage || 'idea',
        businessDomain: founder.businessDomain || founder.industry || 'General',
        currentChallenges: founder.currentChallenges || '',
        problem: founder.problem || ''
      }
    });

    // Also create the initial message if founder wrote a message
    if (message && message.trim()) {
      await Message.create({
        mentorRequest: request._id,
        sender: req.user.id,
        receiver: mentorId,
        text: message.trim()
      });
    }

    await notify(mentorId, {
      title: 'New Mentorship Request! 🎓',
      message: `${founder.name} (${founder.startupName || 'Startup Founder'}) requested your guidance.`,
      type: 'mentor',
      link: '/mentor-requests'
    });

    res.status(201).json({ message: 'Mentorship request sent successfully', request });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Failed to send request', error: err.message });
  }
};

// GET /api/mentors/requests/sent - Founder's sent requests
exports.getSentRequests = async (req, res) => {
  try {
    const requests = await MentorRequest.find({ founder: req.user.id })
      .populate('mentor', 'name email mentorDomain expertise experienceYears company location bio availability')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load sent requests', error: err.message });
  }
};

// GET /api/mentors/requests/received - Mentor's incoming requests
exports.getReceivedRequests = async (req, res) => {
  try {
    const requests = await MentorRequest.find({ mentor: req.user.id })
      .populate('founder', 'name email startupName businessDomain startupStage location problem currentChallenges mvpStatus')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load received requests', error: err.message });
  }
};

// PUT /api/mentors/requests/:id - Mentor responds (accept, decline, complete)
exports.respondToRequest = async (req, res) => {
  try {
    const { status, mentorNotes, meetingDetails } = req.body;
    if (!['accepted', 'declined', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Allowed: accepted, declined, completed' });
    }

    const request = await MentorRequest.findOneAndUpdate(
      { _id: req.params.id, mentor: req.user.id },
      {
        status,
        ...(mentorNotes !== undefined && { mentorNotes }),
        ...(meetingDetails !== undefined && { meetingDetails }),
        respondedAt: new Date()
      },
      { new: true }
    ).populate('founder', 'name email').populate('mentor', 'name');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    const statusTitle = status === 'accepted' ? 'Mentorship Request Accepted! 🎉' : `Mentorship Request ${status}`;
    const statusMsg = status === 'accepted'
      ? `${request.mentor.name} accepted your mentorship request! You can now chat and prepare for the session.`
      : `${request.mentor.name} marked your mentorship request as ${status}.`;

    // If mentor provided notes or meeting details upon acceptance, save as a message
    if (status === 'accepted' && (meetingDetails || mentorNotes)) {
      const welcomeMsg = [
        meetingDetails ? `📅 **Meeting / Session Details:**\n${meetingDetails}` : '',
        mentorNotes ? `📝 **Notes from Mentor:**\n${mentorNotes}` : ''
      ].filter(Boolean).join('\n\n');

      if (welcomeMsg) {
        await Message.create({
          mentorRequest: request._id,
          sender: req.user.id,
          receiver: request.founder._id,
          text: welcomeMsg
        });
      }
    }

    await notify(request.founder._id, {
      title: statusTitle,
      message: statusMsg,
      type: 'mentor',
      link: '/mentors'
    });

    res.json({ message: `Request marked as ${status}`, request });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Failed to respond', error: err.message });
  }
};

// GET /api/mentors/dashboard - Mentor overview & active mentees
exports.getMentorDashboard = async (req, res) => {
  try {
    const mentorId = req.user.id;
    const [pending, accepted, declined, completed, total] = await Promise.all([
      MentorRequest.countDocuments({ mentor: mentorId, status: 'pending' }),
      MentorRequest.countDocuments({ mentor: mentorId, status: 'accepted' }),
      MentorRequest.countDocuments({ mentor: mentorId, status: 'declined' }),
      MentorRequest.countDocuments({ mentor: mentorId, status: 'completed' }),
      MentorRequest.countDocuments({ mentor: mentorId })
    ]);

    const activeMentees = await MentorRequest.find({ mentor: mentorId, status: 'accepted' })
      .populate('founder', 'name email startupName businessDomain startupStage location problem currentChallenges')
      .sort({ updatedAt: -1 });

    res.json({
      pending,
      accepted,
      declined,
      completed,
      total,
      activeMentees
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load mentor dashboard', error: err.message });
  }
};

// ============================================================================
// TWO-WAY FOUNDER-MENTOR MESSAGING SYSTEM
// ============================================================================

// POST /api/mentors/messages - Send a message in a mentorship conversation
exports.sendMessage = async (req, res) => {
  try {
    const { mentorRequestId, text } = req.body;
    if (!mentorRequestId || !text || !text.trim()) {
      return res.status(400).json({ message: 'mentorRequestId and message text are required.' });
    }

    const mentorRequest = await MentorRequest.findById(mentorRequestId)
      .populate('founder', 'name email role')
      .populate('mentor', 'name email role');

    if (!mentorRequest) {
      return res.status(404).json({ message: 'Mentorship request not found.' });
    }

    const userId = req.user.id.toString();
    const founderId = (mentorRequest.founder._id || mentorRequest.founder).toString();
    const mentorId = (mentorRequest.mentor._id || mentorRequest.mentor).toString();

    // Verify sender is part of this mentorship
    if (userId !== founderId && userId !== mentorId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to message in this mentorship thread.' });
    }

    // Determine receiver
    const receiverId = (userId === founderId) ? mentorId : founderId;

    const message = await Message.create({
      mentorRequest: mentorRequestId,
      sender: req.user.id,
      receiver: receiverId,
      text: text.trim()
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');

    // Notify receiver
    const senderName = req.user.name || 'Your Mentorship Partner';
    const preview = text.length > 60 ? `${text.substring(0, 60)}...` : text;
    const navLink = req.user.role === 'mentor' ? '/mentors' : '/mentor-requests';

    await notify(receiverId, {
      title: `💬 New Message from ${senderName}`,
      message: `${senderName}: "${preview}"`,
      type: 'message',
      link: navLink
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: populated
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
};

// GET /api/mentors/messages/:mentorRequestId - Get conversation messages & context
exports.getMessages = async (req, res) => {
  try {
    const { mentorRequestId } = req.params;
    const mentorRequest = await MentorRequest.findById(mentorRequestId)
      .populate('founder', 'name email startupName businessDomain startupStage location problem currentChallenges')
      .populate('mentor', 'name email mentorDomain expertise company location bio availability');

    if (!mentorRequest) {
      return res.status(404).json({ message: 'Mentorship request not found.' });
    }

    const userId = req.user.id.toString();
    const founderId = (mentorRequest.founder._id || mentorRequest.founder).toString();
    const mentorId = (mentorRequest.mentor._id || mentorRequest.mentor).toString();

    if (userId !== founderId && userId !== mentorId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to view this conversation.' });
    }

    // Fetch messages
    const messages = await Message.find({ mentorRequest: mentorRequestId })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .sort({ createdAt: 1 });

    // Mark unread messages sent to current user as read
    await Message.updateMany(
      { mentorRequest: mentorRequestId, receiver: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      mentorRequest,
      messages
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Failed to load conversation', error: err.message });
  }
};

// PUT /api/mentors/messages/read-all/:mentorRequestId - Mark conversation read
exports.markMessagesRead = async (req, res) => {
  try {
    const { mentorRequestId } = req.params;
    await Message.updateMany(
      { mentorRequest: mentorRequestId, receiver: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update read status', error: err.message });
  }
};

// GET /api/mentors/messages/unread/count - Total unread messages for user
exports.getUnreadMessageCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user.id, isRead: false });
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ message: 'Failed to count unread messages', error: err.message });
  }
};

