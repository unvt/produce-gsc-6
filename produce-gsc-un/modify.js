//modify for un large (ZL6-
const geojsonArea = require('@mapbox/geojson-area')

const preProcess = (f) => {
  f.tippecanoe = {
    layer: 'other',
    minzoom: 15,
    maxzoom: 15
  }
  // name
  if (
    f.properties.hasOwnProperty('en_name') ||
    f.properties.hasOwnProperty('int_name') ||
    f.properties.hasOwnProperty('name') ||
    f.properties.hasOwnProperty('ar_name')
  ) {
    let name = ''
    if (f.properties['en_name']) {
      name = f.properties['en_name']
    } else if (f.properties['int_name']) {
      name = f.properties['int_name']
    } else if (f.properties['name']) {
      name = f.properties['name']
    } else {
      name = f.properties['ar_name']
    }
    delete f.properties['en_name']
    delete f.properties['ar_name']
    delete f.properties['int_name']
    delete f.properties['name']
    f.properties.name = name
  }
  return f
}

const postProcess = (f) => {
if(f!==null){
  delete f.properties['_database']
  delete f.properties['_table']
}
  return f
}


const flap = (f, defaultZ) => {
  switch (f.geometry.type) {
    case 'MultiPolygon':
    case 'Polygon':
      let mz = Math.floor(
        19 - Math.log2(geojsonArea.geometry(f.geometry)) / 2
      )
      if (mz > 15) { mz = 15 }
      if (mz < 6) { mz = 6 }
      return mz
    default:
      return defaultZ ? defaultZ : 10
  }
}

