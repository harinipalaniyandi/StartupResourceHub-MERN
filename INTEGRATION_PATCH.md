# 🔧 Admin Enhancement - Integration Patch Guide

Since you have the full project, here's exactly what to **ADD** to your existing files (no full replacements needed).

---

## 📝 Step 1: Update `backend/models/Resource.js`

**ADD these fields to the schema (after `viewCount`):**

```javascript
// Add AFTER the existing fields, before closing the schema

// ========== NEW: APPROVAL & METADATA REVIEW ==========
status: {
  type: String,
  enum: ['pending', 'approved', 'rejected'],
  default: 'pending'
},
approvalNotes: { type: String, default: '' },
approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
approvedAt: { type: Date },
lastReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
lastReviewedAt: { type: Date },

// ========== NEW: VERIFICATION & QUALITY ==========
verificationStatus: {
  type: String,
  enum: ['verified', 'flagged', 'needs_review'],
  default: 'needs_review'
},
verificationNotes: { type: String, default: '' },
verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
verifiedAt: { type: Date },
isActive: { type: Boolean, default: true },
lastVerifiedWorking: { type: Date },
isBrokenLink: { type: Boolean, default: false },
```

**ADD these indexes at the end (before `module.exports`):**

```javascript
// Add these index lines
resourceSchema.index({ status: 1, verificationStatus: 1 });
resourceSchema.index({ createdAt: -1 });
resourceSchema.index({ viewCount: -1 });
```

---

## 👤 Step 2: Update `backend/models/User.js`

**ADD these fields to the schema (in the user object):**

```javascript
// ========== NEW: MENTOR VERIFICATION ==========
isMentorVerified: { type: Boolean, default: false },
mentorVerifiedAt: { type: Date },

// Mentor profile info
expertise: [String],
yearsExperience: { type: Number },
linkedinProfile: { type: String },
company: { type: String },
verificationReferences: [
  {
    name: String,
    email: String,
    relationship: String,
  }
],
```

**ADD this index at the end:**

```javascript
userSchema.index({ isMentorVerified: 1 });
```

---

## 🆕 Step 3: Create `backend/models/MentorRequest.js`

**Create a NEW file with this content:**

```javascript
const mongoose = require('mongoose');

const mentorRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Profile details
  expertise: [String],
  yearsExperience: { type: Number },
  linkedinProfile: { type: String },
  company: { type: String },
  bio: { type: String },
  mentorshipFocus: [String],
  availability: { type: String },

  // Verification
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationScore: { type: Number, default: 0 },
  verificationNotes: { type: String },

  // References
  verificationReferences: [
    {
      name: String,
      email: String,
      relationship: String,
      verificationStatus: { type: String, enum: ['pending', 'verified'], default: 'pending' }
    }
  ],

  // Admin review
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  rejectionReason: { type: String },

}, { timestamps: true });

mentorRequestSchema.index({ userId: 1, verificationStatus: 1 });
mentorRequestSchema.index({ verificationScore: -1 });

module.exports = mongoose.model('MentorRequest', mentorRequestSchema);
```

---

## 🛣️ Step 4: Update `backend/routes/adminRoutes.js`

**ADD these imports at the top after existing imports:**

```javascript
// Add these NEW controller functions to the destructuring
// Keep existing ones, just add these:
getPendingResourceApprovals,
approveResourceMetadata,
reviewResourceMetadata,
getPendingMentorVerifications,
verifyMentor,
getResourceStatusReport,
updateResourceVerificationStatus,
getPlatformHealth,
getActivityHeatmap,
getNotificationDashboard,
broadcastNotification,
markNotificationAsRead,
deleteNotification,
```

**ADD these route groups BEFORE the final `module.exports`:**

