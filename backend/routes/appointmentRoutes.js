const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getUserAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  handleRazorpayWebhook
} = require('../controllers/appointmentController');
const { protect, doctorOnly, restrictTo } = require('../middlewares/authMiddleware');

router.route('/').post(protect, bookAppointment);
router.route('/:id/razorpay-order').post(protect, createRazorpayOrder);
router.route('/verify-payment').post(protect, verifyRazorpayPayment);
router.route('/my').get(protect, getUserAppointments);
router.route('/doctor').get(protect, doctorOnly, getDoctorAppointments);
router.route('/:id/status').put(protect, updateAppointmentStatus);
router.route('/:id/reschedule').put(protect, rescheduleAppointment);
router.route('/razorpay-webhook').post(handleRazorpayWebhook);

module.exports = router;
