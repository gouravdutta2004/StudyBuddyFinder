const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/billing/upgrade
// @desc    Mock upgrading a user's subscription tier
// @access  Private
router.post('/upgrade', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    
    // Validate requested plan
    if (!['basic', 'pro', 'squad'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid subscription tier' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set expiration to 1 year from now for mock purposes
    const expiration = new Date();
    expiration.setFullYear(expiration.getFullYear() + 1);

    user.subscription = {
      plan,
      activeUntil: expiration
    };

    await user.save();

    res.json({
      message: `Successfully upgraded to ${plan.toUpperCase()} tier!`,
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Server error processing transaction' });
  }
});

module.exports = router;
