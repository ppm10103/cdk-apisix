# API Reference

**Classes**

Name|Description
----|-----------
[Apisix](#cdk-apisix-apisix)|*No description*


**Structs**

Name|Description
----|-----------
[ApisixProps](#cdk-apisix-apisixprops)|*No description*



## class Apisix  <a id="cdk-apisix-apisix"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Apisix(scope: Construct, id: string, props: ApisixProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[ApisixProps](#cdk-apisix-apisixprops)</code>)  *No description*
  * **apisixContainer** (<code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code>)  *No description* 
  * **dashboardContainer** (<code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code>)  *No description* 
  * **etcdContainer** (<code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code>)  *No description* 
  * **cluster** (<code>[ICluster](#aws-cdk-aws-ecs-icluster)</code>)  *No description* __*Optional*__
  * **efsFilesystem** (<code>[IFileSystem](#aws-cdk-aws-efs-ifilesystem)</code>)  *No description* __*Optional*__
  * **vpc** (<code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code>)  *No description* __*Optional*__



### Properties


Name | Type | Description 
-----|------|-------------
**vpc** | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | <span></span>



## struct ApisixProps  <a id="cdk-apisix-apisixprops"></a>






Name | Type | Description 
-----|------|-------------
**apisixContainer** | <code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code> | <span></span>
**dashboardContainer** | <code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code> | <span></span>
**etcdContainer** | <code>[ContainerImage](#aws-cdk-aws-ecs-containerimage)</code> | <span></span>
**cluster**? | <code>[ICluster](#aws-cdk-aws-ecs-icluster)</code> | __*Optional*__
**efsFilesystem**? | <code>[IFileSystem](#aws-cdk-aws-efs-ifilesystem)</code> | __*Optional*__
**vpc**? | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | __*Optional*__



