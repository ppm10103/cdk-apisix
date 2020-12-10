import { Vpc, Port, IVpc } from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import { NetworkLoadBalancedFargateService } from '@aws-cdk/aws-ecs-patterns';
import * as efs from '@aws-cdk/aws-efs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as iam from '@aws-cdk/aws-iam';
import * as log from '@aws-cdk/aws-logs';
import * as cdk from '@aws-cdk/core';

export interface ApisixProps {
  readonly vpc?: IVpc;
  readonly cluster?: ecs.ICluster;
  readonly efsFilesystem?: efs.IFileSystem;
  readonly apisixContainer: ecs.ContainerImage;
  readonly dashboardContainer: ecs.ContainerImage;
  readonly etcdContainer: ecs.ContainerImage;
}

export class Apisix extends cdk.Construct {
  readonly vpc: IVpc;
  constructor(scope: cdk.Construct, id: string, props: ApisixProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    const vpc = props.vpc ?? getOrCreateVpc(this);

    this.vpc = vpc;

    const cluster = props.cluster ?? new ecs.Cluster(this, 'Cluster', { vpc });

    /**
     * Amazon EFS filesystem for etcd
     */
    const fs = props.efsFilesystem ?? this._createEfsFilesystem();

    /**
     * ApiSix service
     */
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskApiSix', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    const apisix = taskDefinition
      .addContainer('apisix', {
        // image: ecs.ContainerImage.fromRegistry('public.ecr.aws/d7p2r8s3/apisix'),
        // image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../apisix_container')),
        image: props.apisixContainer,
        logging: new ecs.AwsLogDriver({
          streamPrefix: 'apisix',
          logRetention: log.RetentionDays.ONE_DAY,
        }),
      });

    apisix.addPortMappings({
      containerPort: 9080,
    });

    taskDefinition.addVolume({
      name: 'etcd-data',
      efsVolumeConfiguration: {
        fileSystemId: fs.fileSystemId,
      },
    });

    taskDefinition.addToExecutionRolePolicy(new iam.PolicyStatement({
      actions: [
        'elasticfilesystem:ClientMount',
        'elasticfilesystem:ClientWrite',
      ],
      resources: [
        stack.formatArn({
          service: 'elasticfilesystem',
          resource: 'file-system',
          sep: '/',
          resourceName: fs.fileSystemId,
        }),
      ],
    }));

    const etcdContainer = taskDefinition
      .addContainer('etcd', {
        // image: ContainerImage.fromRegistry('gcr.azk8s.cn/etcd-development/etcd:v3.3.12'),
        // image: ecs.ContainerImage.fromRegistry('public.ecr.aws/bitnami/etcd:3.4.14'),
        image: props.etcdContainer,
        environment: {
          // ETCD_DATA_DIR: '/etcd_data',
          ETCD_ENABLE_V2: 'true',
          ALLOW_NONE_AUTHENTICATION: 'yes',
          ETCD_ADVERTISE_CLIENT_URLS: 'http://0.0.0.0:2379',
          ETCD_LISTEN_CLIENT_URLS: 'http://0.0.0.0:2379',
        },
        logging: new ecs.AwsLogDriver({
          streamPrefix: 'etcd',
          logRetention: log.RetentionDays.ONE_DAY,
        }),
      });
    etcdContainer.addMountPoints({
      containerPath: '/etcd_data',
      sourceVolume: 'etcd-data',
      readOnly: false,
    });

    etcdContainer.addPortMappings({
      containerPort: 2379,
    });

    apisix.addContainerDependencies({
      container: etcdContainer,
      condition: ecs.ContainerDependencyCondition.START,
    });

    // add dashboard container
    const dashboard = taskDefinition.addContainer('dashboard', {
      // image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../apisix_dashboard')),
      image: props.dashboardContainer,
      logging: new ecs.AwsLogDriver({
        streamPrefix: 'dashboard',
        logRetention: log.RetentionDays.ONE_DAY,
      }),
    });
    dashboard.addPortMappings({
      containerPort: 9000,
    });
    dashboard.addContainerDependencies({
      container: etcdContainer,
      condition: ecs.ContainerDependencyCondition.START,
    });

    const apisixService = new ecs.FargateService(this, 'APISIXService', {
      cluster,
      taskDefinition,
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
    });

    /**
     * create ALB
     */
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', { vpc, internetFacing: true });

    // APISIX listener on 80
    const apisixListener = new elbv2.ApplicationListener(this, 'APISIXListener', {
      loadBalancer: alb,
      // defaultTargetGroups: [apisixTG],
      port: 80,
    });

    apisixListener.addTargets('ApiSixTargets', {
      port: 80,
      targets: [
        apisixService.loadBalancerTarget({
          containerName: 'apisix',
          containerPort: 9080,
        }),
      ],
      healthCheck: {
        healthyHttpCodes: '200-499',
      },
    });

    // dashboard listener on 9000
    const dashboardListener = new elbv2.ApplicationListener(this, 'DashboardListener', {
      loadBalancer: alb,
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 9000,
    });

    dashboardListener.addTargets('DashboardTargets', {
      port: 9000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [
        apisixService.loadBalancerTarget({
          containerName: 'dashboard',
          containerPort: 9000,
        }),
      ],
      healthCheck: {
        healthyHttpCodes: '200-499',
      },
    });

    // allow all traffic from ALB to service
    apisixService.connections.allowFrom(alb, Port.allTraffic());

    // allow connection between efs filesystem
    apisixService.connections.allowFrom(fs, Port.tcp(2049));
    apisixService.connections.allowTo(fs, Port.tcp(2049));

    /**
     * Flask service
     */
    const flaskTask = new ecs.FargateTaskDefinition(this, 'TaskFlask', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    flaskTask
      .addContainer('flask', {
        image: ecs.ContainerImage.fromRegistry('public.ecr.aws/d7p2r8s3/flask-docker-sample'),
        environment: {
          PLATFORM: 'Apache APISIX on AWS Fargate with AWS CDK',
        },
        logging: new ecs.AwsLogDriver({
          streamPrefix: 'flask',
          logRetention: log.RetentionDays.ONE_DAY,
        }),
      })
      .addPortMappings({
        containerPort: 80,
      });

    const svcFlask = new NetworkLoadBalancedFargateService(this, 'FlaskService', {
      cluster,
      taskDefinition: flaskTask,
      assignPublicIp: true,
    });

    // allow Fargate task behind NLB to accept all traffic
    svcFlask.service.connections.allowFromAnyIpv4(Port.tcp(80));
    svcFlask.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '30');
    svcFlask.loadBalancer.setAttribute('load_balancing.cross_zone.enabled', 'true');

    new cdk.CfnOutput(this, 'ApiSixURL', {
      value: `http://${alb.loadBalancerDnsName}`,
    });
  }
  private _createEfsFilesystem(): efs.IFileSystem {
    return new efs.FileSystem(this, 'filesystem', {
      vpc: this.vpc,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}

function getOrCreateVpc(scope: cdk.Construct): IVpc {
  // use an existing vpc or create a new one
  return scope.node.tryGetContext('use_default_vpc') === '1' ?
    Vpc.fromLookup(scope, 'Vpc', { isDefault: true }) :
    scope.node.tryGetContext('use_vpc_id') ?
      Vpc.fromLookup(scope, 'Vpc', { vpcId: scope.node.tryGetContext('use_vpc_id') }) :
      new Vpc(scope, 'Vpc', { maxAzs: 3, natGateways: 1 });
}
