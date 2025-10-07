import mongoose from "mongoose";
import Review from "../models/Review.model.js";
import User from "../models/user.model.js";

/* =====================================================
   ✅ 1. Add Review
===================================================== */
export const addReview = async (req, res) => {
  try {
    const { productId, userId, rating, comment } = req.body;

    if (!productId || !userId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Check if user already reviewed this product
    const existing = await Review.findOne({ productId, userId });
    if (existing) {
      existing.rating = rating;
      existing.comment = comment || "";
      await existing.save();
      return res.status(200).json({
        success: true,
        message: "Review updated successfully",
        data: existing,
      });
    }

    const review = new Review({
      productId,
      userId,
      name: user.name,
      avatar: user.avatar || "",
      rating,
      comment: comment || "",
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: review,
    });
  } catch (error) {
    console.error("Add Review Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   ✅ 2. Get Reviews (for Product Page)
===================================================== */
export const getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 3 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid productId",
      });
    }

    // Fetch limited reviews for display
    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // ✅ Average Rating (from all reviews)
    const allReviews = await Review.find({ productId });
    const totalReviews = allReviews.length;
    const averageRating =
      totalReviews > 0
        ? allReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
        : 0;

    res.status(200).json({
      success: true,
      data: reviews,
      totalReviews,
      averageRating: Number(averageRating.toFixed(1)),
    });
  } catch (error) {
    console.error("Get Reviews Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   ✅ 3. Get Only Average Rating (for Product Card)
===================================================== */
export const getAverageRating = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid productId",
      });
    }

    const reviews = await Review.find({ productId });
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
        : 0;

    res.status(200).json({
      success: true,
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews,
    });
  } catch (error) {
    console.error("Average Rating Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   ✅ 4. Delete Review (Admin Only)
===================================================== */
export const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { userId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(reviewId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid IDs",
      });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const deleted = await Review.findByIdAndDelete(reviewId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete Review Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
