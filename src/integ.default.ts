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

    configureTheMock(stack);

    const apisix = new Apisix(stack, 'apisix-demo');

    apisix.createWebService('flask', {
      environment: {
        PLATFORM: 'Apache APISIX on AWS Fargate',
      },
      image: ContainerImage.fromRegistry('public.ecr.aws/pahudnet/flask-docker-sample'),
      port: 80,
    } );

    app.synth();

    this.stack = [stack];
  }
}

new IntegTesting();


function isContextAvailable(scope: cdk.Construct, key: string) {
  return cdk.Stack.of(scope).node.tryGetContext(key);
}

function configureTheMock(stack: cdk.Stack) {
  const required = [
    'ADMIN_KEY_ADMIN',
    'ADMIN_KEY_VIEWER',
    'DASHBOARD_ADMIN_PASSWORD',
    'DASHBOARD_USER_PASSWORD',
  ];
  required.map(c => {
    if (!isContextAvailable(stack, c)) stack.node.setContext(c, 'mock');
  });
}
