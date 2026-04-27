const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getAllUsers,
  getAllDoctors,
  approveDoctorStatus,
  deleteUser,
  getAllAppointments
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// All routes protected by admin middleware
router.use(protect, adminOnly);

router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.get('/doctors', getAllDoctors);
router.patch('/approve-doctor/:id', approveDoctorStatus);
router.delete('/users/:id', deleteUser);
router.get('/appointments', getAllAppointments);

module.exports = router;
