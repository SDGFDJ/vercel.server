// routes/review.js
import express from 'express';
import { addReview, getReviews, deleteReview } from '../controllers/review.js'; // controller updated with deleteReview

const router = express.Router();

// Add review
router.post('/add', addReview);

// Get reviews for a product
router.get('/:productId', getReviews);

// Delete a review (admin only)
// Admin userId ko body me bhejna hoga ya auth middleware se fetch kar sakte ho
router.delete('/delete/:id', deleteReview);

export default router;
