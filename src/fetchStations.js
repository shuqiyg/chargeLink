//fetch ev station locations 
// let stationsData;
async function getData(setEvLocations) {
    await fetch(`https://developer.nrel.gov/api/alt-fuel-stations/v1.json?limit=200&country=CA&api_key=${process.env.NREL_API_KEY}`)
            .then(response => response.json())
            .then(data => {
                // Handle the data
                return data.fuel_stations
            }).then(data => {
                setEvLocations(data)
                // stationsData = data;
            })
            .catch(error => {
                // Handle any errors
                console.error(error);
            }); 
}

export default getData