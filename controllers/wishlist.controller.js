import UserModel from "../models/user.model.js";

// ADD TO WISHLIST
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.userId; // auth middleware से आएगा

    if (!productId) {
      return res.status(400).json({ success: false, message: "ProductId required" });
    }

    const user = await UserModel.findById(userId);

    if (user.wishlist.includes(productId)) {
      return res.json({ success: true, message: "Already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    return res.json({ success: true, message: "Added to wishlist", data: user.wishlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// REMOVE FROM WISHLIST
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.userId;

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: productId } },
      { new: true }
    );

    return res.json({ success: true, message: "Removed from wishlist", data: user.wishlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET USER WISHLIST
export const getWishlist = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await UserModel.findById(userId).populate("wishlist");

    return res.json({ success: true, data: user.wishlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
