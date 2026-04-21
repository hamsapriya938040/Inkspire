const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  fileUrl: { type: String, required: true },  // Cloudinary URL
  fileName: { type: String, required: true },
  filePublicId: { type: String },             // Cloudinary public_id for deletion
  printSettings: {
    colorMode: { type: String, enum: ['bw', 'color'], default: 'bw' },
    sides: { type: String, enum: ['single', 'double'], default: 'single' },
    copies: { type: Number, default: 1 },
    pageRange: { type: String, default: 'all' }, // 'all' or '1-3,5,7-9'
    paperSize: { type: String, enum: ['A4', 'A3', 'Letter'], default: 'A4' },
    orientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
    pagesPerSheet: { type: Number, default: 1 },
    binding: { type: Boolean, default: false },
    stapling: { type: Boolean, default: false },
  },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['upi', 'cash'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  orderStatus: { type: String, enum: ['pending', 'approved', 'printing', 'completed', 'rejected'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);