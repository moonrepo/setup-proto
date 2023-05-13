import fs from 'node:fs';
import path from 'node:path';
import execa from 'execa';
import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import { getHomeDir, getProtoDir, getToolchainCacheKey, getToolsDir } from './helpers';

const WINDOWS = process.platform === 'win32';

// eslint-disable-next-line complexity
async function installProto() {
	core.info('Installing `proto` globally');

	const version = core.getInput('version') || 'latest';
	const isV1 = version === 'latest' || !version.startsWith('0');

	const binName = WINDOWS ? 'proto.exe' : 'proto';
	const binDir = isV1 ? path.join(getProtoDir(), 'bin') : path.join(getToolsDir(), 'proto', version);
	const binPath = path.join(binDir, binName);

	if (version !== 'latest' && fs.existsSync(binPath)) {
		core.addPath(binDir);
		core.info('Binary already exists, skipping installation');

		return;
	}

	const scriptName = WINDOWS ? 'install.ps1' : 'install.sh';
	const script = await tc.downloadTool(
		isV1
			? `https://moonrepo.dev/install/${WINDOWS ? 'proto.ps1' : 'proto.sh'}`
			: `https://moonrepo.dev/${scriptName}`,
		path.join(getHomeDir(), 'temp', scriptName),
	);
	const args = version === 'latest' ? [] : [version];

	core.info(`Downloaded installation script to ${script}`);

	// eslint-disable-next-line no-magic-numbers
	await fs.promises.chmod(script, 0o755);

	await execa(script, args);

	// Make it available without exe extension
	if (WINDOWS) {
		await fs.promises.copyFile(binPath, path.join(binDir, 'proto'));
	}

	core.info(`Installed binary to ${binPath}`);

	core.addPath(binDir);

	core.info(`Added installation direction to PATH`);
}

async function restoreCache() {
	if (!cache.isFeatureAvailable()) {
		return;
	}

	core.info('Attempting to restore cached toolchain');

	const primaryKey = await getToolchainCacheKey();
	const cacheKey = await cache.restoreCache(
		[getToolsDir()],
		primaryKey,
		[`proto-toolchain-${process.platform}`, 'proto-toolchain'],
		{},
		false,
	);

	if (cacheKey) {
		core.saveState('cacheHitKey', cacheKey);
		core.info(`Toolchain cache restored using key ${primaryKey}`);
	} else {
		core.warning(`Toolchain cache does not exist using key ${primaryKey}`);
	}

	core.setOutput('cache-key', cacheKey ?? primaryKey);
	core.setOutput('cache-hit', !!cacheKey);
}

async function run() {
	try {
		await restoreCache();
		await installProto();
	} catch (error: unknown) {
		core.setFailed((error as Error).message);
	}
}

// eslint-disable-next-line unicorn/prefer-top-level-await
void run();
