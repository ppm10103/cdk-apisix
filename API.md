# API Reference

**Classes**

Name|Description
----|-----------
[Apisix](#cdk-apisix-apisix)|The Apisix construct.


**Structs**

Name|Description
----|-----------
[ApisixProps](#cdk-apisix-apisixprops)|construct properties for Apisix.
[WebServiceOptions](#cdk-apisix-webserviceoptions)|options for createWebService.



## class Apisix  <a id="cdk-apisix-apisix"></a>

The Apisix construct.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Apisix(scope: Construct, id: string, props?: ApisixProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[ApisixProps](#cdk-apisix-apisixprops)</code>)  *No description*
  * **apisixContainer** (<code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code>)  container for APISIX API service. __*Default*__: public.ecr.aws/d7p2r8s3/apisix
  * **cluster** (<code>[ICluster](#aws-cdk-aws-ecs-icluster)</code>)  Amazon ECS cluster. __*Default*__: create a new cluster
  * **dashboardContainer** (<code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code>)  container for the dashboard. __*Default*__: public.ecr.aws/d7p2r8s3/apisix-dashboard
  * **efsFilesystem** (<code>[IFileSystem](#aws-cdk-aws-efs-ifilesystem)</code>)  Amazon EFS filesystem for etcd data persistence. __*Default*__: ceate a new filesystem
  * **etcdContainer** (<code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code>)  container for the etcd. __*Default*__: public.ecr.aws/eks-distro/etcd-io/etcd:v3.4.14-eks-1-18-1
  * **vpc** (<code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code>)  Vpc for the APISIX. __*Default*__: create a new VPC or use existing one



### Properties


Name | Type | Description 
-----|------|-------------
**cluster** | <code>[ICluster](#aws-cdk-aws-ecs-icluster)</code> | <span></span>
**vpc** | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | <span></span>

### Methods


#### createWebService(id, options) <a id="cdk-apisix-apisix-createwebservice"></a>

Create a basic web service on AWS Fargate.

```ts
createWebService(id: string, options: WebServiceOptions): NetworkLoadBalancedFargateService
```

* **id** (<code>string</code>)  *No description*
* **options** (<code>[WebServiceOptions](#cdk-apisix-webserviceoptions)</code>)  *No description*
  * **environment** (<code>Map<string, string></code>)  *No description* __*Optional*__
  * **image** (<code>[RepositoryImage](#aws-cdk-aws-ecs-repositoryimage)</code>)  *No description* __*Optional*__
  * **port** (<code>number</code>)  *No description* __*Optional*__

__Returns__:
* <code>[NetworkLoadBalancedFargateService](#aws-cdk-aws-ecs-patterns-networkloadbalancedfargateservice)</code>



## struct ApisixProps  <a id="cdk-apisix-apisixprops"></a>


construct properties for Apisix.



Name | Type | Description 
-----|------|-------------
**apisixContainer**? | <code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code> | container for APISIX API service.<br/>__*Default*__: public.ecr.aws/d7p2r8s3/apisix
**cluster**? | <code>[ICluster](#aws-cdk-aws-ecs-icluster)</code> | Amazon ECS cluster.<br/>__*Default*__: create a new cluster
**dashboardContainer**? | <code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code> | container for the dashboard.<br/>__*Default*__: public.ecr.aws/d7p2r8s3/apisix-dashboard
**efsFilesystem**? | <code>[IFileSystem](#aws-cdk-aws-efs-ifilesystem)</code> | Amazon EFS filesystem for etcd data persistence.<br/>__*Default*__: ceate a new filesystem
**etcdContainer**? | <code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code> | container for the etcd.<br/>__*Default*__: public.ecr.aws/eks-distro/etcd-io/etcd:v3.4.14-eks-1-18-1
**vpc**? | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | Vpc for the APISIX.<br/>__*Default*__: create a new VPC or use existing one



## struct WebServiceOptions  <a id="cdk-apisix-webserviceoptions"></a>


options for createWebService.



Name | Type | Description 
-----|------|-------------
**environment**? | <code>Map<string, string></code> | __*Optional*__
**image**? | <code>[RepositoryImage](#aws-cdk-aws-ecs-repositoryimage)</code> | __*Optional*__
**port**? | <code>number</code> | __*Optional*__



