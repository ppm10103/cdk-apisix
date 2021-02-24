const { AwsCdkConstructLibrary } = require('projen');
const { Automation } = require('projen-automate-it');

const AUTOMATION_TOKEN = 'PROJEN_GITHUB_TOKEN';

const project = new AwsCdkConstructLibrary({
  authorAddress: 'pahudnet@gmail.com',
  authorName: 'Pahud',
  cdkVersion: '1.82.0',
  name: 'cdk-apisix',
  description: 'CDK construct library to generate serverless Apache APISIX workload on AWS Fargate.',
  repository: 'https://github.com/pahud/cdk-apisix.git',
  releaseBranches: ['main'],
  defaultReleaseBranch: 'main',
  dependabot: false,
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
  deps: [
    'projen-automate-it',
  ],
  bundledDeps: [
    'projen-automate-it',
  ],
  python: {
    distName: 'cdk-apisix',
    module: 'cdk_apisix',
  },
});


const automation = new Automation(project, {
  automationToken: AUTOMATION_TOKEN,
});

automation.autoApprove();
automation.autoMerge();
automation.projenYarnUpgrade();


const common_exclude = ['cdk.out', 'cdk.context.json', 'yarn-error.log'];
project.npmignore.exclude(...common_exclude);
project.gitignore.exclude(...common_exclude);

project.synth();
