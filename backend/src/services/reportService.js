const TimeLog = require("../models/Timelog")
exports.productivityReport = async ({from,to,user}) => {
     // simple aggregation: total minutes per user in period
    const match = {startTime: {$gte: new Date(from)},endTime: {$lte: new Date(to)}}
    if(user){
        match.user = user
    }
    const agg = await TimeLog.aggregate([
        {$match:match},
        {$group:{_id:'$user',totalMinutes:{$sum:'$duration'}}}
    ])
    return agg;
}