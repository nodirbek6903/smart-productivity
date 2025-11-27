const TimeLog = require("../models/Timelog")
const Task = require("../models/Task")

exports.startTimer = async (req, res) => {
  try {
    const { taskId, description } = req.body;
    
    // Vazifa mavjudligini tekshirish
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Vazifa topilmadi'
      });
    }
    
    // Aktiv timer borligini tekshirish
    const activeTimer = await TimeLog.findOne({
      user: req.user._id,
      status: 'RUNNING'
    });
    
    if (activeTimer) {
      return res.status(400).json({
        success: false,
        message: 'Sizda allaqachon ishlab turgan timer mavjud'
      });
    }
    
    const timeLog = await TimeLog.create({
      user: req.user._id,
      task: taskId,
      project: task.project,
      startTime: new Date(),
      description,
      status: 'RUNNING'
    });
    
    await timeLog.populate([
      { path: 'task', select: 'title' },
      { path: 'project', select: 'name' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Timer boshlandi',
      data: timeLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Timerni boshlashda xatolik',
      error: error.message
    });
  }
};

// @desc    Vaqt kuzatuvini to'xtatish
// @route   PUT /api/time/:id/stop
// @access  Private
exports.stopTimer = async (req, res) => {
  try {
    const timeLog = await TimeLog.findById(req.params.id);
    
    if (!timeLog) {
      return res.status(404).json({
        success: false,
        message: 'TimeLog topilmadi'
      });
    }
    
    if (timeLog.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu timerga ruxsatingiz yo\'q'
      });
    }
    
    if (timeLog.status !== 'RUNNING') {
      return res.status(400).json({
        success: false,
        message: 'Timer allaqachon to\'xtatilgan'
      });
    }
    
    timeLog.endTime = new Date();
    timeLog.status = 'STOPPED';
    await timeLog.save();
    
    // Task'ning actualHours ni yangilash
    const task = await Task.findById(timeLog.task);
    if (task) {
      task.actualHours = (task.actualHours || 0) + (timeLog.duration / 60);
      await task.save();
    }
    
    await timeLog.populate([
      { path: 'task', select: 'title' },
      { path: 'project', select: 'name' }
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Timer to\'xtatildi',
      data: timeLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Timerni to\'xtatishda xatolik',
      error: error.message
    });
  }
};