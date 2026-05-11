import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  picture: {
    type: String
  },
  provider: {
    type: String,
    default: 'google'
  },
  // isVerified: {
  //   type: Boolean,
  //   default: false
  // },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true
  },
  emailNotifications: {
    type: Boolean,
    default: false
  },
  accessToken: String,
  refreshToken: String
}, {
  timestamps: true, collection: "users"
});

userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });

userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

userSchema.statics.findOrCreateFromGoogle = async function(profile) {
  let user = await this.findOne({ googleId: profile.id });
  
  if (!user) {
    user = await this.create({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      picture: profile.photos[0]?.value,
      isVerified: true
    });
  }
  else {
    user.name = profile.displayName;
    user.firstName = profile.name.givenName;
    user.lastName = profile.name.familyName;
    user.picture = profile.photos[0]?.value;
    user.lastLogin = new Date();
    await user.save();
  }
  
  return user;
};

const User = mongoose.model('User', userSchema);

export default User; 