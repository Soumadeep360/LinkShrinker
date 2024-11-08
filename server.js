const express = require('express');
const mongoose = require('mongoose');
const ShortUrl = require('./models/shortUrl');
const crypto = require('crypto');
const moment = require('moment');
const { createClient } = require('redis');
const { copyFileSync } = require('fs');
const app = express();
require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB Atlas connection error:', err));

// Connect to Redis
const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_URI,
    port: 15263
  }
});

async function connectToRedis() {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Error connecting to Redis:', error);
  }
}

connectToRedis();

redisClient.on('error', (error) => {
  console.error('Redis error:', error);
});

async function checkCache(req, res, next) {
  try {
    const { shortUrl } = req.params;

    // Check if the URL data is in Redis cache
    let cachedData = await redisClient.get(shortUrl);
    if (cachedData !== null) {
      const cachedDataParsed = JSON.parse(cachedData);

      // Check if the cached link has expired
      if (cachedDataParsed.expiration && new Date() > new Date(cachedDataParsed.expiration)) {
        return res.status(410).send('This link has expired (from cache).');
      }

      // If the link is valid, update the click count in MongoDB
      const shortUrlDoc = await ShortUrl.findOne({ short: shortUrl });
      if (shortUrlDoc) {
        shortUrlDoc.clicks += 1;
        shortUrlDoc.lastAccessed = new Date();
        await shortUrlDoc.save();
      }

      // Redirect to the original URL from the cache
      return res.redirect(cachedDataParsed.full);
    }

    // If not in cache, proceed to the next middleware
    next();
  } catch (error) {
    console.error('Error in checkCache middleware:', error);
    return res.status(500).send('Internal Server Error');
  }
}


const base62Chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function base62Encode(num) {
  let result = '';
  while (num > 0) {
    result = base62Chars[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result || '0';
}

function generateShortUrl() {
  const timestamp = Date.now();
  const timestampPart = base62Encode(timestamp).slice(-3);
  const randomBytes = crypto.randomBytes(3);
  let randomPart = base62Encode(parseInt(randomBytes.toString('hex'), 16));
  randomPart = randomPart.padStart(4, '0').slice(-4);
  return `${timestampPart}${randomPart}`;
}

// Render the main page with the list of shortened URLs
app.get('/', async (req, res) => {
  const shortUrls = await ShortUrl.find();
  res.render('index', { shortUrls: shortUrls, host: req.headers.host, errorMessage: null });
});

// Create a new short URL
app.post('/shortUrls', async (req, res) => {
  const { fullUrl, customUrl, expirationDate } = req.body;

  let short;
  if (customUrl) {
    short = customUrl;
    const existingShortUrl = await ShortUrl.findOne({ short: short });
    if (existingShortUrl) {
      // Render with an error message if the custom URL is taken
      const shortUrls = await ShortUrl.find();
      return res.render('index', {
        shortUrls: shortUrls,
        host: req.headers.host,
        errorMessage: 'Custom URL is already taken.'
      });
    }
  } else {
    let isUnique = false;
    while (!isUnique) {
      short = generateShortUrl();
      const existingShortUrl = await ShortUrl.findOne({ short: short });
      if (!existingShortUrl) isUnique = true;
    }
  }

  const newShortUrl = new ShortUrl({
    full: fullUrl,
    short: short,
    clicks: 0,
    expiration: expirationDate ? moment(expirationDate).toDate() : null
  });

  await newShortUrl.save();
  res.redirect('/');
});

// Redirect to the full URL and increment the click count
app.get('/:shortUrl', checkCache, async (req, res) => {
  const { shortUrl } = req.params;

  const shortUrlDoc = await ShortUrl.findOne({ short: shortUrl });
  if (shortUrlDoc == null) return res.sendStatus(404);

  // Check if the link has expired
  if (shortUrlDoc.expiration && new Date() > shortUrlDoc.expiration) {
    return res.status(410).send('This link has expired.');
  }

  // Increment click count and update the last accessed time
  shortUrlDoc.clicks += 1;
  shortUrlDoc.lastAccessed = new Date();
  await shortUrlDoc.save();

  // Cache the updated short URL data in Redis, including the click count
  const cacheData = JSON.stringify({
    full: shortUrlDoc.full,
    expiration: shortUrlDoc.expiration,
    clicks: shortUrlDoc.clicks // Include the updated click count in cache
  });
  await redisClient.set(shortUrl, cacheData);

  console.log(`Redirecting to: ${shortUrlDoc.full}, Clicks: ${shortUrlDoc.clicks}`);

  // Redirect to the original URL
  return res.redirect(shortUrlDoc.full);
});


// Delete route to remove a short URL by ID
app.post('/shortUrls/:id/delete', async (req, res) => {
  const { id } = req.params;

  try {
    await ShortUrl.findByIdAndDelete(id);
    res.redirect('/');
  } catch (error) {
    console.error('Error deleting URL:', error);
    res.status(500).send('Error deleting URL.');
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log('Server is running on port 5000');
});
