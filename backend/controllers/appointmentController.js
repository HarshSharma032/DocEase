const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const logger = require('../utils/logger');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummyKEY',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummySecret'
});

// @desc    Initiate Appointment Booking (Concurrency Safe)
// @route   POST /api/appointments
// @access  Private (Patient)
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot, reason } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isApproved) {
      return res.status(404).json({ message: 'Doctor not found or not approved' });
    }

    // STRICT SLOT VALIDATION: Check if slot exists in doctor's availableDays
    const appointmentDate = new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[appointmentDate.getDay()];

    const dayAvailability = doctor.availableDays.find(d => d.day === dayName);
    if (!dayAvailability || !dayAvailability.slots.some(s => s.startTime === timeSlot)) {
      return res.status(400).json({ message: `Doctor is not available at ${timeSlot} on ${dayName}` });
    }

    // CHECK DOUBLE BOOKING
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date,
      timeSlot,
      status: { $nin: ['Cancelled', 'Rejected'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'Time slot is already booked. Please choose another.' });
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      date,
      timeSlot,
      reason,
      amount: doctor.feesPerCunsultation,
      paymentStatus: 'pending'
    });
    
    // We notify user that appointment is initiated...
    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('notification', { message: 'Booking initiated. Please complete payment.' });
    }

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create Razorpay Order
// @route   POST /api/appointments/:id/razorpay-order
// @access  Private (Patient)
const createRazorpayOrder = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      logger.error(`[Razorpay] Order creation failed: Appointment ${appointmentId} not found`);
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if appointment is already paid
    if (appointment.paymentStatus === 'Completed') {
      return res.status(400).json({ message: 'Appointment already paid' });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const hasProperKeys = process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('YOUR_ACTUAL');

    if (!hasProperKeys && isProduction) {
       logger.error('[Razorpay] PRODUCTION ERROR: Razorpay keys are missing or invalid.');
       return res.status(500).json({ message: 'Payment gateway configuration error.' });
    }

    if (!hasProperKeys) {
       logger.warn('[Razorpay] Using dummy/invalid keys in non-production mode.');
    }

    const options = {
      amount: Math.round(appointment.amount * 100), // in paise, ensure integer
      currency: "INR",
      receipt: `receipt_order_${appointment._id}`,
    };

    const order = await razorpay.orders.create(options);
    
    logger.info(`[Razorpay] Order created for appointment ${appointment._id}: ${order.id}`);

    // Create a NEW Payment record for this attempt
    // We keep multiple records if they retry, but only one will eventually be 'success'
    const payment = await Payment.create({
      appointmentId: appointment._id,
      patientId: req.user._id,
      razorpayOrderId: order.id,
      amount: appointment.amount,
      status: 'pending'
    });

    // Link the LATEST order and payment record to the appointment
    appointment.paymentIntentId = order.id;
    appointment.paymentId = payment._id;
    await appointment.save();

    res.json({
      ...order,
      paymentId: payment._id
    });
  } catch (error) {
    logger.error(`[Razorpay] Order creation error: ${error.message}`);
    res.status(500).json({ message: error.message || 'Failed to create payment order' });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/appointments/verify-payment
// @access  Private (Patient)
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.body;

    logger.info(`[Razorpay] Verifying payment for Appointment: ${appointmentId}, Order: ${razorpay_order_id}`);

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                                   .update(body.toString())
                                   .digest('hex');

    if (expectedSignature === razorpay_signature) {
      const appointment = await Appointment.findById(appointmentId);
      const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

      if (appointment && payment) {
        // IDEMPOTENCY CHECK
        if (payment.status === 'success') {
           logger.info(`[Razorpay] Payment ${razorpay_payment_id} already processed for Order ${razorpay_order_id}`);
           return res.json({ success: true, message: 'Payment already processed', appointmentId: appointment._id });
        }

        // Update Payment Record
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.status = 'success';
        await payment.save();

        // Update Appointment
        appointment.paymentStatus = 'success';
        appointment.status = 'confirmed'; 
        await appointment.save();

        logger.info(`[Razorpay] SUCCESS: Manual verification for appointment ${appointment._id}`);

        // Notification logic
        try {
          const patientInfo = await User.findById(appointment.patientId);
          const doctorInfo = await Doctor.findById(appointment.doctorId);
          if (patientInfo) {
            await sendEmail({
              email: patientInfo.email,
              subject: 'Appointment Booked Successfully',
              message: `Your appointment with Dr. ${doctorInfo.name} is confirmed for ${appointment.date} at ${appointment.timeSlot}.`
            });
          }
          
          const io = req.app.get('io');
          if (io) {
            io.to(appointment.patientId.toString()).emit('notification', { 
              type: 'PAYMENT_SUCCESS',
              message: 'Payment confirmed! your appointment is booked.',
              appointmentId: appointment._id
            });
          }
        } catch (notifyError) {
          logger.error(`[Notification Error] ${notifyError.message}`);
        }

        res.json({ success: true, message: 'Payment verified successfully', appointmentId: appointment._id });
      } else {
        logger.error(`[Razorpay] Record mismatch for Order ${razorpay_order_id}`);
        res.status(404).json({ success: false, message: 'Appointment or Payment record not found' });
      }
    } else {
      logger.error('[Razorpay] Invalid payment signature detected');
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    logger.error(`[Razorpay] Verification crash: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Handle Razorpay Webhook
// @route   POST /api/appointments/razorpay-webhook
// @access  Public
const handleRazorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!secret || !signature) {
      logger.error('[Razorpay Webhook] Missing secret or signature');
      return res.status(400).send('Webhook configuration error');
    }

    const expectedSignature = crypto.createHmac('sha256', secret)
                                   .update(req.rawBody)
                                   .digest('hex');

    if (expectedSignature !== signature) {
      logger.warn('[Razorpay Webhook] INVALID SIGNATURE ATTEMPT');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    const payload = req.body.payload.payment.entity;
    const orderId = payload.order_id;
    const paymentId = payload.id;

    logger.info(`[Razorpay Webhook] RECEIVED EVENT: ${event} for Order: ${orderId}, Payment: ${paymentId}`);

    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    const appointment = await Appointment.findOne({ paymentIntentId: orderId });

    if (!payment || !appointment) {
       logger.warn(`[Razorpay Webhook] DROPPED: Records not found for Order ${orderId}. Event: ${event}`);
       return res.status(200).json({ status: 'ignored' });
    }

    // IDEMPOTENCY: If already successful, skip
    if (payment.status === 'success') {
       logger.info(`[Razorpay Webhook] IDEMPOTENCY: Order ${orderId} already marked as success. skipping.`);
       return res.status(200).json({ status: 'already_processed' });
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      payment.status = 'success';
      payment.razorpayPaymentId = paymentId;
      payment.paymentMethod = payload.method;
      await payment.save();

      appointment.paymentStatus = 'success';
      appointment.status = 'confirmed';
      await appointment.save();
      
      logger.info(`[Razorpay Webhook] SUCCESS: Appointment ${appointment._id} confirmed via webhook`);
      
      // Notify via Socket if connected
      const io = req.app.get('io');
      if (io) {
        io.to(appointment.patientId.toString()).emit('notification', { 
           type: 'PAYMENT_WEBHOOK_CONFIRMED',
           message: 'Payment confirmed via webhook!',
           appointmentId: appointment._id
        });
      }
    } else if (event === 'payment.failed') {
      payment.status = 'failed';
      payment.razorpayPaymentId = paymentId;
      await payment.save();

      appointment.paymentStatus = 'failed';
      // User can retry booking
      await appointment.save();

      logger.warn(`[Razorpay Webhook] FAILURE: Payment failed for Order ${orderId}`);
    }

    // Always return 200 to Razorpay
    res.json({ status: 'ok' });
  } catch (error) {
    logger.error(`[Razorpay Webhook] CRITICAL ERROR: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's appointments
// @route   GET /api/appointments/my
// @access  Private (Patient)
const getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id }).populate('doctorId', 'name specialization clinicAddress');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor's appointments
// @route   GET /api/appointments/doctor
// @access  Private (Doctor)
const getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user._id }).populate('patientId', 'name email phone');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (Doctor or Admin)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body; 
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (req.user.role === 'Patient' && status !== 'Cancelled') {
         return res.status(401).json({ message: 'Patients can only cancel appointments' });
    }
    if (req.user.role === 'Doctor' && appointment.doctorId.toString() !== req.user._id.toString()) {
         return res.status(401).json({ message: 'Not authorized' });
    }

    appointment.status = status;
    const updatedAppointment = await appointment.save();

    // Send Real-time socket notification
    const io = req.app.get('io');
    if (io) {
      io.to(appointment.patientId.toString()).emit('notification', { 
         message: `Your appointment status changed to: ${status}` 
      });
    }

    // Send Email notification
    const patientInfo = await User.findById(appointment.patientId);
    if (patientInfo) {
      await sendEmail({
        email: patientInfo.email,
        subject: `Appointment Status Updated`,
        message: `Your appointment status is now: ${status}`
      });
    }

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reschedule appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private (Patient or Doctor)
const rescheduleAppointment = async (req, res) => {
  try {
    const { date, timeSlot } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Auth check
    if (req.user.role === 'Patient' && appointment.patientId.toString() !== req.user._id.toString()) {
       return res.status(401).json({ message: 'Not authorized' });
    }

    // Check availability of new slot
    const existingAppointment = await Appointment.findOne({
      doctorId: appointment.doctorId,
      date,
      timeSlot,
      status: { $nin: ['Cancelled', 'Rejected'] },
      _id: { $ne: appointment._id }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'New time slot is already booked.' });
    }

    appointment.date = date;
    appointment.timeSlot = timeSlot;
    appointment.status = 'Pending'; // Needs re-approval if changed? Yes, safer.
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  bookAppointment,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getUserAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  handleRazorpayWebhook
};
