import { ContainerImage } from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { Apisix } from './';


export class IntegTesting {
  readonly stack: cdk.Stack[];
  constructor() {
    const devEnv = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    };

    const app = new cdk.App();

    const stack = new cdk.Stack(app, 'ApiSixDemoStack', { env: devEnv });

    const apisix = new Apisix(stack, 'apisix-demo');

    apisix.createWebService('flask', {
      environment: {
        PLATFORM: 'Apache APISIX on AWS Fargate',
      },
      image: ContainerImage.fromRegistry('public.ecr.aws/d7p2r8s3/flask-docker-sample'),
      port: 80,
    } );

    app.synth();

    this.stack = [stack];
  }
}

new IntegTesting();


