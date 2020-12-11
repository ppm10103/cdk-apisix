import * as path from 'path';
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

    new Apisix(stack, 'apisix-demo', {
      apisixContainer: ContainerImage.fromAsset(path.join(__dirname, '../apisix_container')),
      etcdContainer: ContainerImage.fromRegistry('public.ecr.aws/eks-distro/etcd-io/etcd:v3.4.14-eks-1-18-1'),
      dashboardContainer: ContainerImage.fromAsset(path.join(__dirname, '../apisix_dashboard')),
    });

    app.synth();
    this.stack = [stack];
  }
}

new IntegTesting();


