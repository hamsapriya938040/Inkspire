const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const Owner = require('../models/Owner');
const Shop = require('../models/Shop');

// Register Owner
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, shopName, address } = req.body;

    // Check if owner exists
    const existingOwner = await Owner.findOne({ email });
    if (existingOwner) return res.status(400).json({ message: 'Email already registered' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create owner
    const owner = new Owner({ name, email, password: hashedPassword });
    await owner.save();

    // Create shop
    const shop = new Shop({
      ownerId: owner._id,
      shopName,
      address,
    });
    await shop.save();

    // Generate QR code pointing to customer page
    const customerUrl = `${process.env.FRONTEND_URL}/shop/${shop._id}`;
    const qrCode = await QRCode.toDataURL(customerUrl);

    // Save QR to shop
    shop.qrCode = qrCode;
    await shop.save();

    // Link shop to owner
    owner.shopId = shop._id;
    await owner.save();

    // Generate token
    const token = jwt.sign(
      { id: owner._id, shopId: shop._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      owner: { id: owner._id, name, email },
      shop: { id: shop._id, shopName, qrCode },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Owner
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const owner = await Owner.findOne({ email });
    if (!owner) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: owner._id, shopId: owner.shopId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const shop = await Shop.findById(owner.shopId);

    res.json({
      token,
      owner: { id: owner._id, name: owner.name, email: owner.email },
      shop: { id: shop._id, shopName: shop.shopName, qrCode: shop.qrCode },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;