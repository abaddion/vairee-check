require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const PDFParser = require('pdf-parse');
const mammoth = require('mammoth');
const OpenAI = require('openai');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const ResumeCount = mongoose.model('ResumeCount', new mongoose.Schema({
  count: Number
}));

async function getResumeCount() {
  let countDoc = await ResumeCount.findOne();
  if (!countDoc) {
    countDoc = new ResumeCount({ count: 0 });
    await countDoc.save();
  }
  return countDoc.count;
}

async function incrementResumeCount() {
  const countDoc = await ResumeCount.findOneAndUpdate(
    {},
    { $inc: { count: 1 } },
    { new: true, upsert: true }
  );
  return countDoc.count;
}

function formatCount(count) {
  if (count >= 1000) {
    return Math.floor(count / 1000) + 'k';
  }
  return count.toString();
}

app.get('/visitor-count', async (req, res) => {
  const count = await getResumeCount();
  res.json({ count: formatCount(count) });
});

app.post('/analyze-resume', upload.single('resume'), async (req, res) => {
  try {
      let resumeContent = '';

      if (req.file) {
          if (req.file.mimetype === 'application/pdf') {
              const pdfData = await PDFParser(req.file.buffer);
              resumeContent = pdfData.text;
          } else if (['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(req.file.mimetype)) {
              const result = await mammoth.extractRawText({ buffer: req.file.buffer });
              resumeContent = result.value;
          } else {
              return res.status(400).send('Unsupported file type.');
          }
      }

      if (req.body.resumeText) {
          resumeContent += (resumeContent ? '\n\n' : '') + req.body.resumeText;
      }

      if (!resumeContent.trim()) {
          return res.status(400).send('No resume content provided.');
      }

      const prompt = `Analyze the following resume:

      ${resumeContent}

Provide a summary focusing on:
1. Is the resume well-formatted in terms of styling?
2. What are the key keywords mentioned?
3. What is the highest level of education mentioned?
4. What is the general impression of the candidate (e.g., senior JavaScript developer)?

Provide your analysis in a structured format.`;

const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: prompt }],
});

await incrementResumeCount();

console.log('Analysis completed');
        res.json({ analysis: completion.choices[0].message.content });

    } catch (error) {
        console.error('Error in /analyze-resume:', error);
        res.status(500).send('An error occurred while processing the resume.');
    }
});

app.post('/improve-resume', upload.single('resume'), async (req, res) => {
  try {
    let text = '';
    if (req.file) {
      // Handle file upload
      if (req.file.mimetype === 'application/pdf') {
        const pdfData = await PDFParser(req.file.buffer);
        text = pdfData.text;
      } else if (['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(req.file.mimetype)) {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        text = result.value;
      } else {
        return res.status(400).send('Unsupported file type.');
      }
    } else if (req.body.resumeText) {
      // Handle pasted text
      text = req.body.resumeText;
    } else {
      return res.status(400).send('No resume content provided.');
    }

    const analysis = req.body.analysis;

    if (!text.trim()) {
      return res.json({ improvements: "I couldn't read any content from the resume. Please ensure you've uploaded a valid file or pasted text." });
    }

    const prompt = `Given the following resume analysis:

${req.body.analysis}

Provide suggestions for improving this resume. Focus on:
1. Enhancing the formatting and styling
2. Strengthening the use of keywords
3. Highlighting education and experience effectively
4. Improving the overall impression

Then, generate an improved version of the resume text based on these suggestions.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ improvements: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while improving the resume.');
  }
});

// Only start the server if we're not in a Vercel environment
if (process.env.VERCEL_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = app;