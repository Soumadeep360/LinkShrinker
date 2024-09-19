
// const express = require('express');
// const mongoose = require('mongoose');
// const ShortUrl = require('./models/shortUrl');
// const app = express();
// const moment = require('moment');

// mongoose.connect('mongodb://localhost/urlShortener', {
//   useNewUrlParser: true, 
//   useUnifiedTopology: true
// });

// app.set('view engine', 'ejs');
// app.use(express.urlencoded({ extended: false }));

// // Home route to list all shortened URLs
// app.get('/', async (req, res) => {
//   const shortUrls = await ShortUrl.find();
//   res.render('index', { shortUrls: shortUrls });
// });

// // Route to create new short URLs
// app.post('/shortUrls', async (req, res) => {
//   const { fullUrl, customUrl, expirationDate } = req.body;

//   // Check if custom URL is provided
//   let short = customUrl || generateShortUrl();
  
//   // Collision detection: Check if short URL already exists
//   const existingShortUrl = await ShortUrl.findOne({ short: short });
//   if (existingShortUrl) {
//     return res.status(400).send('Custom URL is already taken. Please choose another one.');
//   }

//   // Create new short URL with optional expiration date
//   const newShortUrl = new ShortUrl({
//     full: fullUrl,
//     short: short,
//     clicks: 0,
//     expiration: expirationDate ? moment(expirationDate).toDate() : null
//   });

//   await newShortUrl.save();
//   res.redirect('/');
// });

// // Route to handle short URL redirects
// app.get('/:shortUrl', async (req, res) => {
//   const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  
//   if (shortUrl == null) return res.sendStatus(404);

//   // Check if the URL has expired
//   if (shortUrl.expiration && new Date() > shortUrl.expiration) {
//     return res.status(410).send('This link has expired.');
//   }

//   // Increment click count and save the updated document
//   shortUrl.clicks++;
//   shortUrl.lastAccessed = new Date(); // Track the last time the URL was accessed
//   await shortUrl.save();

//   res.redirect(shortUrl.full);
// });

// // Function to generate random short URL (collision handling included)
// function generateShortUrl() {
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   let shortUrl = '';
//   for (let i = 0; i < 6; i++) {
//     shortUrl += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return shortUrl;
// }

// // Listen on port
// app.listen(process.env.PORT || 5000);



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

// Generate function that combines timestamp with random bytes
function generateShortUrl() {
  const currentTimestamp = Date.now().toString(36); // Convert timestamp to base36
  const randomString = crypto.randomBytes(4).toString('hex'); // Generate random bytes
  return `${currentTimestamp}-${randomString}`; // Combine for the short URL
}

// Home route to list all shortened URLs
app.get('/', async (req, res) => {
  const shortUrls = await ShortUrl.find();
  res.render('index', { shortUrls: shortUrls });
});

// Optimized Route to create new short URLs with efficient collision handling
app.post('/shortUrls', async (req, res) => {
  const { fullUrl, customUrl, expirationDate } = req.body;

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
