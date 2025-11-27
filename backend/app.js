const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const morgan = require("morgan")
const errorHandler = require("./src/middlewares/errorHandler")


const activityRoutes = require("./src/routes/activity")
const authRoutes = require("./src/routes/auth")
const departmentRoutes = require("./src/routes/department")
const documentRoutes = require("./src/routes/document")
const notificationRoutes = require("./src/routes/notification")
const projectRoutes = require("./src/routes/project")
const reportRoutes = require("./src/routes/report")
const taskRoutes = require("./src/routes/task")
const teamRoutes = require("./src/routes/team")
const timeRoutes = require("./src/routes/time")
const userRoutes = require("./src/routes/user")
const auditLogRoutes = require("./src/routes/auditLog")
const commentRoutes = require("./src/routes/comment")
const app = express();

app.use(helmet())
app.use(cors({
  origin:"http://localhost:5173",
  credentials:true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:100,
  message:"Juda ko'p so'rov yuborildi,keyinroq urinib ko'ring"
})
app.use("/",limiter)

app.use(express.json());
app.use(express.urlencoded({extended:true,limit:"10mb"}))
app.use(cookieParser());

if(process.env.NODE_ENV === "development"){
  app.use(morgan("dev"))
}else{
  app.use(morgan("combined"))
}

app.get("/health", (req,res) => {
  res.status(200).json({
    success:true,
    message:"Server ishlamoqda",
    timestamp:new Date().toISOString()
  })
})

app.use("/activity", activityRoutes)
app.use("/auth", authRoutes);
app.use("/department", departmentRoutes)
app.use("/documents", documentRoutes)
app.use("/notifications", notificationRoutes)
app.use("/projects", projectRoutes)
app.use("/report", reportRoutes)
app.use("/tasks", taskRoutes)
app.use("/teams", teamRoutes)
app.use("/time", timeRoutes) 
app.use("/users", userRoutes)
app.use("/audit-logs", auditLogRoutes)
app.use("/comments", commentRoutes)

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route topilmadi'
  });
});

app.use(errorHandler)

module.exports = app;
