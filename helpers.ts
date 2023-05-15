import os from 'node:os';
import path from 'node:path';
import * as core from '@actions/core';
import * as glob from '@actions/glob';

export function getProtoDir() {
	if (process.env.PROTO_ROOT) {
		return process.env.PROTO_ROOT;
	}

	return path.join(os.homedir(), '.proto');
}

export function getToolsDir() {
	return path.join(getProtoDir(), 'tools');
}

export async function getToolchainCacheKey() {
	const version = core.getInput('version') || 'latest';
	const toolchainHash = await glob.hashFiles('.prototools');

	return `proto-toolchain-${process.platform}-${version}-${toolchainHash}`;
}
