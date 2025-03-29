const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
    trim: true,
  },
  lastname: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  photo: {
    type: String, // This could be a URL or base64 string for a profile photo
    required: false,
  },
  documents: {
    type: [String], // Array of strings for document URLs
    required: false,
  },
});

// Prevent re-declaring the model if already registered
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
