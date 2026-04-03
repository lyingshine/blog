const cluster = require('cluster')
const os = require('os')
const sim = require('./utils/simulator')

const cpuCount = os.cpus().length
const workerCount = Math.max(1, Number(process.env.CLUSTER_WORKERS || Math.min(4, cpuCount)))
const PORT = Number(process.env.PORT || 3000)

if (cluster.isPrimary) {
  console.log(`[Cluster] Primary ${process.pid} starting ${workerCount} workers`)
  let leaderWorkerId = null

  for (let i = 0; i < workerCount; i++) {
    const worker = cluster.fork({
      ...process.env,
      SIMULATOR_LEADER: i === 0 ? '1' : '0'
    })
    if (i === 0) leaderWorkerId = worker.id
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`[Cluster] Worker ${worker.process.pid} exited (code=${code}, signal=${signal || 'none'}), restarting`)
    const shouldBeLeader = worker.id === leaderWorkerId
    const replacement = cluster.fork({
      ...process.env,
      SIMULATOR_LEADER: shouldBeLeader ? '1' : '0'
    })
    if (shouldBeLeader) leaderWorkerId = replacement.id
  })
} else {
  const app = require('./index')

  app.startServer({
    port: PORT,
    onStarted: () => {
      console.log(`[Cluster] Worker ${process.pid} listening on ${PORT}`)
      if (process.env.SIMULATOR_LEADER === '1') {
        sim.startSimulator()
        console.log(`[Cluster] Worker ${process.pid} is simulator leader`)
      }
    }
  }).then((server) => {
    process.on('SIGTERM', () => {
      server.close(() => process.exit(0))
    })
  }).catch((error) => {
    console.error(`[Cluster] Worker ${process.pid} failed to start:`, error)
    process.exit(1)
  })
}
