const { AwsCdkConstructLibrary } = require('projen');

const project = new AwsCdkConstructLibrary({
  authorAddress: 'pahudnet@gmail.com',
  authorName: 'Pahud',
  cdkVersion: '1.77.0',
  name: 'cdk-apisix',
  repository: 'https://github.com/pahudnet/cdk-apisix.git',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-efs',
    '@aws-cdk/aws-ecs-patterns',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-logs',
  ],
});

project.synth();
