import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { CALVER_CYCLES, type CalVerCycle, clean, cycle, initial, isCycleValid, prefix } from 'calver';

async function run(): Promise<void> {
  const releaseCycle = (core.getInput('cycle')?.toLowerCase() || 'auto') as CalVerCycle;
  const mode = core.getInput('retrieval-mode')?.toLowerCase() || 'tag';
  const token = core.getInput('github-token');
  const tagPrefix = core.getInput('tag-prefix') || undefined;
  let repo = (core.getInput('repo') || undefined)?.split('/');
  repo ??= [context.repo.owner, context.repo.repo];

  if (repo.length !== 2) {
    core.setFailed(`Invalid repo "${repo.join('/')}". Must be in the format: <owner>/<repo>`);
    return;
  }

  if (!isCycleValid(releaseCycle)) {
    core.setFailed(`Invalid cycle "${releaseCycle}". Must be one of: ${CALVER_CYCLES.join(', ')}`);
    return;
  }

  const octokit = getOctokit(token);

  let latestVersion: string | undefined;
  if (mode === 'tag') {
    const tagRes = await octokit.rest.repos.listTags({
      repo: repo[1],
      owner: repo[0]
    });
    latestVersion = tagRes.data[0]?.name;
  } else {
    const res = await octokit.rest.repos.listReleases({
      repo: repo[1],
      owner: repo[0]
    });
    latestVersion = res.data.filter(release => !release.prerelease)[0]?.tag_name;
  }
  let latestVersionClean: string;
  let newVersion: string;
  if (latestVersion) {
    core.info(`ℹ️ Current latest version ${latestVersion}`);
    latestVersionClean = clean(latestVersion);
    core.info(`ℹ️ Current latest version (without prefix) ${latestVersionClean}`);
    newVersion = cycle(latestVersionClean, { cycle: releaseCycle });
  } else {
    newVersion = initial({ cycle: releaseCycle });
  }
  const newVersionClean = newVersion;
  newVersion = prefix(newVersion, tagPrefix);

  core.setOutput('new-version', newVersion);
  core.setOutput('new-version-clean', newVersionClean);
  core.setOutput('current-version', latestVersion);
  core.setOutput('current-version-clean', latestVersionClean);
  core.info(`ℹ️ Setting new version to ${newVersion}`);
}

void run();
