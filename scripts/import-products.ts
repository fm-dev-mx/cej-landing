import { spawnSync } from 'child_process';

const batchMode = process.argv.includes('--stage-only') ? 'stage' : 'full';
const dryRun = process.argv.includes('--dry-run');

const stageArgs = ['tsx', 'scripts/stage-legacy-csv.ts', '--source=productos'];
if (dryRun) stageArgs.push('--dry-run');

const stage = spawnSync('pnpm', stageArgs, { stdio: 'inherit', shell: true });
if (stage.status !== 0) process.exit(stage.status ?? 1);

if (dryRun || batchMode === 'stage') process.exit(0);

console.log('Use the generated legacy_ingest_batches.id and run:');
console.log('pnpm tsx scripts/promote-products-from-staging.ts --batch-id=<uuid>');
