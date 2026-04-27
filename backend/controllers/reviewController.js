const Review = require('../models/Review');
const Doctor = require('../models/Doctor');

// @desc    Create new review
// @route   POST /api/doctors/:id/reviews
// @access  Private (Patient)
const createDoctorReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const doctorId = req.params.id;

    const doctor = await Doctor.findById(doctorId);

    if (doctor) {
      const alreadyReviewed = await Review.findOne({
        doctorId,
        patientId: req.user._id
      });

      if (alreadyReviewed) {
        return res.status(400).json({ message: 'Doctor already reviewed' });
      }

      const review = await Review.create({
        patientId: req.user._id,
        doctorId,
        rating: Number(rating),
        comment,
      });

      // Update Doctor's rating
      const reviews = await Review.find({ doctorId });
      doctor.numOfReviews = reviews.length;
      doctor.ratings = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

      await doctor.save();
      res.status(201).json({ message: 'Review added' });
    } else {
      res.status(404).json({ message: 'Doctor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor reviews
// @route   GET /api/doctors/:id/reviews
// @access  Public
const getDoctorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ doctorId: req.params.id }).populate('patientId', 'name profileImage');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDoctorReview,
  getDoctorReviews
};
