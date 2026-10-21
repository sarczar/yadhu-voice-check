import { expect, test } from 'claude-code/testing'

// Each hook below stands for the engine. Any write would reach a 'fs.write' hook, which fails the test.
function engine(on: any, file: { exists: boolean; size?: number; text?: string }) {
  const writes: string[] = []
  on('command.register', () => ({ value: { command: 'voice-check' } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('process.run', () => ({ value: { exitCode: 0, stdout: '/root\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  on('fs.exists', () => ({ value: file.exists }))
  on('fs.stat', () => ({ value: { kind: 'file', size: file.size ?? 0, mtimeMs: 0, isLink: false } }))
  on('fs.read', () => ({ value: { base64: btoa(file.text ?? '') } }))
  on('fs.write', (_: unknown, e: { path: string }) => { writes.push(e.path); return { value: undefined } })
  return writes
}

async function runCheck($: any) {
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  return (await $.command.run({ command: 'voice-check' })).text as string
}

test('missing file is reported, nothing written', async ($, on) => {
  const writes = engine(on, { exists: false })
  const text = await runCheck($)
  expect(text).toContain('/root/.claude/youtube/voice.md')
  expect(text).toContain('MISSING')
  expect(writes.length).toBe(0)
})

test('empty file is reported', async ($, on) => {
  const writes = engine(on, { exists: true, size: 0 })
  expect(await runCheck($)).toContain('EMPTY')
  expect(writes.length).toBe(0)
})

test('changed file is reported with both fingerprints', async ($, on) => {
  // sha256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
  const writes = engine(on, { exists: true, size: 5, text: 'hello' })
  const text = await runCheck($)
  expect(text).toContain('DIFFERENT')
  expect(text).toContain('4b727acc06282e750f1b0afbe3fe126e6b7014ec81c1120e51a58d83b0356354')
  expect(text).toContain('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
  expect(writes.length).toBe(0)
})
