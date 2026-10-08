const Notification = require('../models/Notification');

// GET /api/notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(40);
    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load notifications', error: err.message });
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    res.json({ message: 'Marked as read', notif });
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Notification removed' });
  } catch (err) {
    res.status(400).json({ message: 'Delete failed', error: err.message });
  }
};
