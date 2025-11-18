import Journal from '../models/Journal.js';

// @desc    Create a new journal entry
// @route   POST /api/journal
// @access  Private
export const createJournalEntry = async (req, res) => {
    try {
        console.log(req.body)
        console.log('Journal create request:', {
            userId: req.user?._id,
            bodyKeys: Object.keys(req.body),
            authHeader: req.headers.authorization ? 'Present' : 'Missing'
        });

        const { entryText, mood, tags } = req.body;

        // Validate input
        if (!entryText || typeof entryText !== 'string') {
            return res.status(400).json({ 
                message: 'entryText is required and must be a string',
                received: typeof entryText
            });
        }

        // Validate mood if provided
        if (mood !== undefined && mood !== null) {
            const moodNum = Number(mood);
            if (isNaN(moodNum) || moodNum < 1 || moodNum > 5) {
                return res.status(400).json({ 
                    message: 'mood must be a number between 1 and 5',
                    received: mood
                });
            }
        }

        // Validate tags if provided
        if (tags && !Array.isArray(tags)) {
            return res.status(400).json({
                message: 'tags must be an array',
                received: typeof tags
            });
        }

        // Create journal entry
        const journalEntry = await Journal.create({
            student: req.user._id,
            entryText: entryText.trim(),
            mood: mood ? Number(mood) : null,
            tags: tags?.map(tag => tag.trim().toLowerCase()) || []
        });

        console.log('Journal entry created:', {
            id: journalEntry._id,
            userId: journalEntry.student,
            date: journalEntry.entryDate
        });

        res.status(201).json(journalEntry);
    } catch (error) {
        console.error('Journal create error:', error);
        res.status(500).json({ 
            message: "Error creating journal entry",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get user's journal entries
// @route   GET /api/journal
// @access  Private
export const getJournalEntries = async (req, res) => {
    try {
        const entries = await Journal.find({ student: req.user._id })
            .sort({ entryDate: -1 })
            .limit(10);
        
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: "Error fetching journal entries" });
    }
};

// @desc    Delete a journal entry
// @route   DELETE /api/journal/:id
// @access  Private
export const deleteJournalEntry = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(req.params)

        // Validate entry ID
        if (!id) {
            return res.status(400).json({ message: 'Journal entry ID is required' });
        }

        // Find the entry
        const entry = await Journal.findById(id);

        if (!entry) {
            return res.status(404).json({ message: 'Journal entry not found' });
        }

        // Verify ownership - user can only delete their own entries
        if (entry.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this entry' });
        }

        // Delete the entry
        await Journal.findByIdAndDelete(id);

        console.log('Journal entry deleted:', {
            id: entry._id,
            userId: entry.student,
            deletedAt: new Date()
        });

        res.json({ message: 'Journal entry deleted successfully', id });
    } catch (error) {
        console.error('Journal delete error:', error);
        res.status(500).json({ 
            message: "Error deleting journal entry",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};