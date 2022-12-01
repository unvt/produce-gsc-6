// libraries
const config = require('config')
const { spawn } = require('child_process')
const byline = require('byline')
const fs = require('fs')
const Queue = require('better-queue')
const pretty = require('prettysize')
const tilebelt = require('@mapbox/tilebelt')
const TimeFormat = require('hh-mm-ss')
const { Pool, Query } = require('pg')
const Spinner = require('cli-spinner').Spinner
const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')
const modify = require('./modify.js')

// config constants
const host = config.get('un-l.host')
const port = config.get('un-l.port') 
const wtpsThreshold = config.get('wtpsThreshold')
const monitorPeriod = config.get('monitorPeriod')
const Z = config.get('un-l.Z')
const dbUser = config.get('un-l.dbUser')
const dbPassword = config.get('un-l.dbPassword')
const relations = config.get('un-l.relations')
const defaultDate = new Date(config.get('defaultDate'))
const mbtilesDir = config.get('un-l.mbtilesDir')
const logDir = config.get('logDir')
const propertyBlacklist = config.get('un-l.propertyBlacklist')

const spinnerString = config.get('spinnerString')
const fetchSize = config.get('fetchSize')
const tippecanoePath = config.get('tippecanoePath')

//make a list
//const conversionTilelist = config.get('conversionTilelist')
const conversionTilelist01 = config.get('day01Tilelist')
const conversionTilelist02 = config.get('day02Tilelist')
const conversionTilelist03 = config.get('day03Tilelist')
const conversionTilelist04 = config.get('day04Tilelist')
const conversionTilelist05 = config.get('day05Tilelist')
const conversionTilelist06 = config.get('day06Tilelist')
const conversionTilelist07 = config.get('day07Tilelist')

let conversionTilelist = config.get('everydayTilelist')
conversionTilelist = conversionTilelist.concat(conversionTilelist01)
conversionTilelist = conversionTilelist.concat(conversionTilelist02)
conversionTilelist = conversionTilelist.concat(conversionTilelist03)
conversionTilelist = conversionTilelist.concat(conversionTilelist04)
conversionTilelist = conversionTilelist.concat(conversionTilelist05)
conversionTilelist = conversionTilelist.concat(conversionTilelist06)
conversionTilelist = conversionTilelist.concat(conversionTilelist07)


