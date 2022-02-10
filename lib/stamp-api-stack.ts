import {
    aws_certificatemanager,
    aws_lambda,
    aws_lambda_nodejs,
    aws_logs,
    aws_route53,
    aws_route53_targets,
    CfnOutput,
    Duration,
    Stack,
    StackProps
} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {CorsHttpMethod, DomainName, HttpApi, SecurityPolicy, HttpMethod} from '@aws-cdk/aws-apigatewayv2-alpha';
import {HttpLambdaIntegration} from '@aws-cdk/aws-apigatewayv2-integrations-alpha';


export class StampApiStack extends Stack {
    constructor(scope: Construct, id: string, rootDomainName: string | undefined, props?: StackProps) {
        super(scope, id, props);

        let defaultDomainMapping = undefined
        if (rootDomainName) {
            // If we have a particular domain name we want to put the API under instead of the generated API Gateway ID
            const hostedZone = aws_route53.HostedZone.fromLookup(this, 'zone', {domainName: rootDomainName})

            const domainName = `stamp-api.${hostedZone.zoneName}`

            const cert = new aws_certificatemanager.DnsValidatedCertificate(this, 'cert', {
                domainName: domainName,
                hostedZone: hostedZone,
            })

            const apiDomainName = new DomainName(this, 'apiDomain', {
                certificate: cert,
                domainName: domainName,
                securityPolicy: SecurityPolicy.TLS_1_2
            })

            const dnsRecord = new aws_route53.ARecord(this, 'apiDns', {
                recordName: domainName,
                target: aws_route53.RecordTarget.fromAlias(
                    new aws_route53_targets.ApiGatewayv2DomainProperties(
                        apiDomainName.regionalDomainName,
                        apiDomainName.regionalHostedZoneId
                    )
                ),
                zone: hostedZone,
            })

            defaultDomainMapping = {
                domainName: apiDomainName,
                mappingKey: "discord"
            }

            new CfnOutput(this, 'api-base-url',
                {value: `https://${domainName}/${defaultDomainMapping.mappingKey}/`}
            )
        }

        const api = new HttpApi(this, 'discordApi', {
            corsPreflight: {
                allowHeaders: ['Content-Type', 'Authorization'],
                allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
                allowOrigins: ['*'],
                maxAge: Duration.hours(12)
            },
            defaultDomainMapping
        });

        if (!defaultDomainMapping) {
            new CfnOutput(this, 'api-base-url', {value: `https://${api.url}/`})
        }

        const discordInteraction = new aws_lambda_nodejs.NodejsFunction(this, 'discordInteraction', {
            architecture: aws_lambda.Architecture.ARM_64,
            memorySize: 256,
            entry: `${__dirname}/api/discordInteractionsEndpoint.ts`,
            logRetention: aws_logs.RetentionDays.ONE_WEEK,
            environment: {
                PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY || "UNDEFINED",
            }
        })

        api.addRoutes({
            integration: new HttpLambdaIntegration('twitchAuthCallbackInt', discordInteraction),
            methods: [HttpMethod.POST],
            path: '/',
        });
    }
}
