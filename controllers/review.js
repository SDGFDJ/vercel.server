// controllers/review.js
import mongoose from "mongoose";
import Review from "../models/Review.model.js";
import User from "../models/user.model.js";

// Add a review
export const addReview = async (req, res) => {
  try {
    const { productId, userId, rating, comment } = req.body;

    if (!productId || !userId || !rating) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Create review
    const review = new Review({
      productId,
      userId,
      name: user.name,          // Required by schema
      avatar: user.avatar || "", // Optional
      rating,
      comment: comment || "",
    });

    await review.save();

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get reviews for a product
export const getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 3 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid productId" });
    }

    const reviews = await Review.find({ productId })
      .sort({ rating: -1, createdAt: -1 })
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({ productId });
    const averageRating = reviews.length
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

    res.json({
      success: true,
      data: reviews,
      totalReviews,
      averageRating: Number(averageRating.toFixed(1)), // Fix for frontend .toFixed error
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a review (admin only)
export const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { userId } = req.body; // Current logged-in user

    if (!mongoose.Types.ObjectId.isValid(reviewId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid IDs" });
    }

    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const deleted = await Review.findByIdAndDelete(reviewId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
