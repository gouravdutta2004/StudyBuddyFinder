const User = require('../models/User');
const Admin = require('../models/Admin');
const Feedback = require('../models/Feedback');
const Subject = require('../models/Subject');
const sendEmail = require('../utils/sendEmail');
const { sendPushToUser } = require('../utils/pushNotification');

const getProfile = async (req, res) => {
  try {
    let user = await User.findById(req.params.id).populate('connections', 'name avatar subjects university');
    
    if (!user) {
      user = await Admin.findById(req.params.id);
      if (user) {
        user = user.toJSON();
        user.isAdmin = true;
      }
    }
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const fields = ['name', 'bio', 'avatar', 'subjects', 'educationLevel', 'university', 'location', 'studyStyle', 'availability', 'preferOnline', 'socialLinks'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        user[f] = req.body[f];
      }
    });

    if (user.socialLinks) {
      let count = 0;
      if (user.socialLinks.github?.trim()) count++;
      if (user.socialLinks.linkedin?.trim()) count++;
      if (user.socialLinks.instagram?.trim()) count++;
      user.isVerified = count >= 2;
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { subject, location, educationLevel, studyStyle, name } = req.query;
    const query = { _id: { $ne: req.user._id }, isActive: true, isAdmin: { $ne: true } };
    if (subject) query.subjects = { $in: [new RegExp(subject, 'i')] };
    if (location) query.location = new RegExp(location, 'i');
    if (educationLevel) query.educationLevel = educationLevel;
    if (studyStyle) query.studyStyle = studyStyle;
    if (name) query.name = new RegExp(name, 'i');
    const users = await User.find(query).select('-password').limit(50);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMatches = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const excluded = [me._id, ...me.connections, ...me.sentRequests, ...me.pendingRequests];
    
    // Fetch all active potential matches
    const candidates = await User.find({
      _id: { $ne: req.user._id, $nin: excluded },
      isActive: true,
      isAdmin: { $ne: true }
    }).select('-password').lean();

    // Scoring Engine
    const scoredMatches = candidates.map(c => {
      let score = 0;
      
      // +40% for shared subjects
      if (me.subjects && c.subjects && me.subjects.length > 0) {
        const sharedSubjects = me.subjects.filter(s => c.subjects.includes(s));
        if (sharedSubjects.length > 0) {
           // Provide up to 40% proportional to shared subjects, or flat 40 if 100% matched
           score += Math.min(40, (sharedSubjects.length / me.subjects.length) * 40);
        }
      }
      
      // +30% for same major
      if (me.major && c.major && me.major.trim() !== '' && me.major.toLowerCase().trim() === c.major.toLowerCase().trim()) {
        score += 30;
      }
      
      // +30% for overlapping schedules
      if (me.availability && me.availability.length > 0 && c.availability && c.availability.length > 0) {
        let overlapFound = false;
        me.availability.forEach(mAvail => {
            const hasMatch = c.availability.find(cAvail => cAvail.day === mAvail.day);
            if (hasMatch) {
              overlapFound = true;
            }
        });
        if (overlapFound) score += 30;
      }
      
      return { ...c, matchScore: Math.round(score), matchPercentage: Math.round(score) };
    });

    const filteredAndSorted = scoredMatches
      .filter(c => c.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);

    res.json(filteredAndSorted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const sendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (req.user.connections.includes(userId))
      return res.status(400).json({ message: 'Already connected' });
    if (req.user.sentRequests.includes(userId))
      return res.status(400).json({ message: 'Request already sent' });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { sentRequests: userId } });
    await User.findByIdAndUpdate(userId, { $addToSet: { pendingRequests: req.user._id } });

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(userId).emit('notification', { message: `New connection request from ${req.user.name}` });
      }
      // Browser push notification
      await sendPushToUser(userId, {
        title: '📨 New Connection Request',
        body: `${req.user.name} wants to connect with you on StudyBuddyFinder!`,
        icon: '/icons.svg',
        url: '/connections'
      });
      await sendEmail({
        email: target.email,
        subject: 'New Study Buddy Request!',
        message: `Hello ${target.name},\n\nYou have a new connection request from ${req.user.name}.\nLog into StudyBuddyFinder to accept or decline the request!\n\nBest,\nThe StudyBuddyFinder Team`
      });
    } catch (err) {
      console.error('Email/Notification failed to send but request was dispatched:', err);
    }

    res.json({ message: 'Connection request sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const acceptRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!req.user.pendingRequests.includes(userId))
      return res.status(400).json({ message: 'No pending request from this user' });
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { connections: userId },
      $pull: { pendingRequests: userId }
    });
    await User.findByIdAndUpdate(userId, {
      $addToSet: { connections: req.user._id },
      $pull: { sentRequests: req.user._id }
    });

    const targetUser = await User.findById(userId);
    if (targetUser) {
      try {
        const io = req.app.get('io');
        if (io) {
          io.to(userId).emit('notification', { message: `${req.user.name} accepted your connection request!` });
        }
        // Browser push notification
        await sendPushToUser(userId, {
          title: '🎉 Connection Accepted!',
          body: `${req.user.name} accepted your connection request. You can now message each other!`,
          icon: '/icons.svg',
          url: '/connections'
        });
        await sendEmail({
          email: targetUser.email,
          subject: 'Connection Request Accepted!',
          message: `Hello ${targetUser.name},\n\nGreat news! ${req.user.name} has accepted your connection request.\nYou can now message each other on StudyBuddyFinder!\n\nBest,\nThe StudyBuddyFinder Team`
        });
      } catch (err) {
        console.error('Email/Notification failed to send but connection was formed:', err);
      }
    }

    res.json({ message: 'Connection accepted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(req.user._id, { $pull: { pendingRequests: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { sentRequests: req.user._id } });
    res.json({ message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getConnections = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('connections', 'name avatar subjects university location')
      .populate('pendingRequests', 'name avatar subjects university')
      .populate('sentRequests', 'name avatar subjects university');
    res.json({
      connections: user.connections,
      pendingRequests: user.pendingRequests,
      sentRequests: user.sentRequests
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const disconnectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndUpdate(req.user._id, { $pull: { connections: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { connections: req.user._id } });
    res.json({ message: 'Disconnected successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { type, content } = req.body;
    if (!type || !content) return res.status(400).json({ message: 'Type and content required' });
    const feedback = await Feedback.create({ user: req.user._id, type, content });
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getPublicSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true }).sort({ name: 1 });
    res.json(subjects);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getSupportAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({ isActive: true }).select('_id');
    if (!admin) return res.status(404).json({ message: 'No active support administrators' });
    res.json({ _id: admin._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const logStudy = async (req, res) => {
  try {
    const { minutes } = req.body;
    if (!minutes) return res.status(400).json({ message: 'Minutes required' });
    const user = await User.findById(req.user._id);
    
    // Update study hours
    user.studyHours = (user.studyHours || 0) + (minutes / 60);
    
    // Update streak (simple logic)
    const now = new Date();
    const last = user.lastStudyDate ? new Date(user.lastStudyDate) : null;
    
    if (!last || now.setHours(0,0,0,0) > new Date(last.getTime() + 86400000).setHours(0,0,0,0)) {
      // It's been more than a day, streak broken
      user.streak = 1;
    } else if (now.setHours(0,0,0,0) > last.setHours(0,0,0,0)) {
      // It's the next day, increment streak
      user.streak += 1;
    }
    
    user.lastStudyDate = new Date();
    
    // Evaluate badges
    const badges = new Set(user.badges || []);
    if (user.studyHours >= 10) badges.add('10h Scholar');
    if (user.studyHours >= 50) badges.add('50h Master');
    if (user.streak >= 7) badges.add('7-Day Streak');
    user.badges = Array.from(badges);

    await user.save();
    res.json({ message: 'Study time logged', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ isActive: true, isAdmin: { $ne: true } })
      .select('name avatar studyHours streak badges')
      .sort({ studyHours: -1 }) // Sort top study hours
      .limit(20);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getQuickPeek = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name avatar subjects lastStudyDate level xp isActive');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Online if active within last 30 minutes
    const isOnline = user.lastStudyDate && (new Date() - new Date(user.lastStudyDate) < 30 * 60 * 1000);
    
    // Calculate mutual subjects
    const currentUser = await User.findById(req.user._id).select('subjects');
    const mutualSubjects = (user.subjects || []).filter(s => (currentUser.subjects || []).includes(s));
    
    // Calculate average rating
    const Rating = require('../models/Rating');
    const ratings = await Rating.find({ targetUser: user._id });
    const avgRating = ratings.length ? (ratings.reduce((acc, r) => acc + r.score, 0) / ratings.length).toFixed(1) : 'New';

    res.json({
      _id: user._id, name: user.name, avatar: user.avatar, level: user.level || 1,
      isOnline, mutualSubjects, avgRating, isActive: user.isActive
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const syncGithub = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.socialLinks || !user.socialLinks.github) {
      return res.status(400).json({ message: 'GitHub username not linked prior to sync' });
    }
    const username = user.socialLinks.github.trim();
    // Native node 18+ fetch
    const response = await fetch(`https://api.github.com/users/${username}/events/public`);
    if (!response.ok) return res.status(400).json({ message: 'Failed to access remote GitHub history' });
    
    const events = await response.json();
    const dates = events.map(e => new Date(e.created_at));
    
    // Merge dates securely limits massive array overhead
    user.activityLog = [...(user.activityLog || []), ...dates].slice(-500); 
    await user.save();
    
    res.json({ message: 'GitHub coordinates synched deeply into heatmap!', activityLog: user.activityLog });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProfile, updateProfile, searchUsers, getMatches, sendRequest, acceptRequest, rejectRequest, getConnections, disconnectUser, submitFeedback, getPublicSubjects, getSupportAdmin, logStudy, getLeaderboard, getQuickPeek, syncGithub };
