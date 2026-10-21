import type { EngineInterface, Register } from 'claude-code'

// SHA-256 of the voice.md that the setup-script restore block writes.
const EXPECTED = '4b727acc06282e750f1b0afbe3fe126e6b7014ec81c1120e51a58d83b0356354'
const EXPECTED_BYTES = 5554
const RELATIVE = '.claude/youtube/voice.md'

async function homeDir($: EngineInterface): Promise<string> {
  const { exitCode, stdout } = await $.process.run(['printenv', 'HOME'])
  const home = stdout.trim()
  return exitCode === 0 && home.startsWith('/') ? home : '/root'
}

async function sha256Hex(base64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

// Read-only: stat and read, never write.
async function check($: EngineInterface): Promise<string> {
  const path = `${await homeDir($)}/${RELATIVE}`
  const lines = [`voice.md check — ${path}`]

  if (!(await $.fs.exists(path))) {
    return [...lines, '',
      '✗ MISSING. The file is not there.',
      'Your setup script restores it at the start of each new session; if this is a new session,',
      'check that the restore block is still at the end of Edit → Setup script.'].join('\n')
  }

  const stat = await $.fs.stat(path)
  if (stat.kind !== 'file') {
    return [...lines, '', `✗ NOT A FILE. The path exists but is a ${stat.kind}${stat.isLink ? ' (link)' : ''}.`].join('\n')
  }
  if (stat.size === 0) {
    return [...lines, '',
      '✗ EMPTY. The file exists but has no content.',
      'The setup script restores an empty file in the next new session.'].join('\n')
  }

  const { base64 } = await $.fs.read(path, { as: 'bytes' })
  const actual = await sha256Hex(base64)
  const modified = new Date(stat.mtimeMs).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'

  if (actual === EXPECTED) {
    return [...lines, '',
      '✓ MATCHES your saved profile.',
      `  fingerprint ${actual}`,
      `  ${stat.size} bytes · last modified ${modified}`].join('\n')
  }

  return [...lines, '',
    '✗ DIFFERENT from your saved profile.',
    `  expected ${EXPECTED} (${EXPECTED_BYTES} bytes)`,
    `  found    ${actual} (${stat.size} bytes)`,
    `  last modified ${modified}`,
    '',
    'Nothing was changed. If you edited voice.md on purpose, update the restore block in your',
    'setup script too, or new sessions will keep restoring the old version.'].join('\n')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'voice-check',
      description: 'Check ~/.claude/youtube/voice.md exists and matches your saved fingerprint (read-only)',
    })
    return next(e)
  })

  on('command.run', { command: 'voice-check' }, async $ => {
    try {
      return { text: await check($) }
    } catch (err) {
      return { text: `voice.md check could not finish: ${err instanceof Error ? err.message : String(err)}\nNothing was changed.` }
    }
  })
}
