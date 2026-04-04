import axios from "axios"

// WEATHER DATA
export const getWeather = async (req, res) => {

  try {

    const { city } = req.query

    const apiKey = process.env.WEATHER_API_KEY

    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    )

    const weather = weatherResponse.data

    const rain = weather.rain ? weather.rain["1h"] || 0 : 0

    const temperature = weather.main.temp

    res.json({
      city,
      rain,
      temperature
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message:"Weather fetch failed"
    })

  }

}


// AIR QUALITY DATA
export const getAirQuality = async (req,res)=>{

  try{

    const { lat, lon } = req.query

    const apiKey = process.env.WEATHER_API_KEY

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
    )

    const aqi = response.data.list[0].main.aqi

    res.json({
      lat,
      lon,
      aqi
    })

  }catch(error){

    console.error(error)

    res.status(500).json({
      message:"AQI fetch failed"
    })

  }

}