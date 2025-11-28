import * as core from '@actions/core';
import * as github from '@actions/github';
import { CALVER_CYCLES, type CalVerCycle, clean, cycle, initial, isCycleValid, prefix } from 'calver';


async function run(): Promise<void> {
  const releaseCycle = (core.getInput('cycle').toLowerCase() || 'auto') as CalVerCycle;
  const token = core.getInput('github_token');
  const tagPrefix = core.getInput('tagPrefix') || undefined;
  let repo = (core.getInput('repo') || undefined)?.split('/');
  repo ??= [github.context.repo.owner, github.context.repo.repo];

  if (repo.length !== 2) {
    core.setFailed(`Invalid repo "${repo.join('/')}". Must be in the format: <owner>/<repo>`);
    return;
  }

  if (!isCycleValid(releaseCycle)) {
    core.setFailed(`Invalid cycle "${releaseCycle}". Must be one of: ${CALVER_CYCLES.join(', ')}`);
    return;
  }

  const octokit = github.getOctokit(token);
  const res = await octokit.rest.repos.listReleases({
    repo: repo[1],
    owner: repo[0]
  });

  let latestVersion = res.data.filter(release => !release.prerelease)[0].tag_name;
  let latestVersionClean: string;
  let newVersion: string;
  if (!latestVersion) {
    core.info(`ℹ️ Current latest version ${latestVersion}`);
    latestVersionClean = clean(latestVersion);
    core.info(`ℹ️ Current latest version (without prefix) ${latestVersionClean}`);
    newVersion = cycle(latestVersionClean, { cycle: releaseCycle });
  } else {
    newVersion = initial({ cycle: releaseCycle });
  }
  const newVersionClean = newVersion;
  newVersion = prefix(newVersion, tagPrefix);

  core.setOutput('newVersion', newVersion);
  core.setOutput('newVersionClean', newVersionClean);
  core.setOutput('currentVersion', latestVersion);
  core.setOutput('currentVersionClean', latestVersionClean);
  core.info(`ℹ️ Setting new version to ${newVersion}`);
}

void run();
