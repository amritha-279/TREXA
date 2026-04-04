import cron from "node-cron"
import axios from "axios"
import Worker from "../models/Worker.js"
import Claim from "../models/Claim.js"

export const startRiskScheduler = () => {

  cron.schedule("*/10 * * * *", async () => {

    console.log("Running automatic risk update...")

    try {

      const workers = await Worker.find()

      for(const worker of workers){

        const city = worker.zone

        // WEATHER
        const weatherRes = await axios.get(
          `http://localhost:4000/api/weather/weather?city=${city}`
        )

        const rain = weatherRes.data.rain

        const aqi = 3
        const traffic = 5
        const deliveries = 10

        // ML RISK PREDICTION
        const mlResponse = await axios.post(
          "http://localhost:5000/predict",
          { rain, aqi, traffic, deliveries }
        )

        const risk = mlResponse.data.disruption_risk

        worker.riskScore = risk

        await worker.save()

        // AUTO CLAIM TRIGGER
        if(risk === 1){

          const estimatedIncomeLoss = worker.workingHours * 100
          const payoutAmount = estimatedIncomeLoss * 0.8

          const claim = new Claim({
            workerId: worker._id,
            disruptionType: "weather_disruption",
            estimatedIncomeLoss,
            payoutAmount
          })

          await claim.save()

          console.log(`Auto claim created for ${worker.name}`)

        }

      }

      console.log("Risk scores updated")

    } catch (error) {

      console.error("Risk scheduler failed", error)

    }

  })

}