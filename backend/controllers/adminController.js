const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { invalidateDoctorCache } = require('./doctorController');
const logger = require('../utils/logger');

// @desc    Get admin analytics dashboard
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res) => {
  try {
    const [totalUsers, totalDoctors, totalAppointments, pendingDoctors, revenueData] = await Promise.all([
      User.countDocuments({ role: 'Patient' }),
      Doctor.countDocuments({ status: 'approved' }),
      Appointment.countDocuments(),
      Doctor.countDocuments({ status: 'pending' }),

      // Monthly revenue (last 6 months)
      Appointment.aggregate([
        {
          $match: {
            paymentStatus: 'Completed',
            createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            totalRevenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const totalRevenue = revenueData.reduce((acc, m) => acc + m.totalRevenue, 0);

    // Appointments by status
    const statusBreakdown = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      totalUsers,
      totalDoctors,
      totalAppointments,
      pendingDoctors,
      totalRevenue,
      revenueData,
      statusBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all doctors (approved + pending)
// @route   GET /api/admin/doctors
// @access  Private (Admin)
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({}).select('-password').lean();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve or reject a doctor
// @route   PUT /api/admin/doctors/:id/approve
// @access  Private (Admin)
const approveDoctorStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const oldStatus = doctor.status;
    doctor.status = status;
    await doctor.save();

    logger.info(`[Admin] Doctor ${doctor.name} status updated from ${oldStatus} to ${status}`);

    // Invalidate cached doctor listings safely
    try {
      if (typeof invalidateDoctorCache === 'function') {
        invalidateDoctorCache();
      }
    } catch (cacheErr) {
      console.error('Cache invalidation failed:', cacheErr);
    }

    res.json({
      message: `Doctor ${status} successfully`,
      doctor: { _id: doctor._id, name: doctor.name, status: doctor.status }
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ message: error.message || 'Internal server error during approval' });
  }
};

// @desc    Delete a user or doctor
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      return res.json({ message: 'User removed' });
    }
    const doctor = await Doctor.findById(req.params.id);
    if (doctor) {
      await doctor.deleteOne();
      invalidateDoctorCache();
      return res.json({ message: 'Doctor removed' });
    }
    res.status(404).json({ message: 'User not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all appointments (admin view)
// @route   GET /api/admin/appointments
// @access  Private (Admin)
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 })
      .lean();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnalytics,
  getAllUsers,
  getAllDoctors,
  approveDoctorStatus,
  deleteUser,
  getAllAppointments
};
