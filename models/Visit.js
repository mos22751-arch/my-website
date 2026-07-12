const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    // معلومات الزائر
    ip:        { type: String, default: 'unknown' },
    country:   { type: String, default: '' },
    city:      { type: String, default: '' },
    device:    { type: String, enum: ['mobile', 'tablet', 'desktop'], default: 'desktop' },
    os:        { type: String, default: '' },
    browser:   { type: String, default: '' },
    
    // معلومات الجلسة
    referrer:  { type: String, default: '' },
    language:  { type: String, default: '' },
    screen:    { type: String, default: '' },
    
    // التفاعل
    sectionsViewed:  [String],    // الأقسام اللي شافها
    projectsClicked: [String],    // المشاريع اللي ضغط عليها
    linksClicked:    [String],    // الروابط اللي ضغط عليها
    timeOnSite:      { type: Number, default: 0 }, // بالثواني
    
    // التاريخ
    visitedAt: { type: Date, default: Date.now }
}, {
    timestamps: false
});

// Index للبحث السريع
visitSchema.index({ visitedAt: -1 });
visitSchema.index({ ip: 1 });

module.exports = mongoose.model('Visit', visitSchema);
