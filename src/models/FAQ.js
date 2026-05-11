import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    index: true //faster 
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  labels: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true,
    index: true
  }
}, {
  timestamps: true
});

faqSchema.index({ question: 'text', category: 'text' });

const FAQ = mongoose.model('FAQ', faqSchema);

export default FAQ;