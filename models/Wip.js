const mongoose = require('mongoose');
const wipSchema = new mongoose.Schema({
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status:      { type: String, enum: ['next', 'progress', 'done'], default: 'next' },
    emoji:       { type: String, default: '🔧' },
    link:        { type: String, default: '' },
    order:       { type: Number, default: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Wip', wipSchema);
