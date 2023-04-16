
import fetch from 'node-fetch';
import * as fs from 'fs';
let stations;
async function stationsFetch(setLocations) {
  try{
      const response = await fetch(`https://developer.nrel.gov/api/alt-fuel-stations/v1.json?limit=all&country=CA&fuel_type=ELEC&api_key=g9rXxUWo1cZgDbh8dULtJx8tChvw6RctLcL2gEUO`);
        const json = await response.json();
        stations = await json.fuel_stations
        fs.writeFile('allStations.json', JSON.stringify(stations), (err) => {
  if (err) throw err;
  console.log('The file has been saved!')})
        console.log(stations);
        console.log(typeof(stations))
  }catch(err){
    console.log(err)
  }
}
// stationsFetch()
// fs.readFile("allStations.json",'utf8', (err,data)=>{
//     if(err) throw err;
//     console.log(JSON.parse(data)[0]);

// })
fetch("/allStations.json")
    .then(res=>res.json())
    .then(json=>console.log(json))
export default stations;