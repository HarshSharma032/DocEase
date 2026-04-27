const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Doctor' },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  feesPerCunsultation: { type: Number, required: true },
  about: { type: String },
  education: { type: String },
  clinicAddress: { type: String },
  profileImage: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  }, // Admin needs to approve
  availableDays: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    slots: [{
      startTime: String,
      endTime: String,
      isBooked: { type: Boolean, default: false }
    }]
  }],
  ratings: { type: Number, default: 0 },
  numOfReviews: { type: Number, default: 0 }
}, { timestamps: true });

doctorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

doctorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compound indexes for fast search queries
doctorSchema.index({ specialization: 1, status: 1 });
doctorSchema.index({ ratings: -1 });
doctorSchema.index({ name: 'text', specialization: 'text' }); // Full text search

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;
