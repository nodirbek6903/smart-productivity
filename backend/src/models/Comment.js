// const mongoose = require('mongoose');

// const commentSchema = new mongoose.Schema({
//   content: {
//     type: String,
//     required: [true, 'Kommentariya matni majburiy'],
//     trim: true
//   },
//   task: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Task',
//     required: true
//   },
//   author: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   parentComment: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Comment',
//     default: null
//     // Reply qilish uchun
//   },
//   attachments: [{
//     filename: String,
//     path: String,
//     size: Number,
//     mimetype: String,
//     uploadedAt: { type: Date, default: Date.now }
//   }],
//   isEdited: {
//     type: Boolean,
//     default: false
//   },
//   editedAt: {
//     type: Date
//   }
// }, {
//   timestamps: true
// });

// // Index
// commentSchema.index({ task: 1, createdAt: -1 });

// module.exports = mongoose.model('Comment', commentSchema);
