const mysql = require('mysql2/promise')

async function cleanup() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '132014',
    database: 'blog_db'
  })

  console.log('Cleaning up simulator data...')

  const [[{ simUserCount }]] = await conn.query(
    'SELECT COUNT(*) as simUserCount FROM users WHERE password = "$2b$10$vXOo3aQVFecTGG7UiVdcze2nExOdRFj00teN8MDISsTFVYWls4TBe"'
  )
  console.log(`Simulator users to delete: ${simUserCount}`)

  const [[{ totalUsers }]] = await conn.query('SELECT COUNT(*) as totalUsers FROM users')
  console.log(`Total users before cleanup: ${totalUsers}`)

  await conn.query('DELETE FROM statuses WHERE author_id IN (SELECT id FROM users WHERE password = "$2b$10$vXOo3aQVFecTGG7UiVdcze2nExOdRFj00teN8MDISsTFVYWls4TBe")')
  console.log('Deleted simulator statuses')

  await conn.query('DELETE FROM articles WHERE author_id IN (SELECT id FROM users WHERE password = "$2b$10$vXOo3aQVFecTGG7UiVdcze2nExOdRFj00teN8MDISsTFVYWls4TBe")')
  console.log('Deleted simulator articles')

  await conn.query('DELETE FROM users WHERE password = "$2b$10$vXOo3aQVFecTGG7UiVdcze2nExOdRFj00teN8MDISsTFVYWls4TBe"')
  console.log('Deleted simulator users')

  await conn.query('ALTER TABLE statuses AUTO_INCREMENT = 1')
  await conn.query('ALTER TABLE articles AUTO_INCREMENT = 1')
  await conn.query('ALTER TABLE users AUTO_INCREMENT = 1')
  console.log('Reset auto-increment counters')

  const [[{ finalUsers }]] = await conn.query('SELECT COUNT(*) as finalUsers FROM users')
  const [[{ finalArticles }]] = await conn.query('SELECT COUNT(*) as finalArticles FROM articles')
  const [[{ finalStatuses }]] = await conn.query('SELECT COUNT(*) as finalStatuses FROM statuses')

  console.log(`\nAfter cleanup:`)
  console.log(`  Users: ${finalUsers}`)
  console.log(`  Articles: ${finalArticles}`)
  console.log(`  Statuses: ${finalStatuses}`)

  await conn.end()
  console.log('\nDone!')
}

cleanup().catch(err => {
  console.error('Cleanup failed:', err)
  process.exit(1)
})
