import React, { useEffect } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  MarkerProps,
  InfoWindow,
} from "@react-google-maps/api";
import { Wrapper } from "@googlemaps/react-wrapper"
import {MarkerClusterer, SuperClusterAlgorithm} from "@googlemaps/markerclusterer";
import { GoogleMapProvider } from "@ubilabs/google-maps-react-hooks";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";

import { formatRelative } from "date-fns";
import "@reach/combobox/styles.css";
import style from "./mapStyles";

console.log(process.env.ff)
let key = "g9rXxUWo1cZgDbh8dULtJx8tChvw6RctLcL2gEUO"
let stations = []

async function exampleFetch() {
  const response = await fetch(`https://developer.nrel.gov/api/alt-fuel-stations/v1.json?limit=200&country=CA&api_key=${key}`);
  const json = await response.json();
  stations = await json.fuel_stations
  console.log(stations);
}
// exampleFetch()
const libraries = ["places"]
const mapContainerStyle = {
  width: "100vw",
  height: "100vh"
}
const center = {
  lat: 43.653225,
  lng: -79.383186,
}
const options = {
  mapId: "e098d5ebe958ec47",
  styles: style,
  disableDefaultUI : true,
  zoomControl: true,
  heading: 5,
  // tilt: 20,
}

function App() {
  const {isLoaded, loadError} = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });
  const [markers, setMarkers] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [evLocations, setEvLocations] = React.useState([]);
  // const [tilt, setTilt] = React.useState(5);

  useEffect(() => {
    exampleFetch()
    setEvLocations(stations)
  },[])
  
  const onMapClick = React.useCallback((event)=> {
            setMarkers((current) => [...current, {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
              time: new Date()
            }]);
        }, [])
  
  const mapRef = React.useRef();

  const onMapLoad = React.useCallback((map)=> {
    mapRef.current = map;
    console.log(evLocations)
    addMarkers(mapRef.current, stations)
  },[])

  const panTo = React.useCallback(({lat, lng}) => {
    mapRef.current.panTo({lat, lng});
    mapRef.current.setZoom(12)
  },[])

  if(loadError) return "Error loading maps";
  if(!isLoaded) return "Loading Maps";

  return (
    <div>
      <h3>
        EV ChargePoints<span role="img" aria-label="battery">🔋</span>
      </h3>

      <Locate panTo={panTo}/>
      <Search panTo={panTo}/>
      <GoogleMap 
        // id="e098d5ebe958ec47"
        mapContainerStyle={mapContainerStyle}
        zoom={8} 
        center={center} 
        options={options}
        //pinpoint bear
        onClick={onMapClick}
        onLoad = {onMapLoad} 
        tilt={5}
      >

        {markers.map(marker => (
            <Marker 
              key={`${marker.lat}-${marker.lng}`} 
              position={{ lat: marker.lat, lng: marker.lng }}
              icon={{
                url: "/charging-station1.svg",
                scaledSize: new window.google.maps.Size(25,25),
                origin: new window.google.maps.Point(0,0),
                anchor: new window.google.maps.Point(10,10),
                }} 
              onClick={()=> {
                setSelected(marker);
                mapRef.current.setTilt(300)
                mapRef.current.setZoom(28)
                mapRef.current.heading(20)
              }}  
            />
        ))}

         {selected ? (<InfoWindow position={{lat:selected.lat, lng:selected.lng}} onCloseClick={()=> {
            setSelected(null)
         }}>
            <div>
              <h2>EV Station</h2>
              <p>Check in time {formatRelative(selected.time, new Date())}</p>
            </div>
         </InfoWindow>) : null} 
       </GoogleMap>
    </div>
  );
}

export default App;

function addMarkers(map,evLocations){
  const stationInfoWindow = new window.google.maps.InfoWindow();

  const markers = evLocations.map((loc)=>{
    const marker = new window.google.maps.Marker({
      position: {lat:loc.latitude, lng:loc.longitude},
      icon: {url:"/evStation.png", scaledSize:new window.google.maps.Size(40, 40)}
      
    })
    marker.addListener("click", ()=>{
      stationInfoWindow.setContent(`
        <div class="stationInfoWindow">
          <h2>${loc.station_name}</h2>
        </div>
      `)
      map.setTilt(250)
      map.setZoom(14)
      stationInfoWindow.open({
        map,
        anchor: marker
      });
    })
    return marker
  })
  new MarkerClusterer({
    markers,
    map,
    algorithm: new SuperClusterAlgorithm({ radius: 350 })
  })
}

function Locate({panTo}) {
    return <button className="locate" onClick={() => {
      navigator.geolocation.getCurrentPosition((position)=> {
        console.log(position);
        panTo({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      ()=> null)
    }}>
        <img src="/target.svg" alt="locate me" className="target">
        </img>
    </button>
}

function Search({panTo}) {
  const {ready, value, suggestions: {status, data}, setValue, clearSuggestions} = usePlacesAutocomplete({
    requestOptions: {
      location: {
          lat: ()=>43.653225,
          lng: ()=>-79.383186,
      },
      radius: 100 * 1000,
    }
  });

  return (
    <div className="search">
      <Combobox 
          onSelect={async (address) => {
            setValue(address, false);
            clearSuggestions();
            
            try{
              const results = await getGeocode({address})
              const {lat, lng} = await getLatLng(results[0])
              console.log(lat, lng)
              panTo({lat, lng})
            }catch(err) {
              console.log("there's an error!")
            }
             console.log(address)
          }}>
        <ComboboxInput 
            value={value} 
            onChange={(e) => {
              setValue(e.target.value);
            }}
            disabled={!ready}
            placeholder="Enter Your Addr" 
        />     
        <ComboboxPopover>
          <ComboboxList>
            {status === "OK" && data.map(({id, description})=> (
                <ComboboxOption key={id} value={description} />
            ))}
          </ComboboxList>
        </ComboboxPopover> 
      </Combobox>
    </div>  
  ) 
}