exports.calculateDuration = (start,end) => {
    if(!start || !end){
        return null
    }
    const startDate = new Date(start)
    const endDate = new Date(end)

    const diffMS = endDate - startDate
    if(diffMS < 0){
        return 0
    }

    const diffDays = Math.ceil(diffMS / (1000 * 60 *60 *24))
    return diffDays
}