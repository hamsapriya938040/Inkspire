const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');

// Multer setup - store in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not supported'), false);
  }
});

// Calculate price helper
const calculatePrice = (printSettings, pricing, totalPages) => {
  let pages = totalPages;

  // Handle page range
  if (printSettings.pageRange !== 'all') {
    pages = 0;
    const parts = printSettings.pageRange.split(',');
    parts.forEach(part => {
      part = part.trim();
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        pages += (end - start + 1);
      } else {
        pages += 1;
      }
    });
  }

  // Pages per sheet reduces effective pages
  const effectivePages = Math.ceil(pages / printSettings.pagesPerSheet);

  // Sheets needed
  let sheets = printSettings.sides === 'double'
    ? Math.ceil(effectivePages / 2)
    : effectivePages;

  // Price per sheet
  let pricePerSheet = 0;
  if (printSettings.colorMode === 'bw') {
    pricePerSheet = printSettings.sides === 'double'
      ? pricing.bwDoubleSide
      : pricing.bwSingleSide;
  } else {
    pricePerSheet = printSettings.sides === 'double'
      ? pricing.colorDoubleSide
      : pricing.colorSingleSide;
  }

  let total = sheets * pricePerSheet * printSettings.copies;

  // Add binding/stapling
  if (printSettings.binding) total += pricing.binding;
  if (printSettings.stapling) total += pricing.stapling;

  return Math.round(total * 100) / 100;
};

// Create order (customer)
router.post('/create/:shopId', upload.single('file'), async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    if (!shop.isOnline) return res.status(400).json({ message: 'Shop is currently offline' });

    const printSettings = JSON.parse(req.body.printSettings);
    const totalPages = parseInt(req.body.totalPages);
    const customerName = req.body.customerName;
    const customerPhone = req.body.customerPhone;
    const paymentMethod = req.body.paymentMethod;

    // Upload file to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'inkspire',
          use_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    // Calculate price
    const totalAmount = calculatePrice(printSettings, shop.pricing, totalPages);

    // Create order
    const order = new Order({
      shopId: shop._id,
      customerName,
      customerPhone,
      fileUrl: uploadResult.secure_url,
      fileName: req.file.originalname,
      filePublicId: uploadResult.public_id,
      printSettings,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
      orderStatus: 'pending',
    });

    await order.save();

    res.status(201).json({
      message: 'Order created',
      orderId: order._id,
      totalAmount,
      order,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Calculate price before order (customer)
router.post('/calculate/:shopId', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    const { printSettings, totalPages } = req.body;
    const totalAmount = calculatePrice(printSettings, shop.pricing, totalPages);

    res.json({ totalAmount });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all orders for owner dashboard
router.get('/owner/all', auth, async (req, res) => {
  try {
    const orders = await Order.find({ shopId: req.owner.shopId })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve order (owner)
router.put('/owner/approve/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId, shopId: req.owner.shopId },
      { orderStatus: 'approved' },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order approved', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject order (owner)
router.put('/owner/reject/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId, shopId: req.owner.shopId },
      { orderStatus: 'rejected' },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Delete file from Cloudinary
    if (order.filePublicId) {
      await cloudinary.uploader.destroy(order.filePublicId, { resource_type: 'raw' });
    }

    res.json({ message: 'Order rejected', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark as completed (owner)
router.put('/owner/complete/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId, shopId: req.owner.shopId },
      { orderStatus: 'completed' },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Delete file from Cloudinary after printing
    if (order.filePublicId) {
      await cloudinary.uploader.destroy(order.filePublicId, { resource_type: 'raw' });
    }

    res.json({ message: 'Order completed', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;