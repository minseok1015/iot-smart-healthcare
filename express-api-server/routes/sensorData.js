import express from "express";
const sensorRouter = express.Router();

sensorRouter.post("/", (req, res) => {
  const { temperature, humidity, co2 } = req.body;
  console.log("data:", temperature, humidity, co2);

  res.status(200).json({ message: "accepted" });
});

export default sensorRouter;