const lut = {
 // Base
  custom_planet_land_08_a: f => {
    f.tippecanoe = {
      layer: 'landmass',
      minzoom: 6,
      maxzoom: 7
    }
    delete f.properties['objectid']
    delete f.properties['fid_1']
    return f
  },
  custom_ne_10m_bathymetry_a: f => {
    f.tippecanoe = {
      layer: 'bathymetry',
      minzoom: 2,
      maxzoom: 5
    }
    delete f.properties['objectid']
    delete f.properties['fid_1']
    return f
  },
  custom_planet_land_main_a: f => {
    f.tippecanoe = {
      layer: 'landmass',
      minzoom: 8,
      maxzoom: 15
    } 
    return f
  },
  custom_planet_land_antarctica_a: f => {
    f.tippecanoe = {
      layer: 'landmass',
      minzoom: 8,
      maxzoom: 13
    } 
    return f
  },
  custom_planet_coastline_l: f => {
    f.tippecanoe = {
      layer: 'cstl',
      minzoom: 10,
      maxzoom: 15
    } 
    delete f.properties['objectid']
    return f
  },
 // Admin
  unmap_bndl_l: f => {
    f.tippecanoe = {
      layer: 'bndl',
      maxzoom: 15
    }
    f.properties._source = 'hq'
    delete f.properties['objectid']
//    delete f.properties['bdytyp_code']
  if (f.properties.bdytyp === '7') {
    f.tippecanoe.minzoom = 7
//  } else if (f.properties.bdytyp === 'Administrative boundary 3') {
//    f.tippecanoe.minzoom = 9
  } else {
    f.tippecanoe.minzoom = 6
  }
  if (f.properties.iso3cd == 'COL' || f.properties.iso3cd == 'COL_ECU' || f.properties.iso3cd == 'COL_PER' || f.properties.iso3cd == 'COL_VEN' || f.properties.iso3cd == 'BRA_COL' || f.properties.iso3cd == 'COL_PAN') {
    return null
  } else {
    delete f.properties['iso3cd'] //added on September 16
    return f
  }
  },
  custom_unmap_bndl_l: f => {
    f.tippecanoe = {
      layer: 'bndl',
      maxzoom: 15
    }
    f.properties._source = 'c'
    delete f.properties['objectid']
  if (f.properties.type == '3') {
    f.tippecanoe.minzoom = 6
    f.properties.bdytyp = '6'
  } else if (f.properties.type == '4') {
    f.tippecanoe.minzoom = 7
    f.properties.bdytyp = '7'
  } else {
    f.tippecanoe.minzoom = 6
    f.properties.bdytyp = f.properties.type
  }
    delete f.properties['type'] //added on September 16
    return f
  },
  un_unmik_bndl_l: f => {
    f.tippecanoe = {
      layer: 'bndl',
       maxzoom: 15
    }
    f.properties._source = 'mik'
    delete f.properties['objectid']
  if (f.properties.type == '2') {
    f.tippecanoe.minzoom = 7
    f.properties.bdytyp = '7'
  } else if (f.properties.type === '3') {
    f.tippecanoe.minzoom = 9
    f.properties.bdytyp = '10' //tentatively
  } else {
    f.tippecanoe.minzoom = 7
    f.properties.bdytyp = '99' //other
  }
    delete f.properties['type']
    return f
  },
  un_unvmc_igac_bndl_l: f => {
    f.tippecanoe = {
      layer: 'bndl',
      maxzoom: 15
    }
    f.properties._source = 'vmc'
    delete f.properties['objectid']
  if (f.properties.level == '7') {
    f.tippecanoe.minzoom = 7
    f.properties.bdytyp = '7'
  } else if (f.properties.level == '10') {
    f.tippecanoe.minzoom = 9
    f.properties.bdytyp = '10'
  } else {
    f.tippecanoe.minzoom = 6
    f.properties.bdytyp = f.properties.level
  }
    delete f.properties['level']
    return f
  },

 //Hydro
  custom_ne_rivers_lakecentrelines_l: f => {
    f.tippecanoe = {
      layer: 'un_water',
      minzoom: 6,
      maxzoom: 7
    }
    delete f.properties['objectid']
    delete f.properties['strokeweig']
    delete f.properties['featurecla']
    delete f.properties['dissolve']
    delete f.properties['note']
    return f
  },

 //Land Use
  un_glc30_global_lc_ms_a: f => {
    f.tippecanoe = {
      layer: 'landcover',
      minzoom: 6,
      maxzoom: 9
    }
  if (f.properties.gridcode == 80) {
    f.tippecanoe.minzoom = 9
  }
  if (f.properties.gridcode == 20 || f.properties.gridcode == 30 || f.properties.gridcode == 80) {
    delete f.properties['id']
    delete f.properties['objectid']
    return f
  } else {
    return null 
  }
  },
  un_mission_lc_ls_a: f => {
    f.tippecanoe = {
      layer: 'landcover',
      minzoom: 10,
      maxzoom: 15
    }
  if (f.properties.gridcode == 20 || f.properties.gridcode == 30 || f.properties.gridcode == 80) {
    delete f.properties['objectid']
    delete f.properties['landcover']
    return f
  } else {
    return null  
  }
  },
 //Places
  un_global_places_p: f => {
    f.tippecanoe = {
      layer: 'un_place',
      minzoom: 6,
      maxzoom: 15
    }
  if (f.properties.type === 'Town' || f.properties.type === 'Village') {
    f.tippecanoe.minzoom = 7
  } else if (f.properties.type === 'Suburb' || f.properties.type === 'Other Populated Places') {
    f.tippecanoe.minzoom = 11
  } else {
    f.tippecanoe.minzoom = 6 
  }
    delete f.properties['objectid']
    return f
  },
  unmap_popp_p: f => {
    f.tippecanoe = {
      layer: 'un_popp',
      maxzoom: 15
    }

  if (f.properties.cartolb === 'Alofi' ||f.properties.cartolb === 'Avarua' ||f.properties.cartolb === 'Sri Jayewardenepura Kotte' ) {
    return null
  } else if (f.properties.poptyp == 1 || f.properties.poptyp == 2) {
    f.tippecanoe.minzoom = 6 
   return f
  } else if (f.properties.poptyp == 3 && f.properties.scl_id == 10) {
    f.tippecanoe.minzoom = 6
   return f
  } else {
    return null
  } 
  },

//labels
  unmap_phyp_label_06_p: f => {
    f.tippecanoe = {
      layer: 'lab_water',
      minzoom: 6,
      maxzoom: 10
    }
    return f
  },
  unmap_phyp_p: f => {
    f.tippecanoe = {
      layer: 'phyp_label',
      minzoom: 6,
      maxzoom: 15
    }
//edit 2021-01-27 starts
f.properties.display = 0
if (f.properties.type == 4 && !/Sea|Ocean|Gulf/.test(f.properties.name) ){
f.properties.display = 1
}
//edit 2021-01-27 ends
    return f
  },

 unmap_bnda_a1_ap: f => {
    f.tippecanoe = {
      layer: 'bnd_lab1',
      minzoom: 6,
      maxzoom: 8
    }
    f.properties._source = 'hq'
    delete f.properties['objectid']
    delete f.properties['romnam']
    delete f.properties['maplab']
    return f
  },
  unmap_bnda_a2_ap: f => {
    f.tippecanoe = {
      layer: 'bnd_lab2',
      minzoom: 9,
      maxzoom: 15
    }
    f.properties._source = 'hq'
    delete f.properties['objectid']
    delete f.properties['romnam']
    delete f.properties['adm1nm']
    delete f.properties['adm1cd']
    return f
  },
  custom_unmap_bnda_a1_ap: f => {
    f.tippecanoe = {
      layer: 'bnd_lab1',
      minzoom: 6,
      maxzoom: 8
    }
    f.properties._source = 'c'
    f.properties.adm1nm = f.properties.adm1_name
    delete f.properties['objectid']
    delete f.properties['adm1_name']
    delete f.properties['romnam']
    return f
  },
  custom_unmap_bnda_a2_ap: f => {
    f.tippecanoe = {
      layer: 'bnd_lab2',
      minzoom: 9,
      maxzoom: 15
    }
    f.properties._source = 'c'
    f.properties.adm2nm = f.properties.adm2_name
    delete f.properties['objectid']
    delete f.properties['name']
    delete f.properties['adm1_name']
    delete f.properties['adm2_name']
    return f
  },
  un_unmik_bnda_a2_ap: f => {
    f.tippecanoe = {
      layer: 'mik_bnd_lab2',
      minzoom: 6,
      maxzoom: 8
    }
    return f
  },
  un_unmik_bnda_a3_ap: f => {
    f.tippecanoe = {
      layer: 'mik_bnd_lab3',
      minzoom: 8,
      maxzoom: 15
    }
    return f
  },
  un_unvmc_igac_bnda_a1_departments_ap: f => {
    f.tippecanoe = {
      layer: 'vmc_bnd_lab1',
      minzoom: 7,
      maxzoom: 8
    }
    return f
  },
  un_unvmc_igac_bnda_a2_municipalities_ap: f => {
    f.tippecanoe = {
      layer: 'vmc_bnd_lab2',
      minzoom: 9,
      maxzoom: 10
    }
    return f
  },
  un_unvmc_igac_bnda_a3_rural_units_ap: f => {
    f.tippecanoe = {
      layer: 'vmc_bnd_lab3',
      minzoom: 11,
      maxzoom: 15
    }
    return f
  },
  unmap_bnda05_cty_a: f => {
    f.tippecanoe = {
      layer: 'bnda_cty',
      minzoom: 6,
      maxzoom: 7
    }
    return f
  },
  unmap_bnda_label_06_p: f => {
    f.tippecanoe = {
      layer: 'lab_cty',
      minzoom: 6,
      maxzoom: 11
    }
    return f
  },
  // 9. POIs
  un_minusca_pois_p: f => {
    f.tippecanoe = {
      layer: 'poi_minusca',
      maxzoom: 15
    }
    switch (f.properties.feat_class) {
      //Large airport
      case 'Airport':
         f.tippecanoe.minzoom = 7
        break
      //public
      case 'NGO':
      case 'Police':
      case 'Embassy':
      case 'Consulate':
      case 'Local Authority':
      case 'International Organisation':
      case 'Public Place':
      case 'National Institution':
      case 'Regional Organisation':
      case 'Library':
      case 'Youth Centre':
      case 'Social Centre':
      case 'Military Camp':
         f.tippecanoe.minzoom = 11
        break
      //transport1
      case 'Boat Ramp':
         f.tippecanoe.minzoom = 12
        break
      //service1
      case 'Hospital':
      case 'Health Centre':
      case 'University & College':
      case 'Kindergarten':
      case 'Primary School':
      case 'Secondary School':
      case 'Hotel':
         f.tippecanoe.minzoom = 13
        break
      //worship
      case 'Church':
      case 'Mosque':
         f.tippecanoe.minzoom = 13
        break
      //traffic
      case 'Fuel Station':
         f.tippecanoe.minzoom = 14
        break
/*
      //service2
      case 'Club':
      case 'Restaurant':
         f.tippecanoe.minzoom = 15
        break
      //heritage
      case 'Cemetery':
      case 'Landmark':
         f.tippecanoe.minzoom = 15
        break
      //other
      case 'Market':
      case 'Super Market':	
      case 'Bank':
      case 'RadioTower':
      case 'Telecommunication':
      case 'Stadium':
      case 'Zoo':
         f.tippecanoe.minzoom = 15
        break
*/
     default:
        f.tippecanoe.minzoom = 15
    }
    return f
  },
  un_global_pois_p: f => {
    f.tippecanoe = {
      layer: 'un_poi',
      maxzoom: 15
    }
    switch (f.properties.type) {
      //Large airport
      case 'Airport':
         f.tippecanoe.minzoom = 7
        break
      //transport1(big)
      case 'Airfield':
      case 'Helipad':
         f.tippecanoe.minzoom = 10
        break
      //public
      case 'NGO':
      case 'UN':
      case 'Post Office':
      case 'Fire Station':
      case 'Prison':
      case 'Police Station':
      case 'Courthouse':
      case 'Embassy':
      case 'Town Hall':
      case 'Other Public Building':
      case 'Military':
         f.tippecanoe.minzoom = 11
        break
      //transport1(small)
      case 'Taxi Station':
      case 'Ferry Terminal':
      case 'Port':
      case 'Bus Station':
      case 'Railway Station':
         f.tippecanoe.minzoom = 12
        break
      //service1
      case 'Hospital':
      case 'University':
      case 'College':
      case 'School':
      case 'Hotel':
         f.tippecanoe.minzoom = 13
        break
      //worship
      case 'Christian':
      case 'Muslim':
         f.tippecanoe.minzoom = 13
        break
      //traffic
      case 'Fuel':
         f.tippecanoe.minzoom = 14
        break
     default:
        f.tippecanoe.minzoom = 15
    }
    return f
  }
}
module.exports = (f) => {
  return postProcess(lut[f.properties._table](preProcess(f)))
}

