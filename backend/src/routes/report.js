const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
// const {getProductivityReport,getTimeSheetReport} = require("../controllers/reportController")

router.use(protect)

// router.get("/productivity", getProductivityReport)
// router.get("/timesheet", getTimeSheetReport)

module.exports = router