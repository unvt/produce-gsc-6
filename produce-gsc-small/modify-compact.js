//modify for new small conversion 0423
const geojsonArea = require('@mapbox/geojson-area')

const preProcess = (f) => {
  f.tippecanoe = {
    layer: 'other',
    minzoom: 5,
    maxzoom: 5
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
//osm
  roads_major_0408_l: f => {
    f.tippecanoe = {
      layer: 'road-s',
      minzoom: 4,
      maxzoom: 5
    }
    return f
  },
 // un1 Base
  custom_planet_land_08_a: f => {
    f.tippecanoe = {
      layer: 'landmass',
      minzoom: 0,
      maxzoom: 5
    }
    delete f.properties['objectid']
    return f
  },
  un_glc30_global_lc_ss_a: f => {
    f.tippecanoe = {
      layer: 'landcover',
      minzoom: 3,
      maxzoom: 5
    }
  if (f.properties.gridcode == 20 || f.properties.gridcode == 30) {
    delete f.properties['objectid']
    delete f.properties['objectid_1']
    return f
  } else {
    return null 
  }
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
  unmap_bndl_l: f => {
    f.tippecanoe = {
      layer: 'bndl',
      minzoom: 5,
      maxzoom: 5
    }
    delete f.properties['objectid']
    delete f.properties['iso3cd']
  //no need admin 1 and 2 for ZL5 
  if (f.properties.bdytyp === '6' ||f.properties.bdytyp === '7') {
    return null
  } else {
    return f
  }
  },
  unmap_bndl05_l: f => {
    f.tippecanoe = {
      layer: 'bndl',
      minzoom: 3,
      maxzoom: 4
    }
    delete f.properties['objectid']
    delete f.properties['iso3cd']
  //no need admin 1 and 2 for small scale
  if (f.properties.bdytyp === '6' || f.properties.bdytyp === '7') {
    return null
  } else {
    return f
  }
  },
   unmap_bndl25_l: f => {
    f.tippecanoe = {
      layer: 'bndl',
      minzoom: 0,
      maxzoom: 2
    }
    delete f.properties['objectid']
    delete f.properties['iso3cd']
  //no need admin 1 and 2 for small scale
  if (f.properties.bdytyp === '6' || f.properties.bdytyp === '7') {
    return null
  } else {
    return f
  }
  },
  custom_ne_rivers_lakecentrelines_l: f => {
    f.tippecanoe = {
      layer: 'un_water',
      maxzoom: 5
    }
  if (f.properties.scalerank == 1 || f.properties.scalerank == 2 || f.properties.scalerank == 3 || f.properties.scalerank == 4) {
    f.tippecanoe.minzoom = 3
  } else if (f.properties.scalerank == 5 || f.properties.scalerank == 6 || f.properties.scalerank == 7 ) {
    f.tippecanoe.minzoom = 4
  } else {
    f.tippecanoe.minzoom = 5
  }
    delete f.properties['strokeweig']
    delete f.properties['dissolve']
    delete f.properties['note']
    delete f.properties['mission']
    return f
  },
  unmap_bnda_label_03_p: f => {
    f.tippecanoe = {
      layer: 'lab_cty',
      minzoom: 1,
      maxzoom: 1
    }
    delete f.properties['objectid']
    delete f.properties['featureid']
    delete f.properties['fontname']
    delete f.properties['fontsize']
    delete f.properties['bold']
    delete f.properties['italc']
    delete f.properties['underline']
    delete f.properties['verticalalignment']
    delete f.properties['horizontalalignment']
    delete f.properties['xoffset']
    delete f.properties['yoffset']
    delete f.properties['angle']
    delete f.properties['fontleading']
    delete f.properties['wordspacing']
    delete f.properties['characterwidth']
    delete f.properties['characterspacing']
    delete f.properties['flipangle']
    delete f.properties['override']
    delete f.properties['orig_fid']
    delete f.properties['gdb_geomattr_data']
    delete f.properties['zorder']
    delete f.properties['element']
    delete f.properties['symbolid']
   //if we need to remove features with status 1
   if (f.properties.status == 1) {
   delete f
   } 
    return f
  },
  unmap_bnda_label_04_p: f => {
    f.tippecanoe = {
      layer: 'lab_cty',
      minzoom: 2,
      maxzoom: 2
    }
    delete f.properties['objectid']
    delete f.properties['featureid']
    delete f.properties['fontname']
    delete f.properties['fontsize']
    delete f.properties['bold']
    delete f.properties['italc']
    delete f.properties['underline']
    delete f.properties['verticalalignment']
    delete f.properties['horizontalalignment']
    delete f.properties['xoffset']
    delete f.properties['yoffset']
    delete f.properties['angle']
    delete f.properties['fontleading']
    delete f.properties['wordspacing']
    delete f.properties['characterwidth']
    delete f.properties['characterspacing']
    delete f.properties['flipangle']
    delete f.properties['override']
    delete f.properties['orig_fid']
    delete f.properties['gdb_geomattr_data']
    delete f.properties['zorder']
    delete f.properties['element']
    delete f.properties['symbolid']
   //if we need to remove features with status 1
   if (f.properties.status == 1) {
   delete f
   } 
    return f
  },
  unmap_bnda_label_05_p: f => {
    f.tippecanoe = {
      layer: 'lab_cty',
      minzoom: 3,
      maxzoom: 3
    }
    delete f.properties['objectid']
    delete f.properties['featureid']
    delete f.properties['fontname']
    delete f.properties['fontsize']
    delete f.properties['bold']
    delete f.properties['italc']
    delete f.properties['underline']
    delete f.properties['verticalalignment']
    delete f.properties['horizontalalignment']
    delete f.properties['xoffset']
    delete f.properties['yoffset']
    delete f.properties['angle']
    delete f.properties['fontleading']
    delete f.properties['wordspacing']
    delete f.properties['characterwidth']
    delete f.properties['characterspacing']
    delete f.properties['flipangle']
    delete f.properties['override']
    delete f.properties['orig_fid']
    delete f.properties['gdb_geomattr_data']
    delete f.properties['zorder']
    delete f.properties['element']
    delete f.properties['symbolid']
   //if we need to remove features with status 1
   if (f.properties.status == 1) {
   delete f
   } 
    return f
  },
  unmap_bnda_label_06_p: f => {
    f.tippecanoe = {
      layer: 'lab_cty',
      minzoom: 4,
      maxzoom: 5
    }
    delete f.properties['objectid']
    delete f.properties['featureid']
    delete f.properties['fontname']
    delete f.properties['fontsize']
    delete f.properties['bold']
    delete f.properties['italc']
    delete f.properties['underline']
    delete f.properties['verticalalignment']
    delete f.properties['horizontalalignment']
    delete f.properties['xoffset']
    delete f.properties['yoffset']
    delete f.properties['angle']
    delete f.properties['fontleading']
    delete f.properties['wordspacing']
    delete f.properties['characterwidth']
    delete f.properties['characterspacing']
    delete f.properties['flipangle']
    delete f.properties['override']
    delete f.properties['orig_fid']
    delete f.properties['gdb_geomattr_data']
    delete f.properties['zorder']
    delete f.properties['element']
    delete f.properties['symbolid']
   //if we need to remove features with status 1
   if (f.properties.status == 1) {
   delete f
   } 
    return f
  },
  unmap_phyp_label_04_p: f => {
    f.tippecanoe = {
      layer: 'lab_water',
      minzoom: 3,
      maxzoom: 3
    }
  //Ocean minz 1, Bay minz 2, Sea minz3
  if (f.properties.annotationclassid == 0 || f.properties.annotationclassid == 1) {
    f.tippecanoe.minzoom = 1
  } else if (f.properties.annotationclassid == 3) {
    f.tippecanoe.minzoom = 2
  } else if (f.properties.annotationclassid == 2 || f.properties.annotationclassid == 4 || f.properties.annotationclassid == 5) {
    f.tippecanoe.minzoom = 3
  } else {
    f.tippecanoe.minzoom = 5
  } 
    delete f.properties['zorder']
    delete f.properties['element']
  if (f.properties.status == 1) {
    return null
  } else {
    return f
  }
  },
  unmap_phyp_label_06_p: f => {
    f.tippecanoe = {
      layer: 'lab_water',
      minzoom: 4,
      maxzoom: 5
    }
   if (f.properties.annotationclassid == 6) {
    f.tippecanoe.minzoom = 5
  }
    delete f.properties['zorder']
    delete f.properties['element']
  if (f.properties.status == 1) {
    return null
  } else {
    return f
  }
  },
  unmap_phyp_p: f => {
    f.tippecanoe = {
      layer: 'phyp_label',
      minzoom: 5,
      maxzoom: 5
    }
//edit 2021-01-27 starts
f.properties.display = 0
if (f.properties.type == 4 && !/Sea|Ocean|Gulf/.test(f.properties.name) ){
f.properties.display = 1
}
//edit 2021-01-27 ends
    return f
  },
  unmap_popp_p: f => {
    f.tippecanoe = {
      layer: 'un_popp',
      minzoom: 3,
      maxzoom: 5
    }
//    let popp_arr = [1, 2, 3]
   if (f.properties.cartolb === 'Alofi' ||f.properties.cartolb === 'Avarua' ||f.properties.cartolb === 'Sri Jayewardenepura Kotte' ) {
     return null
    } else if (f.properties.poptyp == 1 || f.properties.poptyp == 2) {
     return f
    } else if (f.properties.poptyp == 3 && f.properties.scl_id == 10) {
     return f
    } else {
     return null
    } 
  } 
}
module.exports = (f) => {
  return postProcess(lut[f.properties._table](preProcess(f)))
}

