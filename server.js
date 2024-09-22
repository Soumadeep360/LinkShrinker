const express = require('express');
const mongoose = require('mongoose');
const ShortUrl = require('./models/shortUrl');
const crypto = require('crypto');
const moment = require('moment'); // For working with expiration dates
const app = express();

mongoose.connect('mongodb://localhost/urlShortener', {
  useNewUrlParser: true, 
  useUnifiedTopology: true
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

// // Generate function that combines timestamp with random bytes
// function generateShortUrl() {
//   const currentTimestamp = Date.now().toString(36); // Convert timestamp to base36
//   const randomString = crypto.randomBytes(4).toString('hex'); // Generate random bytes
//   return `${currentTimestamp}-${randomString}`; // Combine for the short URL
// }

const base62Chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Helper function to convert a number to Base62
function base62Encode(num) {
  let result = '';
  while (num > 0) {
    result = base62Chars[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result || '0';
}

// Generate function that combines Base62 encoded timestamp and random bytes for a fixed-length short URL (7 characters)
function generateShortUrl() {
  // Convert current timestamp to Base62 and take only the last 3 characters for compactness
  const timestamp = Date.now();
  const timestampPart = base62Encode(timestamp).slice(-3); // Taking last 3 characters of Base62 timestamp

  // Generate 3 random bytes (24 bits) and convert to Base62 (4 Base62 characters)
  const randomBytes = crypto.randomBytes(3); // 3 random bytes (24 bits)
  let randomPart = base62Encode(parseInt(randomBytes.toString('hex'), 16));

  // Ensure randomPart is exactly 4 characters (pad if necessary)
  randomPart = randomPart.padStart(4, '0').slice(-4);

  // Combine the timestamp part and the random part (total length: 3 + 4 = 7 characters)
  return `${timestampPart}${randomPart}`;
}

// Home route to list all shortened URLs
app.get('/', async (req, res) => {
  const shortUrls = await ShortUrl.find();
  res.render('index', { shortUrls: shortUrls });
});

// Optimized Route to create new short URLs with efficient collision handling
app.post('/shortUrls', async (req, res) => {
  const { fullUrl, customUrl, expirationDate } = req.body;
   // Check if the full URL already exists
   let existingShortUrl = await ShortUrl.findOne({ full: fullUrl });
  
   if (existingShortUrl) {
     // If the full URL is already present, reuse the existing short URL
     return res.redirect('/');
   }

  let short;
  
  if (customUrl) {
    // If the user provides a custom URL, use it and check for collision
    short = customUrl;
    const existingShortUrl = await ShortUrl.findOne({ short: short });
    if (existingShortUrl) {
      return res.status(400).send('Custom URL is already taken. Please choose another one.');
    }
  } else {
    // Generate a short URL and handle collision
    let isUnique = false;
    while (!isUnique) {
      short = generateShortUrl();
      const existingShortUrl = await ShortUrl.findOne({ short: short });
      if (!existingShortUrl) {
        isUnique = true; // Stop retrying if no collision is found
      }
    }
  }

  // Create the new short URL after confirming no collision
  const newShortUrl = new ShortUrl({
    full: fullUrl,
    short: short,
    clicks: 0,
    expiration: expirationDate ? moment(expirationDate).toDate() : null
  });

  await newShortUrl.save();
  res.redirect('/');
});

// Route to handle short URL redirects
app.get('/:shortUrl', async (req, res) => {
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  
  if (shortUrl == null) return res.sendStatus(404);

  // Check if the URL has expired
  if (shortUrl.expiration && new Date() > shortUrl.expiration) {
    return res.status(410).send('This link has expired.');
  }

  // Increment click count and save the updated document
  shortUrl.clicks++;
  shortUrl.lastAccessed = new Date(); // Track the last time the URL was accessed
  await shortUrl.save();

  res.redirect(shortUrl.full);
});

app.listen(process.env.PORT || 5000);


/*
generateShortUrl(): can generate 3.52 trillion possible combinations with fixed length of 7 characters..
*/

