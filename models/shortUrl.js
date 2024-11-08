// const mongoose = require('mongoose');
// const shortId = require('shortid');
// const moment = require('moment'); // For working with expiration dates

// const shortUrlSchema = new mongoose.Schema({
//   full: {
//     type: String,
//     required: true
//   },
  
//   short: {
//     type: String,
//     required: true,
//     default: shortId.generate
//   },
  
//   clicks: {
//     type: Number,
//     required: true,
//     default: 0
//   },

//   // New field for expiration date (optional)
//   expiration: {
//     type: Date, 
//     default: null // Set to null if no expiration is provided
//   },

//   // New field for tracking when the URL was last accessed
//   lastAccessed: {
//     type: Date, 
//     default: null // Automatically update when the URL is accessed
//   }
// });

// module.exports = mongoose.model('ShortUrl', shortUrlSchema);


const mongoose = require('mongoose');
const moment = require('moment'); // For working with expiration dates

const shortUrlSchema = new mongoose.Schema({
  full: {
    type: String,
    required: true
  },
  
  short: {
    type: String,
    required: true,
    unique: true
  },
  
  clicks: {
    type: Number,
    required: true,
    default: 0
  },

  expiration: {
    type: Date,
    default: null
  },

  lastAccessed: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('ShortUrl', shortUrlSchema);
