import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as glob from '@actions/glob';

export function getProtoDir() {
	return path.join(os.homedir(), '.proto');
}

export function getHomeDir() {
	const proto = path.join(os.homedir(), '.proto');

	if (fs.existsSync(proto)) {
		return proto;
	}

	return getProtoDir();
}

export function getToolsDir() {
	return path.join(getHomeDir(), 'tools');
}

export async function getToolchainCacheKey() {
	const toolchainHash = await glob.hashFiles('.prototools');

	return `moon-toolchain-${process.platform}-${toolchainHash}`;
}
