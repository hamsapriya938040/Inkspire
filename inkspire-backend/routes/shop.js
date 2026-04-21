const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');

// Get shop details (public - for customer page)
router.get('/:shopId', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId)
      .select('-qrCode'); // don't send QR to customer
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get shop details with QR (owner only)
router.get('/owner/myshop', auth, async (req, res) => {
  try {
    const shop = await Shop.findById(req.owner.shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update pricing
router.put('/owner/pricing', auth, async (req, res) => {
  try {
    const { pricing } = req.body;
    const shop = await Shop.findByIdAndUpdate(
      req.owner.shopId,
      { pricing },
      { new: true }
    );
    res.json({ message: 'Pricing updated', pricing: shop.pricing });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update shop settings
router.put('/owner/settings', auth, async (req, res) => {
  try {
    const { shopName, address, acceptsCash, acceptsUPI, isOnline } = req.body;
    const shop = await Shop.findByIdAndUpdate(
      req.owner.shopId,
      { shopName, address, acceptsCash, acceptsUPI, isOnline },
      { new: true }
    );
    res.json({ message: 'Settings updated', shop });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;