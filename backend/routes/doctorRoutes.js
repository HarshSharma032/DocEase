const express = require('express');
const router = express.Router();
const { 
    getDoctors, 
    getDoctorById, 
    getDoctorProfile, 
    updateDoctorProfile, 
    updateAvailability 
} = require('../controllers/doctorController');
const { createDoctorReview, getDoctorReviews } = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

router.route('/').get(getDoctors);
router.route('/profile/me').get(protect, restrictTo('Doctor'), getDoctorProfile).put(protect, restrictTo('Doctor'), updateDoctorProfile);
router.route('/availability').put(protect, restrictTo('Doctor'), updateAvailability);
router.route('/:id').get(getDoctorById);
router.route('/:id/reviews').get(getDoctorReviews).post(protect, createDoctorReview);

module.exports = router;
