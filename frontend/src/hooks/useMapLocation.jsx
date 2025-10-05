import { useContext } from 'react';
import LocationContext from '../contexts/LocationProvider';


function useMapLocation() {
  return useContext(LocationContext);
}

export default useMapLocation;