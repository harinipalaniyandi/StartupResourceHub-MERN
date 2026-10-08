const Notification = require('../models/Notification');
const User = require('../models/User');

async function notify(userId, { title = 'Startup Resource Hub', message, type = 'system', link = '' }) {
  try {
    if (!userId || !message) return;
    return await Notification.create({
      user: userId,
      title,
      message,
      type,
      link,
      isRead: false
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

async function notifyRole(role, { title = 'Platform Update', message, type = 'system', link = '' }) {
  try {
    const query = role === 'all' ? {} : { role };
    const users = await User.find(query).select('_id');
    const docs = users.map(u => ({
      user: u._id,
      title,
      message,
      type,
      link,
      isRead: false
    }));
    if (docs.length > 0) {
      await Notification.insertMany(docs);
    }
  } catch (err) {
    console.error('Failed to broadcast notification:', err.message);
  }
}

module.exports = { notify, notifyRole };
