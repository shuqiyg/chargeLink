// import logo from './logo.svg';
// import './App.css';
import React from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
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
  styles: style,
  disableDefaultUI : true,
  zoomControl: true,
}


function App() {
  const {isLoaded, loadError} = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });
  const [markers, setMarkers] = React.useState([]);
  const [selected, setSelected] = React.useState(null);

  const onMapClick = React.useCallback((event)=> {
            setMarkers(current => [...current, {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
              time: new Date()
            }])
        }, [])
  
  const mapRef = React.useRef();

  const onMapLoad = React.useCallback((map)=> {
    mapRef.current = map;
  },[])

  const pinTo = React.useCallback(({lat, lng}) => {
    mapRef.current.pinTo({lat, lng});
    mapRef.current.setZoom(14)
  }, [])

  if(loadError) return "Error loading maps";
  if(!isLoaded) return "Loading Maps";

  return (
    <div className="App">
      <h1>
        EV ChargePoints<span role="img" aria-label="battery">🔋</span>
      </h1>

      <Search pinTo={pinTo}/>

      <Locate pinTo={pinTo}/>

      <GoogleMap mapContainerStyle={mapContainerStyle}
        zoom={8} 
        center={center} 
        options={options}
        onClick={onMapClick}
        onLoad = {onMapLoad}  
      >

        {markers.map(marker => (
        <Marker 
          key={marker.time.toISOString()} position={{ lat: marker.lat, lng: marker.lng }}
          icon={{
            url: "/charging-station.svg",
            scaledSize: new window.google.maps.Size(20,20),
            origin: new window.google.maps.Point(0,0),
            anchor: new window.google.maps.Point(15,15),
            }} 
          onClick={()=> {
            setSelected(marker);
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

function Locate({pinTo}) {
    return <button className="locate" onClick={() => {
      navigator.geolocation.getCurrentPosition((position)=> {
        console.log(position);
        pinTo({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      ()=> null, options)
    }}>
        <img src="" alt="locate me">
        </img>
    </button>
}

function Search({pinTo}) {
  const {ready, value, suggestions: {status, data}, setValue, clearSuggestions} = usePlacesAutocomplete({
    requestOptions: {
      location: {
          lat: ()=>43.653225,
          lng: ()=>-79.383186,
      },
      radius: 200 * 1000,
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
              pinTo({lat, lng})
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