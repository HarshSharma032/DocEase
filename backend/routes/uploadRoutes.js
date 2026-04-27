const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middlewares/authMiddleware');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dummy_name',
  api_key: process.env.CLOUDINARY_API_KEY || '12345678',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dummy_secret'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'docbook_profiles',
    allowedFormats: ['jpg', 'png', 'jpeg']
  }
});

const upload = multer({ storage: storage });

router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Save the image URL to the appropriate user model
    let profileStore = await User.findById(req.user._id);
    if (!profileStore) {
      profileStore = await Doctor.findById(req.user._id);
    }
    
    // Check if we use profileImage schema addition. Let's add it on the fly if needed
    // Or just return the URL for frontend to use in profile update.
    const imageUrl = req.file.path;
    
    if (profileStore) {
        // Technically I haven't added profileImage to model yet, but Mongoose lets me if I use { strict: false } or add it in schema. I will update schemas.
        profileStore.profileImage = imageUrl;
        await profileStore.save();
    }

    res.json({ message: 'Image uploaded successfully', imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Image upload failed' });
  }
});

module.exports = router;
