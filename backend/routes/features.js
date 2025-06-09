const Meeting = require('../models/Meeting');
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Transcription = require('../models/Transcription');
const Summary = require('../models/Summary');
const MoM = require('../models/MoM');
const Recording = require('../models/Recording');


// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Create or update transcription for a meeting
router.post('/transcription', authenticate, async (req, res) => {
  try {
    const { meetingId, transcriptText } = req.body;
    let transcription = await Transcription.findOne({ meeting: meetingId });
    if (transcription) {
      transcription.transcriptText = transcriptText;
    } else {
      transcription = new Transcription({ meeting: meetingId, transcriptText });
    }
    await transcription.save();
    res.status(200).json({ transcription });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transcription for a meeting
router.get('/transcription/:meetingId', authenticate, async (req, res) => {
  try {
    const transcription = await Transcription.findOne({ meeting: req.params.meetingId });
    if (!transcription) {
      return res.status(404).json({ message: 'Transcription not found' });
    }
    res.status(200).json({ transcription });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update summary for a meeting
router.post('/summary', authenticate, async (req, res) => {
  try {
    const { meetingId, summaryText } = req.body;
    let summary = await Summary.findOne({ meeting: meetingId });
    if (summary) {
      summary.summaryText = summaryText;
    } else {
      summary = new Summary({ meeting: meetingId, summaryText });
    }
    await summary.save();
    res.status(200).json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get summary for a meeting
router.get('/summary/:meetingId', authenticate, async (req, res) => {
  try {
    const summary = await Summary.findOne({ meeting: req.params.meetingId });
    if (!summary) {
      return res.status(404).json({ message: 'Summary not found' });
    }
    res.status(200).json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update MoM for a meeting
router.post('/mom', authenticate, async (req, res) => {
  try {
    const { meetingId, momText } = req.body;
    let mom = await MoM.findOne({ meeting: meetingId });
    if (mom) {
      mom.momText = momText;
    } else {
      mom = new MoM({ meeting: meetingId, momText });
    }
    await mom.save();
    res.status(200).json({ mom });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get MoM for a meeting
router.get('/mom/:meetingId', authenticate, async (req, res) => {
  try {
    const mom = await MoM.findOne({ meeting: req.params.meetingId });
    if (!mom) {
      return res.status(404).json({ message: 'MoM not found' });
    }
    res.status(200).json({ mom });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

const mongoose = require('mongoose');

// Create or update recording for a meeting with file upload
router.post('/recording', authenticate, upload.single('file'), async (req, res) => {
  try {
    const meetingLink = req.body.meetingId;
    console.log('Recording upload request for meetingLink:', meetingLink, 'Type:', typeof meetingLink);
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    console.log('Uploaded file:', req.file);
    const recordingUrl = `/uploads/${req.file.filename}`;

    // Find meeting by meetingLink
    const meeting = await Meeting.findOne({ meetingLink });
    if (!meeting) {
      console.log('Meeting not found for meetingLink:', meetingLink);
      return res.status(400).json({ message: 'Invalid meetingLink' });
    }

    let recording = await Recording.findOne({ meeting: meeting._id });
    if (recording) {
      recording.recordingUrl = recordingUrl;
    } else {
      recording = new Recording({ meeting: meeting._id, recordingUrl });
    }
    await recording.save();
    console.log('Recording saved to DB:', recording);
    res.status(200).json({ recording });
  } catch (err) {
    console.error('Error in recording upload:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recording for a meeting
router.get('/recording/:meetingId', authenticate, async (req, res) => {
  try {
    const recording = await Recording.findOne({ meeting: req.params.meetingId });
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }
    res.status(200).json({ recording });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/recordings', authenticate, async (req, res) => {
  try {
    const recordings = await Recording.find().populate('meeting');
    res.status(200).json({ recordings });
  } catch (err) {
    console.error('Error fetching recordings:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
