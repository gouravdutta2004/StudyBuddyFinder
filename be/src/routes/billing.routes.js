const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'dummy_key';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// @route   POST /api/billing/create-order
// @desc    Create a Razorpay order
// @access  Private
router.post('/create-order', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    
    // Validate requested plan
    if (!['basic', 'pro', 'squad'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid subscription tier' });
    }

    let amount = 0;
    if (plan === 'pro') amount = 79900; // 799 INR in paise
    if (plan === 'squad') amount = 159900; // 1599 INR in paise
    
    if (amount === 0) {
       return res.status(400).json({ message: 'Cannot create an order for a free plan' });
    }

    if (isMock) {
      return res.json({
        orderId: `order_mock_${Date.now()}`,
        amount,
        currency: "INR",
        key_id: 'rzp_test_mock'
      });
    }

    const receiptString = `receipt_${req.user.id}_${Date.now()}`.substring(0, 40);

    const options = {
      amount, 
      currency: "INR",
      receipt: receiptString,
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error creating order' });
  }
});

// @route   POST /api/billing/verify
// @desc    Verify Razorpay payment and upgrade user
// @access  Private
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    if (isMock) {
      if (razorpay_signature !== 'mock_signature') {
        return res.status(400).json({ message: 'Invalid mock signature.' });
      }
    } else {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');

      const isAuthentic = expectedSignature === razorpay_signature;

      if (!isAuthentic) {
        return res.status(400).json({ message: 'Invalid signature. Payment verification failed.' });
      }
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error verifying payment' });
  }
});

module.exports = router;
