import { Vpc, Port, IVpc } from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import { NetworkLoadBalancedFargateService } from '@aws-cdk/aws-ecs-patterns';
import * as efs from '@aws-cdk/aws-efs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as iam from '@aws-cdk/aws-iam';
import * as log from '@aws-cdk/aws-logs';
import * as cdk from '@aws-cdk/core';

const DEFAULTS = {
  apisixContainer: 'public.ecr.aws/d7p2r8s3/apisix',
  etcdContainer: 'public.ecr.aws/eks-distro/etcd-io/etcd:v3.4.14-eks-1-18-1',
  dashboardContainer: 'public.ecr.aws/d7p2r8s3/apisix-dashboard',
};

/**
 * construct properties for Apisix
 */
export interface ApisixProps {
  /**
   * Vpc for the APISIX
   * @default - create a new VPC or use existing one
   */
  readonly vpc?: IVpc;
  /**
   * Amazon ECS cluster
   * @default - create a new cluster
   */
  readonly cluster?: ecs.ICluster;
  /**
   * Amazon EFS filesystem for etcd data persistence
   * @default - ceate a new filesystem
   */
  readonly efsFilesystem?: efs.IFileSystem;
  /**
   * container for APISIX API service
   * @default - public.ecr.aws/d7p2r8s3/apisix
   */
  readonly apisixContainer?: ecs.ContainerImage;
  /**
   * container for the dashboard
   * @default - public.ecr.aws/d7p2r8s3/apisix-dashboard
   */
  readonly dashboardContainer?: ecs.ContainerImage;
  /**
   * container for the etcd
   * @default - public.ecr.aws/eks-distro/etcd-io/etcd:v3.4.14-eks-1-18-1
   */
  readonly etcdContainer?: ecs.ContainerImage;
}

/**
 * options for createWebService
 */
export interface WebServiceOptions {
  readonly image?: ecs.RepositoryImage;
  readonly port?: number;
  readonly environment?: {
    [key: string]: string;
  };
}

/**
 * The Apisix construct
 */
export class Apisix extends cdk.Construct {
  readonly vpc: IVpc;
  readonly cluster: ecs.ICluster;
  constructor(scope: cdk.Construct, id: string, props: ApisixProps = {}) {
    super(scope, id);

    const stack = cdk.Stack.of(this);
    const vpc = props.vpc ?? getOrCreateVpc(this);
    this.vpc = vpc;
    const cluster = props.cluster ?? new ecs.Cluster(this, 'Cluster', { vpc });
    this.cluster = cluster;

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
        image: props.apisixContainer ?? ecs.ContainerImage.fromRegistry(DEFAULTS.apisixContainer),
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
        image: props.etcdContainer ?? ecs.ContainerImage.fromRegistry(DEFAULTS.etcdContainer),
        environment: {
          ETCD_DATA_DIR: '/etcd_data',
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
      image: props.dashboardContainer ?? ecs.ContainerImage.fromRegistry(DEFAULTS.dashboardContainer),
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

  /**
   * Create a basic web service on AWS Fargate
   */
  public createWebService(id: string, options: WebServiceOptions ): NetworkLoadBalancedFargateService {
    // flask service
    const DEFAULT_SERVICE_IMAGE = 'public.ecr.aws/d7p2r8s3/flask-docker-sample';

    const task = new ecs.FargateTaskDefinition(this, `task${id}`, {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    task
      .addContainer(`container${id}`, {
        image: options.image ?? ecs.ContainerImage.fromRegistry(DEFAULT_SERVICE_IMAGE),
        environment: options.environment,
        logging: new ecs.AwsLogDriver({
          streamPrefix: id,
          logRetention: log.RetentionDays.ONE_DAY,
        }),
      })
      .addPortMappings({
        containerPort: options.port ?? 80,
      });

    const service = new NetworkLoadBalancedFargateService(this, `service${id}`, {
      cluster: this.cluster,
      taskDefinition: task,
      assignPublicIp: true,
    });

    // allow Fargate task behind NLB to accept all traffic
    service.service.connections.allowFromAnyIpv4(Port.tcp(80));
    service.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '30');
    service.loadBalancer.setAttribute('load_balancing.cross_zone.enabled', 'true');
    return service;
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
