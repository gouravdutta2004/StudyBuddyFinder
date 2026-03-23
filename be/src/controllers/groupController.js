const StudyGroup = require('../models/StudyGroup');

const getGroups = async (req, res) => {
  try {
    const { subject, search } = req.query;
    const query = { isPublic: true };
    if (subject) query.subject = new RegExp(subject, 'i');
    if (search) query.name = new RegExp(search, 'i');

    const groups = await StudyGroup.find(query)
      .populate('creator', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createGroup = async (req, res) => {
  try {
    const { name, description, subject, maxMembers } = req.body;
    const group = await StudyGroup.create({
      name, description, subject, maxMembers: maxMembers || 50,
      creator: req.user._id,
      members: [req.user._id]
    });
    const ActivityLog = require('../models/ActivityLog');
    await ActivityLog.create({
      type: 'general',
      description: `New squad formed: "${name}"`,
      userId: req.user._id,
      groupId: group._id
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const joinGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.members.includes(req.user._id))
      return res.status(400).json({ message: 'Already a member' });
    if (group.members.length >= group.maxMembers)
      return res.status(400).json({ message: 'Group is full' });

    group.members.push(req.user._id);
    await group.save();
    
    const ActivityLog = require('../models/ActivityLog');
    await ActivityLog.create({
      type: 'general',
      description: `Joined the squad: "${group.name}"`,
      userId: req.user._id,
      groupId: group._id
    });
    
    res.json({ message: 'Joined group successfully', group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    await group.save();
    res.json({ message: 'Left group successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getGroupQuickPeek = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
      .select('name subject maxMembers members')
      .populate('members', 'name avatar');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    // Attempt to find a next session by matching subject
    const Session = require('../models/Session');
    const nextSession = await Session.findOne({ 
      subject: group.subject,
      startTime: { $gt: new Date() }
    }).sort({ startTime: 1 }).select('startTime');

    res.json({
      _id: group._id, name: group.name, subject: group.subject,
      memberCount: group.members.length, maxMembers: group.maxMembers,
      members: group.members.slice(0, 5), // Return up to 5 members
      nextSession: nextSession ? nextSession.startTime : null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateGroupKanban = async (req, res) => {
  try {
    const { kanbanTasks } = req.body;
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    group.kanbanTasks = kanbanTasks;
    await group.save();
    res.json(group.kanbanTasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadGroupResource = async (req, res) => {
  try {
    const { id, type, url, title } = req.body;
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const newResource = { id, type, url, title, uploadedBy: req.user._id };
    group.resources.push(newResource);
    await group.save();
    
    // Auto-create an activity log for resource upload
    const ActivityLog = require('../models/ActivityLog');
    await ActivityLog.create({
      type: 'general',
      description: `New resource "${title}" shared in squad`,
      userId: req.user._id,
      groupId: group._id
    });

    res.status(201).json(newResource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getGroups, createGroup, joinGroup, leaveGroup, getGroupQuickPeek, updateGroupKanban, uploadGroupResource };
