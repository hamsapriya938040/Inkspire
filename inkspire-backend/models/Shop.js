const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  shopName: { type: String, required: true },
  address: { type: String },
  qrCode: { type: String }, // base64 QR code image
  isOnline: { type: Boolean, default: false },
  pricing: {
    bwSingleSide: { type: Number, default: 1 },
    bwDoubleSide: { type: Number, default: 1.5 },
    colorSingleSide: { type: Number, default: 5 },
    colorDoubleSide: { type: Number, default: 8 },
    binding: { type: Number, default: 20 },
    stapling: { type: Number, default: 5 },
  },
  acceptsCash: { type: Boolean, default: true },
  acceptsUPI: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);