import Station from "../models/station.model.js";


const stationNames = [
  "Beliaththa",
  "Wewurukannala",
  "Bambaranda",
  "Kakanadura",
  "Weherahena",
  "Matara",
  "Walgama",
  "Kamburugamuwa",
  "Mirissa",
  "Polwathumodara",
  "Weligama",
  "Kumbalgama",
  "Midigama",
  "Ahangama",
  "Kathaluwa",
  "Koggala",
  "Habaraduwa",
  "Thalpe",
  "Unawatuna",
  "Katugoda",
  "Galle",
  "Hikkaduwa",
  "Ambalangoda",
  "Ahungalle",
  "Bentota",
  "Aluthgama",
  "Kalutara South",
  "Panadura",
  "Moratuwa",
  "Mount Lavinia",
  "Colombo Fort",
  "Maradana",
  "Anuradhapura",
  "Polgahawela",
  "Alawwa",
  "Meerigama",
  "Veyangoda",
  "Gampaha",
  "Ragama",
  "Kurunegala",
  "Maho",
  "Galgamuwa",
  "Thambuttegama",
  "Vavuniya",
  "Mankulam",
  "Kilinochchi",
  "Pallai",
  "Kodikamam",
  "Chavakachcheri",
  "Jaffna",
  "Kokuvil",
  "Kondavil",
  "Chunnakam",
  "Mallakam",
  "Tellippallai",
  "Kankesanthurai",
  "Dehiwala",
  "Ratmalana",
  "Wadduwa",
  "Kalutara North",
  "Piladuwa",
  "Ariviya Nagar",
  "Medawachchi",
  "Navatkuli",
  "Kosgoda",
  "Kumbalgama",
  "Katugoda",
  "Ahungalla",
  "Polwathumodara"
];


const populateStations = async () => {
  try {
    const existingStations = await Station.find({});
    if (existingStations.length > 0) {
      console.log("Stations already populated");
      return;
    }

    const stations = stationNames.map((name) => ({
        name,
        }));

    await Station.insertMany(stations);

    console.log("Stations successfully populated");
  } catch (error) {
    console.error("Error populating stations:", error);
  } 
};

export default populateStations;
