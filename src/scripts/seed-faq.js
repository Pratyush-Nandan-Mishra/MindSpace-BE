import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../config/database.js';
import FAQ from '../models/FAQ.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const faqsPath = path.join(__dirname, 'faqs.json');
const faqs = JSON.parse(fs.readFileSync(faqsPath, 'utf-8'));

async function seedDB() {
  try {
    await connectDB();

    await FAQ.deleteMany({});
    console.log('Existing FAQs cleared!'); //Clear existing FAQs  so that no dulplicate

    // Insert all new FAQs
    const result = await FAQ.insertMany(faqs, { ordered: false }); // Continue on individual errors
    console.log(`Successfully inserted ${result.length} FAQs into the database!`);

    process.exit(0); // Exit cleanly
  } catch (error) {
    console.error('Error seeding FAQs:', error);
    process.exit(1);
  }
}

seedDB();