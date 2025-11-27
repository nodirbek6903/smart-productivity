const Notification = require("../models/Notification")

exports.createNotification = async ({user,title,body,meta}) => {
    const n = await Notification.create({user,title,body,meta})
    // If you have socket.io: io.to(user).emit('notification', n)
  return n;
}

exports.getUserNotifications = async (userId, {page=1,limit = 20} = {}) => {
    return Notification.find({user:userId}).sort({createdAt:-1}).skip((page-1)*limit).limit(limit)
}