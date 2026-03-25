const Message = require('../models/Message');
const User = require('../models/User');
const Admin = require('../models/Admin');
const FlaggedItem = require('../models/FlaggedItem');
const { sendPushToUser } = require('../utils/pushNotification');


const BAD_WORDS = ['spam', 'abuse', 'offensive', 'scam', 'fake', 'hate', 'slur'];

const filterText = async (text, senderId, receiverId, source) => {
  let flagged = false;
  let cleanText = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(cleanText)) {
      flagged = true;
      cleanText = cleanText.replace(regex, '***');
    }
  });

  if (flagged) {
    try {
      await FlaggedItem.create({ author: senderId, originalText: text, source: source, recipient: receiverId });
    } catch(err) { console.error('FlaggedItem save error', err); }
  }
  return cleanText;
};

const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!content || !receiverId) return res.status(400).json({ message: 'Missing payload' });
    
    let receiver = await User.findById(receiverId);
    if (!receiver) receiver = await Admin.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: 'Target identity not found.' });

    const cleanContent = await filterText(content, req.user._id, receiverId, 'Direct Message');

    const message = await Message.create({ sender: req.user._id, receiver: receiverId, content: cleanContent });
    
    const msgObj = message.toObject();
    let senderObj = await User.findById(req.user._id).select('name avatar').lean();
    if (!senderObj) {
      senderObj = await Admin.findById(req.user._id).select('name avatar').lean();
      if (senderObj) senderObj.isAdmin = true;
    }
    msgObj.sender = senderObj;

    // Send browser push to receiver (fire-and-forget, don't block response)
    sendPushToUser(receiverId, {
      title: `💬 New message from ${senderObj?.name || 'Someone'}`,
      body: cleanContent.length > 80 ? cleanContent.substring(0, 80) + '...' : cleanContent,
      icon: '/icons.svg',
      url: '/messages'
    }).catch(() => {});

    res.status(201).json(msgObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const messagesRaw = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    }).lean().sort({ createdAt: 1 });

    const messages = await Promise.all(messagesRaw.map(async msg => {
      let s = await User.findById(msg.sender).select('name avatar').lean();
      if (!s) {
        s = await Admin.findById(msg.sender).select('name avatar').lean();
        if (s) s.isAdmin = true;
      }
      msg.sender = s;
      return msg;
    }));

    await Message.updateMany({ sender: userId, receiver: req.user._id, read: false }, { read: true });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getInbox = async (req, res) => {
  try {
    const messagesRaw = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    }).lean().sort({ createdAt: -1 });

    const seen = new Set();
    const conversations = [];
    
    for (const msg of messagesRaw) {
      const otherId = msg.sender.toString() === req.user._id.toString() ? msg.receiver.toString() : msg.sender.toString();
      
      if (!seen.has(otherId)) {
        seen.add(otherId);
        
        let s = await User.findById(msg.sender).select('name avatar').lean();
        if (!s) {
          s = await Admin.findById(msg.sender).select('name avatar').lean();
          if (s) s.isAdmin = true;
        }
        msg.sender = s;

        let r = await User.findById(msg.receiver).select('name avatar').lean();
        if (!r) {
          r = await Admin.findById(msg.receiver).select('name avatar').lean();
          if (r) r.isAdmin = true;
        }
        msg.receiver = r;

        conversations.push(msg);
      }
    }
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendMessage, getConversation, getInbox };
