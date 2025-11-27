const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {startTimer,stopTimer} = require("../controllers/timeController")

router.use(protect)

router.post("/start", startTimer)
router.post("/stop", stopTimer)

module.exports = router