[![NPM version](https://badge.fury.io/js/cdk-apisix.svg)](https://badge.fury.io/js/cdk-apisix)
[![PyPI version](https://badge.fury.io/py/cdk-apisix.svg)](https://badge.fury.io/py/cdk-apisix)
![Release](https://github.com/pahud/cdk-apisix/workflows/Release/badge.svg)


# cdk-apisix

CDK construct library to generate serverless [Apache APISIX](https://github.com/apache/apisix) workload on AWS Fargate.

# sample

```ts
import { Apisix } from 'cdk-apisix';

new Apisix(stack, 'apisix-demo', {
  apisixContainer: ContainerImage.fromAsset(path.join(__dirname, '../apisix_container')),
  etcdContainer: ContainerImage.fromRegistry('public.ecr.aws/eks-distro/etcd-io/etcd:v3.4.14-eks-1-18-1'),
  dashboardContainer: ContainerImage.fromAsset(path.join(__dirname, '../apisix_dashboard')),
});
```