// global configurations
Spinner.setDefaultSpinnerString(spinnerString)
winston.configure({
  level: 'silly',
  format: winston.format.simple(),
  transports: [ 
    new DailyRotateFile({
      filename: `${logDir}/produce-un46-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
  ]
})

// global variable
let idle = true
let wtps
let modules = {}
let sar
let pools = {}
let productionSpinner = new Spinner()
let moduleKeysInProgress = []

const isIdle = () => {
  return idle
}

// all scores are zero because we cannot login as unix user
const getScores = async () => {
  return new Promise(async (resolve, reject) => {
    // identify modules to update
    let oldestDate = new Date()

//Replaced loop (based on the list)
    for (const moduleKey of conversionTilelist) {
        const path = `${mbtilesDir}/${moduleKey}.mbtiles`
        let mtime = defaultDate
        let size = 0
        if (fs.existsSync(path)) {
          let stat = fs.statSync(path)
          mtime = stat.mtime
          size = stat.size
        }
        oldestDate = (oldestDate < mtime) ? oldestDate : mtime
        modules[moduleKey] = {
          mtime: mtime,
          size: size,
         score: 0
       }
      }

    resolve()
  })
}

const iso = () => {
  return (new Date()).toISOString()
}

const noPressureWrite = (downstream, f) => {
  return new Promise((res) => {
    if (downstream.write(`\x1e${JSON.stringify(f)}\n`)) {
      res()
    } else {
      downstream.once('drain', () => { 
        res()
      })
    }
  })
}

const fetch = (client, database, table, downstream) => {
  return new Promise((resolve, reject) => {
    let count = 0
    let features = []
    client.query(new Query(`FETCH ${fetchSize} FROM cur`))
    .on('row', row => {
      let f = {
        type: 'Feature',
        properties: row,
        geometry: JSON.parse(row.st_asgeojson)
      }
      delete f.properties.st_asgeojson
      f.properties._database = database
      f.properties._table = table
      count++
      f = modify(f)
      if (f) features.push(f)
    })
    .on('error', err => {
      console.error(err.stack)
      reject()
    })
    .on('end', async () => {
      for (f of features) {
        try {
          await noPressureWrite(downstream, f)
        } catch (e) {
          reject(e)
        }
      }
      resolve(count)
    })
  })
}

const dumpAndModify = async (bbox, relation, downstream, moduleKey) => {
  return new Promise((resolve, reject) => {
    const startTime = new Date()
//    const [database, table] = relation.split('::')
    const [database, schema, table] = relation.split('::')
    if (!pools[database]) {
      pools[database] = new Pool({
        host: host,
        user: dbUser,
        port: port,
        password: dbPassword,
        database: database
      })
    }
    pools[database].connect(async (err, client, release) => {
      if (err) throw err
      let sql = `
SELECT column_name FROM information_schema.columns 
  WHERE table_name='${table}' AND table_schema='${schema}' ORDER BY ordinal_position`
      let cols = await client.query(sql)
      cols = cols.rows.map(r => r.column_name).filter(r => r !== 'geom')
      cols = cols.filter(v => !propertyBlacklist.includes(v))
      // ST_AsGeoJSON(ST_Intersection(ST_MakeValid(${table}.geom), envelope.geom))
      cols.push(`ST_AsGeoJSON(${schema}.${table}.geom)`)
      await client.query(`BEGIN`)
      sql = `
DECLARE cur CURSOR FOR 
WITH
  envelope AS (SELECT ST_MakeEnvelope(${bbox.join(', ')}, 4326) AS geom)
SELECT 
  ${cols.toString()}
FROM ${schema}.${table}
JOIN envelope ON ${schema}.${table}.geom && envelope.geom
` 
      cols = await client.query(sql)
      try {
        while (await fetch(client, database, table, downstream) !== 0) {}
      } catch (e) {
        reject(e)
      }
      await client.query(`COMMIT`)
      winston.info(`${iso()}: finished ${relation} of ${moduleKey}`)
      release()
      resolve()
    })
  })
}

const sleep = (wait) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve() }, wait)
  })
}

const queue = new Queue(async (t, cb) => {
  const startTime = new Date()
  const moduleKey = t.moduleKey
  const queueStats = queue.getStats()
  const [z, x, y] = moduleKey.split('-').map(v => Number(v))
  const bbox = tilebelt.tileToBBOX([x, y, z])
  const tmpPath = `${mbtilesDir}/part-${moduleKey}.mbtiles`
  const dstPath = `${mbtilesDir}/${moduleKey}.mbtiles`

  moduleKeysInProgress.push(moduleKey)
  productionSpinner.setSpinnerTitle(moduleKeysInProgress.join(', '))

  const tippecanoe = spawn(tippecanoePath, [
    '--quiet',
    '--no-feature-limit',
    '--no-tile-size-limit',
    '--force',
    '--simplification=2',
    '--drop-rate=1',
    `--minimum-zoom=${Z}`,
    '--maximum-zoom=15',
    '--base-zoom=15',
    '--hilbert',
    `--clip-bounding-box=${bbox.join(',')}`,
    `--output=${tmpPath}`
  ], { stdio: ['pipe', 'inherit', 'inherit'] })
  tippecanoe.on('exit', () => {
    fs.renameSync(tmpPath, dstPath)
    moduleKeysInProgress = moduleKeysInProgress.filter((v) => !(v === moduleKey))
    productionSpinner.stop()
    process.stdout.write('\n')
    const logString = `${iso()}: [${queueStats.total + 1}/${queueStats.peak}] process ${moduleKey} (score: ${modules[moduleKey].score}, ${pretty(modules[moduleKey].size)} => ${pretty(fs.statSync(dstPath).size)}) took ${TimeFormat.fromMs(new Date() - startTime)} wtps=${wtps}.`
    winston.info(logString)
    console.log(logString)
    if (moduleKeysInProgress.length !== 0) {
      productionSpinner.setSpinnerTitle(moduleKeysInProgress.join(', '))
      productionSpinner.start()
    }
    return cb()
  })

  productionSpinner.start()
  for (relation of relations) {
    while (!isIdle()) {
      winston.info(`${iso()}: short break due to heavy disk writes (wtps=${wtps}).`)
      await sleep(5000)
    }
    try {
      await dumpAndModify(bbox, relation, tippecanoe.stdin, moduleKey)
    } catch (e) {
      winston.error(e)
      cb(true)
    }
  }
  tippecanoe.stdin.end()
}, { 
  concurrent: config.get('un-l.concurrent'), 
  maxRetries: config.get('maxRetries'),
  retryDelay: config.get('retryDelay') 
})

const queueTasks = () => {
  let moduleKeys = Object.keys(modules)
  moduleKeys.sort((a, b) => modules[b].score - modules[a].score)
  for (let moduleKey of moduleKeys) {
  //for (let moduleKey of ['6-37-31', '6-38-31', '6-37-32', '6-38-32']) { //// TEMP
    //if (modules[moduleKey].score > 0) {
      queue.push({
        moduleKey: moduleKey
      })
    //}
  }
}

// shutdown this system
const shutdown = () => {
  winston.info(`${iso()}: production system shutdown.`)
  console.log('** production system shutdown! **')
//  sar.kill()
  process.exit(0)
}

const main = async () => {
  winston.info(`${iso()}: gsc-un46 production started.`)
  await getScores()
  queueTasks()
  queue.on('drain', () => {
    shutdown()
  })
}

main()
