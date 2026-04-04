import mongoose from "mongoose"
import dotenv from "dotenv"
import Worker from "./models/Worker.js"

dotenv.config()

const workers = [
  // Swiggy — SWG1001–SWG1010
  { workerId: "SWG1001", name: "Arjun Murugan",      city: "Chennai",          platform: "Swiggy", workingHours: 8 },
  { workerId: "SWG1002", name: "Karthik Selvam",     city: "Coimbatore",       platform: "Swiggy", workingHours: 6 },
  { workerId: "SWG1003", name: "Dinesh Rajan",       city: "Madurai",          platform: "Swiggy", workingHours: 10 },
  { workerId: "SWG1004", name: "Praveen Kumar",      city: "Salem",            platform: "Swiggy", workingHours: 8 },
  { workerId: "SWG1005", name: "Suresh Babu",        city: "Tiruchirappalli",  platform: "Swiggy", workingHours: 6 },
  { workerId: "SWG1006", name: "Manoj Krishnan",     city: "Vellore",          platform: "Swiggy", workingHours: 12 },
  { workerId: "SWG1007", name: "Vijay Anand",        city: "Erode",            platform: "Swiggy", workingHours: 8 },
  { workerId: "SWG1008", name: "Ramesh Pandian",     city: "Thanjavur",        platform: "Swiggy", workingHours: 6 },
  { workerId: "SWG1009", name: "Senthil Nathan",     city: "Tirunelveli",      platform: "Swiggy", workingHours: 10 },
  { workerId: "SWG1010", name: "Balamurugan Raja",   city: "Kanchipuram",      platform: "Swiggy", workingHours: 8 },

  // Zomato — ZMT2001–ZMT2010
  { workerId: "ZMT2001", name: "Arun Prakash",       city: "Chennai",          platform: "Zomato", workingHours: 8 },
  { workerId: "ZMT2002", name: "Ganesh Subramani",   city: "Coimbatore",       platform: "Zomato", workingHours: 10 },
  { workerId: "ZMT2003", name: "Muthu Vel",          city: "Madurai",          platform: "Zomato", workingHours: 6 },
  { workerId: "ZMT2004", name: "Saravanan Pillai",   city: "Tiruchirappalli",  platform: "Zomato", workingHours: 8 },
  { workerId: "ZMT2005", name: "Ravi Shankar",       city: "Salem",            platform: "Zomato", workingHours: 12 },
  { workerId: "ZMT2006", name: "Palani Swamy",       city: "Dindigul",         platform: "Zomato", workingHours: 8 },
  { workerId: "ZMT2007", name: "Kumaran Doss",       city: "Vellore",          platform: "Zomato", workingHours: 6 },
  { workerId: "ZMT2008", name: "Anbu Selvan",        city: "Nagercoil",        platform: "Zomato", workingHours: 10 },
  { workerId: "ZMT2009", name: "Thirumaran Raj",     city: "Erode",            platform: "Zomato", workingHours: 8 },
  { workerId: "ZMT2010", name: "Elumalai Perumal",   city: "Thanjavur",        platform: "Zomato", workingHours: 6 },

  // Blinkit — BLK3001–BLK3010
  { workerId: "BLK3001", name: "Surya Prakash",      city: "Chennai",          platform: "Blinkit", workingHours: 8 },
  { workerId: "BLK3002", name: "Naveen Kumar",       city: "Coimbatore",       platform: "Blinkit", workingHours: 6 },
  { workerId: "BLK3003", name: "Harish Babu",        city: "Madurai",          platform: "Blinkit", workingHours: 10 },
  { workerId: "BLK3004", name: "Deepak Raj",         city: "Salem",            platform: "Blinkit", workingHours: 8 },
  { workerId: "BLK3005", name: "Vignesh Mohan",      city: "Tiruchirappalli",  platform: "Blinkit", workingHours: 12 },
  { workerId: "BLK3006", name: "Ashwin Sundar",      city: "Kanchipuram",      platform: "Blinkit", workingHours: 6 },
  { workerId: "BLK3007", name: "Pradeep Nair",       city: "Tirunelveli",      platform: "Blinkit", workingHours: 8 },
  { workerId: "BLK3008", name: "Lokesh Kannan",      city: "Dindigul",         platform: "Blinkit", workingHours: 10 },
  { workerId: "BLK3009", name: "Sathish Vel",        city: "Nagercoil",        platform: "Blinkit", workingHours: 8 },
  { workerId: "BLK3010", name: "Murugesan Pillai",   city: "Vellore",          platform: "Blinkit", workingHours: 6 },
]

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log("MongoDB connected")

  await Worker.deleteMany({})
  console.log("Cleared existing workers")

  await Worker.insertMany(workers)
  console.log("✅ 30 workers seeded successfully")

  await mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
