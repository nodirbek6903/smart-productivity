const Notification = require("../models/Notification")

// @desc    Foydalanuvchi bildirishnomalarini olish
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    
    const filter = { recipient: req.user._id };
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }
    
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find(filter)
      .populate('sender', 'fullName avatar')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });
    
    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Bildirishnomalarni olishda xatolik',
      error: error.message
    });
  }
};

// @desc    Bildirishnomani o'qilgan deb belgilash
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Bildirishnoma topilmadi'
      });
    }
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Bildirishnomani yangilashda xatolik',
      error: error.message
    });
  }
};

// @desc    Barcha bildirishnomalarni o'qilgan deb belgilash
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.status(200).json({
      success: true,
      message: 'Barcha bildirishnomalar o\'qilgan deb belgilandi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Bildirishnomalarni yangilashda xatolik',
      error: error.message
    });
  }
};