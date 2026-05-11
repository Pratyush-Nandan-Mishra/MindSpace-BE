import FAQ from '../models/FAQ.js';


// Search FAQs by question, labels, or category
export const searchFAQs = async (req, res) => {

  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.json({ success: true, results: [] });
    }

    const query = {
      $text: { $search: q }  
    };

    const results = await FAQ.find(query, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(5);

    res.json({ success: true, results });
  } catch (error) {
    console.error('Search FAQ error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

// Get all FAQs (for admin dashboard)
export const getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find({}).sort({ createdAt: -1 });
    res.json({ success: true, faqs });
  } catch (error) {
    console.error('Get all FAQs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Get single FAQ by ID
export const getFAQById = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findById(id);

    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    res.json({ success: true, faq });
  } catch (error) {
    console.error('Get FAQ by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Create a new FAQ (admin only)
export const createFAQ = async (req, res) => {
  try {
    const { question, answer, labels, category } = req.body;

    // Basic validation
    if (!question || !answer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Question and answer are required' 
      });
    }

    const faq = new FAQ({
      question: question.trim(),
      answer: answer.trim(),
      labels: Array.isArray(labels) ? labels.map(l => l.trim()) : [],
      category: category?.trim() || null
    });

    const savedFAQ = await faq.save();
    res.status(201).json({ success: true, faq: savedFAQ });
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};


// Update an existing FAQ (admin only)
export const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, labels, category } = req.body;

    const updatedFAQ = await FAQ.findByIdAndUpdate(
      id,
      {
        question: question?.trim(),
        answer: answer?.trim(),
        labels: Array.isArray(labels) ? labels.map(l => l.trim()) : [],
        category: category?.trim() || null
      },
      { new: true, runValidators: true }
    );

    if (!updatedFAQ) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    res.json({ success: true, faq: updatedFAQ });
  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

//Delete an FAQ (also admin only)
export const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByIdAndDelete(id);

    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};