// // get the details of the schedule that the user has selected
// export const getScheduleDetails = async (req, res, next) => {
//   const { scheduleId, trainId, fromHalt, toHalt } = req.body;

//   const trainDetails = await Train.findById(trainId).populate({
//     path: "wagons",
//     select: "wagonClassRef",
//     populate: {
//       path: "wagonClassRef",
//       select: "name",
//     },
//   });
//   let firstClassCount = 0;
//   let secondClassCount = 0;
//   let thirdClassCount = 0;
//   for (let wagon of trainDetails.wagons) {
//     if (wagon.wagonClassRef.name === "first") {
//       firstClassCount++;
//     } else if (wagon.wagonClassRef.name === "second") {
//       secondClassCount++;
//     } else {
//       thirdClassCount++;
//     }
//   }
//   const classesAndMultipliers = await WagonClass.find();
//   return res.status(200).json({
//     scheduleId,
//     train: {
//       id: trainDetails._id,
//       name: trainDetails.name,
//       firstClassCount,
//       secondClassCount,
//       thirdClassCount,
//     },
//     fromHalt,
//     toHalt,
//     classesAndMultipliers,
//   });
//   // return res.status(200).json(trainDetails);
// };







