const {
  AwsCdkConstructLibrary,
  DevEnvironmentDockerImage,
  Gitpod,
} = require('projen');

const AUTOMATION_TOKEN = 'PROJEN_GITHUB_TOKEN';

const project = new AwsCdkConstructLibrary({
  authorAddress: 'pahudnet@gmail.com',
  authorName: 'Pahud Hsieh',
  cdkVersion: '1.82.0',
  name: 'cdk-apisix',
  description: 'CDK construct library to generate serverless Apache APISIX workload on AWS Fargate.',
  repository: 'https://github.com/pahud/cdk-apisix.git',
  defaultReleaseBranch: 'main',
  depsUpgradeOptions: {
    ignoreProjen: false,
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
      secret: AUTOMATION_TOKEN,
    },
  },
  minNodeVersion: '12.20.0',
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['pahud'],
  },
  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-efs',
    '@aws-cdk/aws-ecs-patterns',
    '@aws-cdk/aws-elasticloadbalancingv2',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-logs',
  ],
  python: {
    distName: 'cdk-apisix',
    module: 'cdk_apisix',
  },
});

project.package.addField('resolutions', {
  'pac-resolver': '^5.0.0',
  'set-value': '^4.0.1',
  'ansi-regex': '^5.0.1',
});


const gitpodPrebuild = project.addTask('gitpod:prebuild', {
  description: 'Prebuild setup for Gitpod',
});
// install and compile only, do not test or package.
gitpodPrebuild.exec('yarn install --frozen-lockfile --check-files');
gitpodPrebuild.exec('npx projen compile');

let gitpod = new Gitpod(project, {
  dockerImage: DevEnvironmentDockerImage.fromFile('.gitpod.Dockerfile'),
  prebuilds: {
    addCheck: true,
    addBadge: true,
    addLabel: true,
    branches: true,
    pullRequests: true,
    pullRequestsFromForks: true,
  },
});

gitpod.addCustomTask({
  init: 'yarn gitpod:prebuild',
  // always upgrade after init
  command: 'npx projen upgrade',
});

gitpod.addVscodeExtensions(
  'dbaeumer.vscode-eslint',
  'ms-azuretools.vscode-docker',
  'AmazonWebServices.aws-toolkit-vscode',
);


const common_exclude = ['cdk.out', 'cdk.context.json', 'yarn-error.log'];
project.npmignore.exclude(...common_exclude);
project.gitignore.exclude(...common_exclude);

project.synth();