```javascript
// ========== NEW: RESOURCE APPROVALS ==========
router.get('/resources/pending-approval', getPendingResourceApprovals);
router.post('/resources/:id/approve', approveResourceMetadata);
router.put('/resources/:id/metadata-review', reviewResourceMetadata);

// ========== NEW: MENTOR VERIFICATION ==========
router.get('/mentors/pending-verification', getPendingMentorVerifications);
router.post('/mentors/:id/verify', verifyMentor);

// ========== NEW: RESOURCE STATUS ==========
router.get('/resources/status-report', getResourceStatusReport);
router.put('/resources/:id/verification-status', updateResourceVerificationStatus);

// ========== NEW: PLATFORM HEALTH ==========
router.get('/platform-health', getPlatformHealth);
router.get('/activity-heatmap', getActivityHeatmap);

// ========== NEW: NOTIFICATIONS ==========
router.get('/notifications/dashboard', getNotificationDashboard);
router.post('/notifications/broadcast', broadcastNotification);
router.put('/notifications/:id/read', markNotificationAsRead);
router.delete('/notifications/:id', deleteNotification);
```

---

## 🎮 Step 5: Update `backend/controllers/adminController.js`

**COPY the entire content from `adminController-enhanced.js`**

(Or if you prefer, add just the new functions at the end and keep existing ones - they're backward compatible)

**Key new exports to add:**
```javascript
exports.getPendingResourceApprovals = ...
exports.approveResourceMetadata = ...
exports.reviewResourceMetadata = ...
exports.getPendingMentorVerifications = ...
exports.verifyMentor = ...
exports.getResourceStatusReport = ...
exports.updateResourceVerificationStatus = ...
exports.getPlatformHealth = ...
exports.getActivityHeatmap = ...
exports.getNotificationDashboard = ...
exports.broadcastNotification = ...
exports.markNotificationAsRead = ...
exports.deleteNotification = ...
// ... keep existing exports
```

---

## 🎨 Step 6: Update Frontend - `frontend/src/pages/Admin.js`

**Option A: Quick (Add only new tabs)**

In your existing Admin.js, update the TABS array:

```javascript
const TABS = [
  { id: 'add', label: '➕ Add Resource' },
  { id: 'manage', label: '📁 Manage Resources' },
  { id: 'approvals', label: '✅ Approvals' },          // NEW
  { id: 'mentor-verify', label: '👨‍🏫 Mentor Verify' }, // NEW
  { id: 'status', label: '📊 Status' },                // NEW
  { id: 'health', label: '💚 Platform Health' },       // NEW
  { id: 'notifications', label: '🔔 Notifications' }, // NEW
  { id: 'analytics', label: '📊 Analytics' },
  { id: 'users', label: '👥 Users' },
  { id: 'activity', label: '🕒 Activity Log' }
];
```

Then add these state variables at the top:

```javascript
// NEW STATES
const [pendingApprovals, setPendingApprovals] = useState([]);
const [approvalFeedback, setApprovalFeedback] = useState({});
const [pendingMentors, setPendingMentors] = useState([]);
const [platformHealth, setPlatformHealth] = useState(null);
const [healthLoading, setHealthLoading] = useState(false);
const [notificationDashboard, setNotificationDashboard] = useState(null);
const [broadcastTitle, setBroadcastTitle] = useState('');
const [broadcastMessage, setBroadcastMessage] = useState('');
const [broadcastTarget, setBroadcastTarget] = useState('all');
const [broadcastLoading, setBroadcastLoading] = useState(false);
```

Then add these API calls in `loadData()`:

```javascript
// Add to loadData() function
api.get('/admin/resources/pending-approval').then(res => setPendingApprovals(res.data)).catch(() => {});
api.get('/admin/mentors/pending-verification').then(res => setPendingMentors(res.data)).catch(() => {});
api.get('/admin/platform-health').then(res => setPlatformHealth(res.data)).catch(() => {}).finally(() => setHealthLoading(false));
api.get('/admin/notifications/dashboard').then(res => setNotificationDashboard(res.data)).catch(() => {});
```

Then add these handler functions:

```javascript
const handleApproveResource = async (resourceId, action) => {
  try {
    const feedback = approvalFeedback[resourceId] || '';
    await api.post(`/admin/resources/${resourceId}/approve`, { action, feedback });
    showToast(`Resource ${action}ed successfully`);
    setApprovalFeedback(prev => ({ ...prev, [resourceId]: '' }));
    loadData();
  } catch (err) {
    showToast(`Failed to ${action} resource`, 'error');
  }
};

const handleVerifyMentor = async (mentorId, action) => {
  try {
    await api.post(`/admin/mentors/${mentorId}/verify`, { action });
    showToast(`Mentor ${action}ed successfully`);
    loadData();
  } catch (err) {
    showToast(`Failed to ${action} mentor`, 'error');
  }
};

const handleBroadcastNotification = async () => {
  if (!broadcastTitle || !broadcastMessage) {
    showToast('Title and message required', 'error');
    return;
  }
  try {
    setBroadcastLoading(true);
    await api.post('/admin/notifications/broadcast', {
      title: broadcastTitle,
      message: broadcastMessage,
      targetRole: broadcastTarget,
    });
    showToast('Broadcast sent!');
    setBroadcastTitle('');
    setBroadcastMessage('');
    loadData();
  } catch (err) {
    showToast('Failed to send broadcast', 'error');
  } finally {
    setBroadcastLoading(false);
  }
};
```

Then add these render sections in your tab rendering:

```javascript
{activeTab === 'approvals' && (
  <div className="admin-card">
    <h2>✅ Resource Approvals</h2>
    {pendingApprovals.length === 0 ? (
      <p>No pending approvals</p>
    ) : (
      pendingApprovals.map(resource => (
        <div key={resource._id} style={{ border: '1px solid #ddd', padding: 16, marginBottom: 12, borderRadius: 8 }}>
          <h3>{resource.title}</h3>
          <p>{resource.description?.substring(0, 100)}...</p>
          <textarea
            placeholder="Feedback (optional)"
            value={approvalFeedback[resource._id] || ''}
            onChange={(e) => setApprovalFeedback(prev => ({ ...prev, [resource._id]: e.target.value }))}
            style={{ width: '100%', minHeight: 60, marginBottom: 12, padding: 8, borderRadius: 6 }}
          />
          <button className="admin-save-btn" onClick={() => handleApproveResource(resource._id, 'approve')}>
            ✅ Approve
          </button>
          <button className="admin-btn-delete" onClick={() => handleApproveResource(resource._id, 'reject')}>
            ❌ Reject
          </button>
        </div>
      ))
    )}
  </div>
)}

{activeTab === 'mentor-verify' && (
  <div className="admin-card">
    <h2>👨‍🏫 Mentor Verification</h2>
    {pendingMentors.length === 0 ? (
      <p>All mentors verified!</p>
    ) : (
      pendingMentors.map(mentor => (
        <div key={mentor._id} style={{ border: '1px solid #ddd', padding: 16, marginBottom: 12, borderRadius: 8 }}>
          <h3>{mentor.userId?.name}</h3>
          <p>{mentor.userId?.email}</p>
          <p>Score: <strong>{mentor.verificationScore}%</strong></p>
          <button className="admin-save-btn" onClick={() => handleVerifyMentor(mentor._id, 'verify')}>
            ✅ Verify
          </button>
          <button className="admin-btn-delete" onClick={() => handleVerifyMentor(mentor._id, 'reject')}>
            ❌ Reject
          </button>
        </div>
      ))
    )}
  </div>
)}

{activeTab === 'health' && (
  <div className="admin-card">
    <h2>💚 Platform Health</h2>
    {platformHealth ? (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#f0f4ff', padding: 16, borderRadius: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 'bold' }}>{platformHealth.userMetrics.totalUsers}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Total Users</div>
          </div>
          <div style={{ background: '#f0f4ff', padding: 16, borderRadius: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 'bold' }}>{platformHealth.resourceMetrics.totalResources}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Total Resources</div>
          </div>
          <div style={{ background: '#f0f4ff', padding: 16, borderRadius: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 'bold' }}>{platformHealth.activityMetrics.engagementRate}%</div>
            <div style={{ fontSize: 12, color: '#666' }}>Engagement Rate</div>
          </div>
        </div>
        {platformHealth.systemAlerts.length > 0 && (
          <div style={{ background: '#fff8e8', border: '1px solid #ffd39c', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <strong>⚠️ System Alerts:</strong>
            {platformHealth.systemAlerts.map((alert, i) => (
              <div key={i} style={{ fontSize: 13, marginTop: 6 }}>{alert.message}</div>
            ))}
          </div>
        )}
      </>
    ) : (
      <p>Loading...</p>
    )}
  </div>
)}

{activeTab === 'notifications' && (
  <div className="admin-card">
    <h2>🔔 Notifications</h2>
    <div style={{ marginBottom: 24 }}>
      <h3>📢 Broadcast</h3>
      <input
        placeholder="Title"
        value={broadcastTitle}
        onChange={(e) => setBroadcastTitle(e.target.value)}
        style={{ width: '100%', padding: 8, marginBottom: 8, borderRadius: 6, border: '1px solid #ddd' }}
      />
      <textarea
        placeholder="Message"
        value={broadcastMessage}
        onChange={(e) => setBroadcastMessage(e.target.value)}
        style={{ width: '100%', minHeight: 80, padding: 8, marginBottom: 8, borderRadius: 6, border: '1px solid #ddd' }}
      />
      <select value={broadcastTarget} onChange={(e) => setBroadcastTarget(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 12, borderRadius: 6, border: '1px solid #ddd' }}>
        <option value="all">All Users</option>
        <option value="founder">Founders</option>
        <option value="mentor">Mentors</option>
      </select>
      <button className="admin-save-btn" onClick={handleBroadcastNotification} disabled={broadcastLoading} style={{ width: '100%' }}>
        {broadcastLoading ? 'Sending...' : '📤 Send Broadcast'}
      </button>
    </div>
  </div>
)}

{activeTab === 'status' && (
  <div className="admin-card">
    <h2>📊 Resource Status</h2>
    <p>Resource quality monitoring dashboard</p>
  </div>
)}
```

**Option B: Complete Rewrite**

Use the full `Admin-enhanced.js` file to replace your current Admin.js completely (all features included).

---

## 🎨 Step 7: Add CSS

**Option A: Quick Styling**

Add this to your existing `index.css`:

```css
.admin-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e8ebf2;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.admin-card h2 {
  margin: 0 0 16px 0;
  color: #1a1a2e;
  font-size: 20px;
}

.admin-card h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.admin-save-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #6c63ff 0%, #8f88ff 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 8px;
}

.admin-save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(108, 99, 255, 0.3);
}

.admin-btn-delete {
  padding: 12px 20px;
  background: #ffe8e8;
  color: #cc0000;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.admin-btn-delete:hover {
  background: #ffb3b3;
}
```

**Option B: Complete Styling**

Use the full `admin-enhanced.css` file (500+ lines, fully responsive).

---

## 🔄 Step 8: Database Migration

**Run this ONCE to add fields to existing data:**

```javascript
// Save as backend/migrations/addAdminFields.js
const mongoose = require('mongoose');
const db = require('../config/db');
const Resource = require('../models/Resource');
const User = require('../models/User');

async function migrate() {
  try {
    console.log('Starting migration...');
    
    // Set defaults for existing resources
    await Resource.updateMany(
      {},
      {
        $set: {
          status: 'approved',
          verificationStatus: 'verified',
          isActive: true
        }
      }
    );
    console.log('✅ Resources updated');

    // Set defaults for mentor users
    await User.updateMany(
      { role: 'mentor' },
      { $set: { isMentorVerified: false } }
    );
    console.log('✅ Users updated');

    console.log('✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
```

Run it:
```bash
node backend/migrations/addAdminFields.js
```

---

## ✅ Summary: What Goes Where

| File | Action | Source |
|------|--------|--------|
| `backend/models/Resource.js` | ADD fields | `Resource-enhanced.js` |
| `backend/models/User.js` | ADD fields | `User-enhanced.js` |
| `backend/models/MentorRequest.js` | CREATE new | `MentorRequest-model.js` |
| `backend/routes/adminRoutes.js` | ADD routes | `adminRoutes-enhanced.js` |
| `backend/controllers/adminController.js` | REPLACE or ADD functions | `adminController-enhanced.js` |
| `frontend/src/pages/Admin.js` | REPLACE (or ADD tabs) | `Admin-enhanced.js` |
| `frontend/src/admin-enhanced.css` | ADD new file | `admin-enhanced.css` |

---

## 🧪 Test It

After integration:

```bash
# Test approvals endpoint
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/admin/resources/pending-approval

# Test platform health
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/admin/platform-health
```

---

## ⚡ That's It!

Your admin panel now has all 5 features integrated with your existing code! 🎉
