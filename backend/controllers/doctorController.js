const Doctor = require('../models/Doctor');
const NodeCache = require('node-cache');

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

// @desc    Get all active/approved doctors (with cache + pagination + filters)
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
  try {
    const pageSize = Number(req.query.limit) || 12;
    const page = Number(req.query.page) || 1;
    const keyword = req.query.keyword || '';
    const specialty = req.query.specialty || 'All';

    // Build cache key from query params
    const cacheKey = `doctors_${page}_${pageSize}_${keyword}_${specialty}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = { isApproved: true };

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { specialization: { $regex: keyword, $options: 'i' } }
      ];
    }

    if (specialty && specialty !== 'All') {
      query.specialization = specialty;
    }

    const count = await Doctor.countDocuments(query);
    const doctors = await Doctor.find(query)
      .select('-password')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .lean(); // Use lean() for performance - returns plain JS objects

    const result = {
      doctors,
      page,
      pages: Math.ceil(count / pageSize),
      total: count
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-password').lean();
    if (doctor && doctor.isApproved) {
      res.json(doctor);
    } else {
      res.status(404).json({ message: 'Doctor not found or not approved' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current doctor profile
// @route   GET /api/doctors/profile/me
// @access  Private (Doctor)
const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user._id).select('-password');
    if (doctor) {
      res.json(doctor);
    } else {
      res.status(404).json({ message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctors/profile/me
// @access  Private (Doctor)
const updateDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user._id);
    if (doctor) {
      doctor.name = req.body.name || doctor.name;
      doctor.about = req.body.about || doctor.about;
      doctor.specialization = req.body.specialization || doctor.specialization;
      doctor.experience = req.body.experience || doctor.experience;
      doctor.feesPerCunsultation = req.body.feesPerCunsultation || doctor.feesPerCunsultation;
      doctor.clinicAddress = req.body.clinicAddress || doctor.clinicAddress;
      doctor.profileImage = req.body.profileImage || doctor.profileImage;

      const updatedDoctor = await doctor.save();
      invalidateDoctorCache();
      res.json(updatedDoctor);
    } else {
      res.status(404).json({ message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update doctor availability (slots)
// @route   PUT /api/doctors/availability
// @access  Private (Doctor)
const updateAvailability = async (req, res) => {
  try {
    const { availableDays } = req.body;
    const doctor = await Doctor.findById(req.user._id);
    if (doctor) {
      doctor.availableDays = availableDays;
      await doctor.save();
      invalidateDoctorCache();
      res.json({ message: 'Availability updated successfully', availableDays: doctor.availableDays });
    } else {
      res.status(404).json({ message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  getDoctorProfile,
  updateDoctorProfile,
  updateAvailability,
  invalidateDoctorCache: () => cache.flushAll() 
};
