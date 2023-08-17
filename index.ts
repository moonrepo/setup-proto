import fs from 'node:fs';
import path from 'node:path';
import execa from 'execa';
import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import { getPluginsDir, getProtoDir, getToolchainCacheKey, getToolsDir } from './helpers';

const WINDOWS = process.platform === 'win32';

async function installProto() {
	core.info('Installing `proto` globally');

	const version = core.getInput('version') || 'latest';

	const binName = WINDOWS ? 'proto.exe' : 'proto';
	const binDir = path.join(getProtoDir(), 'bin');
	const binPath = path.join(binDir, binName);

	if (version !== 'latest' && fs.existsSync(binPath)) {
		core.addPath(binDir);
		core.info('Binary already exists, skipping installation');

		return;
	}

	const scriptName = WINDOWS ? 'proto.ps1' : 'proto.sh';
	const scriptPath = path.join(getProtoDir(), 'temp', scriptName);

	// If the installer already exists, delete it and ensure were using the latest
	if (fs.existsSync(scriptPath)) {
		fs.unlinkSync(scriptPath);
	}

	const script = await tc.downloadTool(`https://moonrepo.dev/install/${scriptName}`, scriptPath);
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
		[getPluginsDir(), getToolsDir()],
		primaryKey,
		[`proto-toolchain-${process.platform}`, 'proto-toolchain'],
		{},
		false,
	);

	if (cacheKey) {
		core.saveState('cacheHitKey', cacheKey);
		core.info(`Toolchain cache restored using key ${primaryKey}`);
	} else {
		core.info(`Toolchain cache does not exist using key ${primaryKey}`);
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
