// const Comment = require("../models/Comment");
// const Task = require("../models/Task");
// const Notification = require("../models/Notification");
// const AuditLog = require("../models/AuditLog");

// exports.createComment = async (req, res) => {
//   try {
//     const { content, parentComment } = req.body;

//     const taskId = req.params.taskId;

//     const task = await Task.findById(taskId).populate("assignedTo createdBy");
//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         message: "Vazifa topilmadi",
//       });
//     }

//     const comment = await Comment.create({
//       content,
//       task: taskId,
//       parentComment: parentComment || null,
//       author: req.user._id,
//     });

//     if(task.assignedTo && task.assignedTo._id.toString() !== req.user._id.toString()){
//         await Notification.create({
//             recipient:task.assignedTo._id,
//             sender:req.user._id,
//             type:"COMMENT",
//             title:"Yangi comment",
//             message:`"${task.title}" vazifasiga izoh qoldirildi`,
//             relatedEntity:{entityType:"Task",entityId:taskId}
//         })
//     }

//     if(task.createdBy && task.createdBy._id.toString() !== req.user._id.toString()){
//         await Notification.create({
//             recipient:task.createdBy._id,
//             sender:req.user._id,
//             type:"COMMENT",
//             title:"New comment",
//             message:`"${task.title}" vaifasiga izoh qoldirildi`,
//             relatedEntity:{entityType:"Task",entityId:taskId}
//         })
//     }

//     await AuditLog.create({
//         user:req.user._id,
//         action:"CREATE_COMMENT",
//         entity:"Comment",
//         entityId:comment._id,
//         changes:{created:comment.toJSON()},
//         ipAddress:req.ip,
//         userAgent:req.headers["user-agent"]
//     })

//     res.status(201).json({
//         success:true,
//         message:"Comment muvaffaqqiyatli yaratildi",
//         data:comment
//     })
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Komment yaratishda xatolik",
//       error: error.message,
//     });
//   }
// };
