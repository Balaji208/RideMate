import React from 'react'
import { MapPin } from 'lucide-react';
import 'remixicon/fonts/remixicon.css'

const LocationSearchPanel = () => {
  return (
    <div>
        <div className="flex gap-4 items-center justify-start my-4">
            <h2 className='bg-[#eee] p-2 h-8 flex items-center justify-center w-10 rounded-full'><i class="ri-map-pin-fill"></i></h2>
            <h4 className='inter-font text-[20px] font-medium'>24B,Gandigramam , Karur , TamilNadu ,India</h4>
        </div>

        <div className="flex gap-4 items-center justify-start my-2">
            <h2 className='bg-[#eee] p-2 h-8 flex items-center justify-center w-10 rounded-full'><i class="ri-map-pin-fill"></i> </h2>
            <h4 className='inter-font text-[20px] font-medium'>24B,Gandigramam , Karur , TamilNadu ,India</h4>
        </div>

        <div className="flex gap-4 items-center justify-start my-2">
            <h2 className='bg-[#eee] p-2 h-8 flex items-center justify-center w-10 rounded-full'><i class="ri-map-pin-fill"></i> </h2>
            <h4 className='inter-font text-[20px] font-medium'>24B,Gandigramam , Karur , TamilNadu ,India</h4>
        </div>

        
        
    </div>
  )
}

export default LocationSearchPanel